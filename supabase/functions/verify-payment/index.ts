import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, isAllowedOrigin } from "../_shared/cors.ts";

const json = (body: unknown, status = 200, origin: string | null = null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });

const encoder = new TextEncoder();
const hexBytes = (hex: string) =>
  Uint8Array.from(hex.match(/.{2}/g) || [], (byte) => parseInt(byte, 16));

async function matchesHmac(secret: string, message: string, suppliedHex: string) {
  if (!/^[a-f0-9]{64}$/i.test(suppliedHex)) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  return crypto.subtle.verify("HMAC", key, hexBytes(suppliedHex), encoder.encode(message));
}

Deno.serve(async (request) => {
  const origin = request.headers.get("Origin");
  const reply = (body: unknown, status = 200) => json(body, status, origin);
  if (!isAllowedOrigin(origin)) return reply({ error: "Origin is not allowed." }, 403);
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (request.method !== "POST") return reply({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

  if (!url || !anon || !serviceKey || !keyId || !keySecret) {
    return reply({ error: "Payment verification service is not configured." }, 503);
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization) return reply({ error: "Sign in to verify this payment." }, 401);

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return reply({ error: "Your session has expired." }, 401);

  const body = (await request.json().catch(() => null)) as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  } | null;

  if (!body?.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
    return reply({ error: "Incomplete payment response from gateway." }, 400);
  }

  const service = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: payment, error } = await service
    .from("payments")
    .select("order_id,amount,currency,provider_order_id,orders!inner(id,customer_id,order_number,status)")
    .eq("provider_order_id", body.razorpay_order_id)
    .single();

  if (error || !payment || (payment.orders as any).customer_id !== user.id) {
    return reply({ error: "Payment order was not found for this account." }, 404);
  }

  if (payment.provider_order_id !== body.razorpay_order_id) {
    return reply({ error: "Payment order identifier mismatch." }, 400);
  }

  // 1. Verify HMAC Signature
  const isValidSignature = await matchesHmac(
    keySecret,
    `${body.razorpay_order_id}|${body.razorpay_payment_id}`,
    body.razorpay_signature
  );
  if (!isValidSignature) {
    return reply({ error: "Razorpay payment signature verification failed." }, 400);
  }

  // 2. Double-check remote Razorpay payment status
  const providerResponse = await fetch(
    `https://api.razorpay.com/v1/payments/${encodeURIComponent(body.razorpay_payment_id)}`,
    {
      headers: { Authorization: "Basic " + btoa(keyId + ":" + keySecret) },
    }
  );

  if (!providerResponse.ok) {
    return reply({ error: "Could not confirm payment capture with Razorpay." }, 502);
  }

  const remotePayment = await providerResponse.json();
  if (
    remotePayment.order_id !== body.razorpay_order_id ||
    Number(remotePayment.amount) !== Math.round(Number(payment.amount) * 100) ||
    remotePayment.currency !== payment.currency
  ) {
    return reply({ error: "Payment amount or currency mismatch." }, 400);
  }

  if (remotePayment.status !== "captured") {
    return reply(
      {
        error:
          "Payment is authorized but not yet captured. The order will be confirmed once capture completes.",
      },
      409
    );
  }

  // 3. Confirm in Supabase via RPC
  const { error: confirmError } = await service.rpc("confirm_payment_from_webhook", {
    p_order: payment.order_id,
    p_provider: "razorpay",
    p_payment_id: body.razorpay_payment_id,
    p_payload: {
      order_id: body.razorpay_order_id,
      source: "checkout_verification",
      status: remotePayment.status,
      method: remotePayment.method,
      bank: remotePayment.bank,
      wallet: remotePayment.wallet,
      vpa: remotePayment.vpa,
    },
  });

  if (confirmError) {
    return reply(
      { error: "Payment is captured, but database order confirmation encountered an error." },
      503
    );
  }

  // 4. Send customer notification
  const orderDetails = payment.orders as any;
  await service.from("customer_notifications").insert({
    customer_id: user.id,
    order_id: payment.order_id,
    event_type: "payment_confirmed",
    title: "Payment Confirmed",
    message: `Payment of ₹${Number(payment.amount).toLocaleString('en-IN')} confirmed for order #${orderDetails.order_number}. We are preparing your order for dispatch.`,
    metadata: {
      order_number: orderDetails.order_number,
      payment_id: body.razorpay_payment_id,
      amount: payment.amount,
      method: remotePayment.method,
    }
  }).catch(() => null);

  return reply({
    verified: true,
    order_id: payment.order_id,
    order_number: orderDetails.order_number,
    status: "paid",
  });
});
