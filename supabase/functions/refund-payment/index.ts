import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, isAllowedOrigin } from "../_shared/cors.ts";

const json = (body: unknown, status = 200, origin: string | null = null) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } });

Deno.serve(async (request) => {
  const origin = request.headers.get("Origin");
  const reply = (body: unknown, status = 200) => json(body, status, origin);
  if (!isAllowedOrigin(origin)) return reply({ error: "Origin is not allowed." }, 403);
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (request.method !== "POST") return reply({ error: "Method not allowed." }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!url || !anonKey || !serviceKey || !keyId || !keySecret) return reply({ error: "Refund service is not configured." }, 503);
  const authorization = request.headers.get("Authorization");
  if (!authorization) return reply({ error: "Sign in with an order-management account." }, 401);
  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return reply({ error: "Your session has expired." }, 401);
  const { data: roles } = await userClient.from("admin_roles").select("role").eq("user_id", user.id);
  if (!(roles || []).some((item: any) => ["owner", "admin", "order_manager"].includes(item.role))) return reply({ error: "Order-management permission is required." }, 403);
  const body = await request.json().catch(() => null) as { order_id?: string; amount_paise?: number; reason?: string; idempotency_key?: string } | null;
  if (!body?.order_id || !Number.isSafeInteger(body.amount_paise) || Number(body.amount_paise) <= 0 || typeof body.idempotency_key !== "string" || body.idempotency_key.length < 16 || body.idempotency_key.length > 100) return reply({ error: "Order, positive amount in paise and idempotency key are required." }, 400);

  const mode = Deno.env.get("PAYMENTS_MODE");
  const environment = Deno.env.get("SUPABASE_ENVIRONMENT");
  if (mode === "live") {
    if (environment !== "production" || !keyId.startsWith("rzp_live_") || Deno.env.get("PAYMENTS_LIVE_ENABLED") !== "true" || Deno.env.get("PAYMENTS_LIVE_WEBHOOK_VERIFIED") !== "true") return reply({ error: "Live refunds are locked until production credentials and the webhook are verified." }, 503);
  } else if (mode !== "test" || environment !== "preview" || !keyId.startsWith("rzp_test_")) return reply({ error: "Refunds require the correct test or production project configuration." }, 503);

  const service = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: payment, error: paymentError } = await service.from("payments").select("id,provider,provider_payment_id,status,amount,currency,orders!inner(id,status,payment_method)").eq("order_id", body.order_id).single();
  if (paymentError || !payment) return reply({ error: "Order payment was not found." }, 404);
  if (payment.provider !== "razorpay" || payment.status !== "captured" || !payment.provider_payment_id) return reply({ error: "Only captured Razorpay payments can be refunded." }, 409);
  const amount = Number(body.amount_paise) / 100;
  if (Math.round(amount * 100) !== body.amount_paise) return reply({ error: "Refund amount must be a whole number of paise." }, 400);
  const { data: refundId, error: createError } = await service.rpc("request_refund", { p_payment_id: payment.id, p_amount: amount, p_reason: body.reason || "", p_idempotency_key: body.idempotency_key, p_actor: user.id });
  if (createError) return reply({ error: createError.message }, 400);
  const { data: refund, error: refundReadError } = await service.from("refunds").select("id,provider_refund_id,status,amount").eq("id", refundId).single();
  if (refundReadError || !refund) return reply({ error: "Refund request was saved but could not be loaded." }, 500);
  if (refund.provider_refund_id) return reply({ refund_id: refund.id, provider_refund_id: refund.provider_refund_id, status: refund.status });
  const { data: claimed, error: claimError } = await service.rpc("claim_refund_provider_request", { p_refund_id: refund.id });
  if (claimError || !claimed) return reply({ error: "This refund is already being sent or needs provider reconciliation." }, 409);

  let providerResponse: Response;
  try {
    providerResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(payment.provider_payment_id)}/refund`, {
      method: "POST",
      headers: { Authorization: "Basic " + btoa(keyId + ":" + keySecret), "Content-Type": "application/json" },
      body: JSON.stringify({ amount: body.amount_paise, notes: { little_loom_refund_id: refund.id, reason: (body.reason || "").slice(0, 200) } }),
    });
  } catch {
    return reply({ error: "Razorpay did not confirm the refund request. The request is held for reconciliation; do not retry with a new key." }, 503);
  }
  if (!providerResponse.ok) {
    const detail = await providerResponse.text();
    if (providerResponse.status >= 400 && providerResponse.status < 500 && providerResponse.status !== 408 && providerResponse.status !== 429) {
      await service.from("refunds").update({ status: "failed", provider_payload: { provider_status: providerResponse.status } }).eq("id", refund.id);
    }
    return reply({ error: `Razorpay rejected the refund request (${providerResponse.status}).`, detail: detail.slice(0, 250) }, 502);
  }
  const providerRefund = await providerResponse.json();
  const { error: saveError } = await service.from("refunds").update({ provider_refund_id: providerRefund.id, provider_payload: { status: providerRefund.status, payment_id: providerRefund.payment_id } }).eq("id", refund.id);
  if (saveError) return reply({ error: "Razorpay accepted the refund; its reference could not be saved. Reconcile before retrying." }, 500);
  return reply({ refund_id: refund.id, provider_refund_id: providerRefund.id, status: providerRefund.status });
});
