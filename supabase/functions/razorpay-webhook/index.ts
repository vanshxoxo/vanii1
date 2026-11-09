import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const encoder = new TextEncoder();
const hexBytes = (hex: string) => Uint8Array.from(hex.match(/.{2}/g) || [], (byte) => parseInt(byte, 16));
async function validSignature(secret: string, body: string, suppliedHex: string) {
  if (!/^[a-f0-9]{64}$/i.test(suppliedHex)) return false;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
  return crypto.subtle.verify("HMAC", key, hexBytes(suppliedHex), encoder.encode(body));
}
async function sha256(value: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  if (!url || !serviceKey || !secret) return json({ error: "Webhook is not configured." }, 503);
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";
  if (!await validSignature(secret, rawBody, signature)) return json({ error: "Invalid webhook signature." }, 401);
  let event: any;
  try { event = JSON.parse(rawBody); } catch { return json({ error: "Invalid JSON." }, 400); }
  const eventId = request.headers.get("x-razorpay-event-id") || await sha256(rawBody);
  const service = createClient(url, serviceKey, { auth: { persistSession: false } });

  if (event.event === "payment.captured") {
    const entity = event.payload?.payment?.entity;
    if (!entity?.id || !entity?.order_id) return json({ error: "Payment event is missing identifiers." }, 400);
    const { data: payment, error } = await service.from("payments").select("order_id,amount,currency,provider_order_id").eq("provider_order_id", entity.order_id).single();
    if (error || !payment) return json({ error: "Payment order is unknown." }, 404);
    if (Number(entity.amount) !== Math.round(Number(payment.amount) * 100) || entity.currency !== payment.currency) return json({ error: "Captured amount does not match the order." }, 400);
    const { error: confirmError } = await service.rpc("confirm_payment_from_webhook", { p_order: payment.order_id, p_provider: "razorpay", p_payment_id: entity.id, p_payload: { order_id: entity.order_id, event: event.event, status: entity.status } });
    if (confirmError) return json({ error: "Could not confirm the payment in the database." }, 500);
  } else if (event.event === "payment.failed") {
    const entity = event.payload?.payment?.entity;
    if (!entity?.id || !entity?.order_id) return json({ error: "Payment event is missing identifiers." }, 400);
    const { data: payment, error } = await service.from("payments").select("id,order_id,provider_order_id,status,orders!inner(status)").eq("provider_order_id", entity.order_id).single();
    if (error || !payment) return json({ error: "Payment order is unknown." }, 404);
    if (payment.status === "pending" && (payment.orders as any).status === "pending_payment") {
      const { error: updateError } = await service.from("payments").update({ provider: "razorpay", provider_payment_id: entity.id, status: "failed", provider_payload: { order_id: entity.order_id, event: event.event, status: entity.status } }).eq("id", payment.id).eq("status", "pending");
      if (updateError) return json({ error: "Could not record failed payment." }, 500);
    }
  } else if (event.event === "refund.processed" || event.event === "refund.failed") {
    const entity = event.payload?.refund?.entity;
    if (!entity?.id || !entity?.payment_id) return json({ error: "Refund event is missing identifiers." }, 400);
    const { data: refund, error } = await service.from("refunds").select("id,payment_id,amount,payments!inner(provider_payment_id,amount,order_id)").eq("provider_refund_id", entity.id).single();
    if (error || !refund) return json({ error: "Refund reference is unknown." }, 404);
    const payment = refund.payments as any;
    if (payment.provider_payment_id !== entity.payment_id || Number(entity.amount) !== Math.round(Number(refund.amount) * 100)) return json({ error: "Refund amount or payment reference did not match." }, 400);
    const refundStatus = event.event === "refund.processed" ? "processed" : "failed";
    const { error: refundError } = await service.from("refunds").update({ status: refundStatus, provider_payload: { event: event.event, status: entity.status } }).eq("id", refund.id);
    if (refundError) return json({ error: "Could not record the refund event." }, 500);
    if (refundStatus === "processed") {
      const { data: completed, error: sumError } = await service.from("refunds").select("amount").eq("payment_id", refund.payment_id).eq("status", "processed");
      if (sumError) return json({ error: "Refund recorded; payment reconciliation is pending." }, 500);
      const refunded = (completed || []).reduce((sum: number, row: any) => sum + Number(row.amount), 0);
      if (refunded >= Number(payment.amount)) {
        const { error: paymentError } = await service.from("payments").update({ status: "refunded", provider_payload: { last_refund_event: event.event } }).eq("id", refund.payment_id);
        if (paymentError) return json({ error: "Refund recorded; payment status reconciliation is pending." }, 500);
        const { error: orderError } = await service.from("orders").update({ status: "refunded" }).eq("id", payment.order_id);
        if (orderError) return json({ error: "Refund recorded; order status reconciliation is pending." }, 500);
      }
    }
  } else {
    return json({ received: true });
  }

  const { error: logError } = await service.from("payment_webhook_events").upsert({ provider: "razorpay", event_id: eventId, event_type: event.event, processed_at: new Date().toISOString() }, { onConflict: "provider,event_id", ignoreDuplicates: true });
  if (logError) return json({ error: "Payment update was applied; webhook event logging needs retry." }, 500);
  return json({ received: true });
});
