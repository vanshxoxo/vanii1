import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, isAllowedOrigin } from "../_shared/cors.ts";

const json = (body: unknown, status = 200, origin: string | null = null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });

Deno.serve(async (request) => {
  const origin = request.headers.get("Origin");
  const reply = (body: unknown, status = 200) => json(body, status, origin);
  if (!isAllowedOrigin(origin)) return reply({ error: "Origin is not allowed." }, 403);
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (request.method !== "POST") return reply({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) {
    return reply({ error: "Checkout service is not configured." }, 503);
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization) return reply({ error: "Sign in before checkout." }, 401);

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return reply({ error: "Your session has expired. Sign in again." }, 401);

  const service = createClient(url, serviceKey, { auth: { persistSession: false } });

  let body: { method?: string; address?: Record<string, unknown>; idempotency_key?: string };
  try {
    body = await request.json();
  } catch {
    return reply({ error: "Invalid request body." }, 400);
  }

  const method = body.method;
  const address = body.address;
  const key = body.idempotency_key;

  if (
    !address ||
    typeof address !== "object" ||
    typeof key !== "string" ||
    key.length < 16 ||
    key.length > 100
  ) {
    return reply({ error: "Delivery address and idempotency key are required." }, 400);
  }

  // 1. CASH ON DELIVERY (COD)
  if (method === "cod") {
    const { data: orderId, error: orderError } = await userClient.rpc("place_cod_order", {
      p_address: address,
      p_idempotency_key: key,
    });
    if (orderError) return reply({ error: orderError.message }, 400);

    const { data: order, error: readError } = await userClient
      .from("orders")
      .select("id,order_number,status,total,currency,payment_method")
      .eq("id", orderId)
      .single();

    if (readError) {
      return reply({ error: "Order was created but confirmation details could not be loaded." }, 500);
    }

    // Insert order placement notification
    await service.from("customer_notifications").insert({
      customer_id: user.id,
      order_id: order.id,
      event_type: "order_placed",
      title: "Order Placed Successfully",
      message: `Your COD order #${order.order_number} for ₹${Number(order.total).toLocaleString('en-IN')} has been placed. Payment is due on delivery.`,
      metadata: { order_number: order.order_number, payment_method: "cod", total: order.total }
    }).catch(() => null);

    return reply({
      order_id: order.id,
      order_number: order.order_number,
      status: order.status,
      payment_method: order.payment_method,
    });
  }

  // 2. PREPAID ONLINE CHECKOUT (RAZORPAY)
  if (method !== "razorpay") return reply({ error: "Choose a supported payment method." }, 400);

  const mode = (Deno.env.get("PAYMENTS_MODE") || "test").toLowerCase();
  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

  if (!keyId || !keySecret) {
    return reply(
      { error: "Online payments are not enabled. Razorpay API credentials are required." },
      503
    );
  }

  if (mode === "live") {
    if (
      !keyId.startsWith("rzp_live_") ||
      Deno.env.get("PAYMENTS_LIVE_ENABLED") !== "true"
    ) {
      return reply(
        { error: "Live payments are locked until production credentials and webhook are verified." },
        503
      );
    }
  } else if (mode === "test") {
    if (!keyId.startsWith("rzp_test_")) {
      return reply(
        { error: "Test payments require a Razorpay test key (rzp_test_...)." },
        503
      );
    }
  }

  // Create or retrieve existing order for this idempotency key
  const { data: orderId, error: orderError } = await userClient.rpc("place_order_from_active_cart", {
    p_address: address,
    p_idempotency_key: key,
  });
  if (orderError) return reply({ error: orderError.message }, 400);

  const { data: order, error: readError } = await userClient
    .from("orders")
    .select("id,order_number,total,currency,payment_method,customer_email_snapshot")
    .eq("id", orderId)
    .single();

  if (readError) return reply({ error: "Order was saved but could not be loaded." }, 500);
  if (order.payment_method !== "razorpay") {
    return reply({ error: "This checkout session was already used for another payment method." }, 409);
  }

  const { data: payment, error: paymentReadError } = await service
    .from("payments")
    .select("provider_order_id,provider_order_creation_started_at")
    .eq("order_id", order.id)
    .single();

  if (paymentReadError) return reply({ error: "Payment record is not available." }, 500);

  let providerOrderId = payment.provider_order_id as string | null;

  if (!providerOrderId) {
    const { data: claimed, error: claimError } = await service.rpc("claim_razorpay_order_creation", {
      p_order_id: order.id,
    });
    if (claimError) return reply({ error: "Could not safely start payment. Retry shortly." }, 503);

    if (!claimed) {
      // Another worker claimed creation; wait briefly for order ID
      for (let attempt = 0; attempt < 8; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const { data: current } = await service
          .from("payments")
          .select("provider_order_id")
          .eq("order_id", order.id)
          .single();
        if (current?.provider_order_id) {
          providerOrderId = current.provider_order_id;
          break;
        }
      }
      if (!providerOrderId) {
        return reply({ error: "This payment is already being prepared. Retry in a few seconds." }, 409);
      }
    } else {
      const amountPaise = Math.round(Number(order.total) * 100);
      let providerResponse: Response;
      try {
        providerResponse = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            Authorization: "Basic " + btoa(keyId + ":" + keySecret),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: amountPaise,
            currency: order.currency || "INR",
            receipt: `VJ-${order.order_number}`,
            notes: {
              vj_collection_order_id: order.id,
              order_number: String(order.order_number),
              customer_email: order.customer_email_snapshot || "",
            },
          }),
        });
      } catch {
        return reply(
          {
            error:
              "Razorpay gateway response was interrupted. The order is safely held; retry payment shortly.",
          },
          503
        );
      }

      if (!providerResponse.ok) {
        const failed = await providerResponse.text();
        if (
          providerResponse.status >= 400 &&
          providerResponse.status < 500 &&
          providerResponse.status !== 408 &&
          providerResponse.status !== 429
        ) {
          await service
            .from("payments")
            .update({ provider: "unconfigured", provider_order_creation_started_at: null })
            .eq("order_id", order.id)
            .is("provider_order_id", null);
        }
        return reply(
          {
            error: `Razorpay could not create the payment order (${providerResponse.status}).`,
            detail: failed.slice(0, 300),
          },
          502
        );
      }

      const created = await providerResponse.json();
      providerOrderId = created.id;

      const { error: saveError } = await service
        .from("payments")
        .update({
          provider: "razorpay",
          provider_order_id: providerOrderId,
          provider_order_creation_started_at: null,
        })
        .eq("order_id", order.id)
        .is("provider_order_id", null);

      if (saveError) {
        return reply(
          {
            error:
              "Razorpay order created but reference could not be saved. Contact support before retrying.",
          },
          500
        );
      }
    }
  }

  return reply({
    order_id: order.id,
    order_number: order.order_number,
    razorpay_order_id: providerOrderId,
    key_id: keyId,
    amount: Math.round(Number(order.total) * 100),
    currency: order.currency || "INR",
  });
});
