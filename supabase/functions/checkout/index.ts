import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": Deno.env.get("STOREFRONT_ORIGIN") || "https://vanii1.vercel.app",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (request) => {
  const origin = request.headers.get("Origin");
  if (origin && origin !== (Deno.env.get("STOREFRONT_ORIGIN") || "https://vanii1.vercel.app")) return json({ error: "Origin is not allowed." }, 403);
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return json({ error: "Checkout service is not configured." }, 503);

  const authorization = request.headers.get("Authorization");
  if (!authorization) return json({ error: "Sign in before checkout." }, 401);
  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return json({ error: "Your session has expired. Sign in again." }, 401);
  const service = createClient(url, serviceKey, { auth: { persistSession: false } });

  let body: { method?: string; address?: Record<string, unknown>; idempotency_key?: string };
  try { body = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
  const method = body.method;
  const address = body.address;
  const key = body.idempotency_key;
  if (!address || typeof address !== "object" || typeof key !== "string" || key.length < 16 || key.length > 100) return json({ error: "Address and idempotency key are required." }, 400);

  if (method === "cod") {
    const { data: orderId, error: orderError } = await userClient.rpc("place_cod_order", { p_address: address, p_idempotency_key: key });
    if (orderError) return json({ error: orderError.message }, 400);
    const { data: order, error: readError } = await userClient.from("orders").select("id,order_number,status,total,currency,payment_method").eq("id", orderId).single();
    if (readError) return json({ error: "Order was created but the confirmation could not be loaded." }, 500);
    return json({ order_id: order.id, order_number: order.order_number, status: order.status, payment_method: order.payment_method });
  }
  if (method !== "razorpay") return json({ error: "Choose a supported payment method." }, 400);

  const mode = Deno.env.get("PAYMENTS_MODE");
  const environment = Deno.env.get("SUPABASE_ENVIRONMENT");
  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  const webhookSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  if (!keyId || !keySecret || !webhookSecret) return json({ error: "Online payments are not enabled. Razorpay secrets and webhook setup are required." }, 503);
  if (mode === "live") {
    if (environment !== "production" || !keyId.startsWith("rzp_live_") || Deno.env.get("PAYMENTS_LIVE_ENABLED") !== "true" || Deno.env.get("PAYMENTS_LIVE_WEBHOOK_VERIFIED") !== "true") return json({ error: "Live payments are locked until production credentials and the webhook are verified." }, 503);
  } else if (mode === "test") {
    if (environment !== "preview" || !keyId.startsWith("rzp_test_")) return json({ error: "Test payments are restricted to a dedicated preview project." }, 503);
  } else return json({ error: "Set PAYMENTS_MODE to test or live in the appropriate Supabase project." }, 503);

  const { data: orderId, error: orderError } = await userClient.rpc("place_order_from_active_cart", { p_address: address, p_idempotency_key: key });
  if (orderError) return json({ error: orderError.message }, 400);
  const { data: order, error: readError } = await userClient.from("orders").select("id,order_number,total,currency,payment_method").eq("id", orderId).single();
  if (readError) return json({ error: "Order was saved but could not be loaded." }, 500);
  if (order.payment_method !== "razorpay") return json({ error: "This checkout session was already used for another payment method." }, 409);

  const { data: payment, error: paymentReadError } = await service.from("payments").select("provider_order_id,provider_order_creation_started_at").eq("order_id", order.id).single();
  if (paymentReadError) return json({ error: "Payment record is not available." }, 500);
  let providerOrderId = payment.provider_order_id as string | null;
  if (!providerOrderId) {
    const { data: claimed, error: claimError } = await service.rpc("claim_razorpay_order_creation", { p_order_id: order.id });
    if (claimError) return json({ error: "Could not safely start payment. Retry shortly." }, 503);
    if (!claimed) {
      for (let attempt = 0; attempt < 8; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const { data: current } = await service.from("payments").select("provider_order_id").eq("order_id", order.id).single();
        if (current?.provider_order_id) { providerOrderId = current.provider_order_id; break; }
      }
      if (!providerOrderId) return json({ error: "This payment is already being prepared. Retry in a few seconds." }, 409);
    } else {
      const amount = Math.round(Number(order.total) * 100);
      let providerResponse: Response;
      try {
        providerResponse = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: { "Authorization": "Basic " + btoa(keyId + ":" + keySecret), "Content-Type": "application/json" },
          body: JSON.stringify({ amount, currency: order.currency, receipt: "LL-" + order.order_number, notes: { little_loom_order_id: order.id } }),
        });
      } catch {
        return json({ error: "Razorpay's response was interrupted. The order is held for safe reconciliation; contact support before retrying payment." }, 503);
      }
      if (!providerResponse.ok) {
        const failed = await providerResponse.text();
        if (providerResponse.status >= 400 && providerResponse.status < 500 && providerResponse.status !== 408 && providerResponse.status !== 429) {
          await service.from("payments").update({ provider: "unconfigured", provider_order_creation_started_at: null }).eq("order_id", order.id).is("provider_order_id", null);
        }
        return json({ error: "Razorpay could not create the payment order (" + providerResponse.status + ").", detail: failed.slice(0, 300) }, 502);
      }
      const created = await providerResponse.json();
      providerOrderId = created.id;
      const { error: saveError } = await service.from("payments").update({ provider: "razorpay", provider_order_id: providerOrderId, provider_order_creation_started_at: null }).eq("order_id", order.id).is("provider_order_id", null);
      if (saveError) return json({ error: "Razorpay order exists but its reference could not be saved. Contact support before retrying." }, 500);
    }
  }
  return json({ order_id: order.id, order_number: order.order_number, razorpay_order_id: providerOrderId, key_id: keyId, amount: Math.round(Number(order.total) * 100), currency: order.currency });
});
