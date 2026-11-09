import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const origin = () => Deno.env.get("STOREFRONT_ORIGIN") || "https://vanii1.vercel.app";
const cors = () => ({ "Access-Control-Allow-Origin": origin(), "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors(), "Content-Type": "application/json" } });
const asRecord = (value: unknown) => value && typeof value === "object" ? value as Record<string, any> : {};
const safeProviderError = async (response: Response) => (await response.text()).slice(0, 250);

async function shiprocketToken(email: string, password: string) {
  const response = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
  if (!response.ok) throw new Error(`Shiprocket authentication failed (${response.status}).`);
  const body = asRecord(await response.json());
  if (typeof body.token !== "string") throw new Error("Shiprocket did not return an API token.");
  return body.token;
}

function shipmentStatus(raw: string) {
  const value = raw.toLowerCase();
  if (value.includes("delivered")) return "delivered";
  if (value.includes("out for delivery")) return "out_for_delivery";
  if (value.includes("in transit") || value.includes("shipped") || value.includes("picked up")) return "in_transit";
  if (value.includes("pickup") && value.includes("scheduled")) return "pickup_scheduled";
  if (value.includes("cancel")) return "cancelled";
  if (value.includes("rto") || value.includes("return")) return "returned";
  if (value.includes("exception") || value.includes("undelivered") || value.includes("lost") || value.includes("ndr")) return "exception";
  return "created";
}

Deno.serve(async (request) => {
  const requestOrigin = request.headers.get("Origin");
  if (requestOrigin && requestOrigin !== origin()) return json({ error: "Origin is not allowed." }, 403);
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors() });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const email = Deno.env.get("SHIPROCKET_EMAIL");
  const password = Deno.env.get("SHIPROCKET_PASSWORD");
  if (!url || !anonKey || !serviceKey || !email || !password) return json({ error: "Shipping integration is not configured." }, 503);
  const authorization = request.headers.get("Authorization");
  if (!authorization) return json({ error: "Sign in to manage or track shipments." }, 401);
  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: "Your session has expired." }, 401);
  const body = await request.json().catch(() => null) as { action?: string; order_id?: string } | null;
  if (!body?.order_id || !["create", "track"].includes(body.action || "")) return json({ error: "Choose a shipment action and order." }, 400);
  const { data: orderAccess } = await userClient.from("orders").select("id").eq("id", body.order_id).maybeSingle();
  if (!orderAccess) return json({ error: "Order was not found for this account." }, 404);
  const { data: roles } = await userClient.from("admin_roles").select("role").eq("user_id", user.id);
  const isOrderManager = (roles || []).some((role: any) => ["owner", "admin", "order_manager"].includes(role.role));
  if (body.action === "create" && !isOrderManager) return json({ error: "Order-management permission is required to create shipments." }, 403);

  const service = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: shipment, error: shipmentReadError } = await service.from("shipments").select("id,order_id,provider_order_id,shipment_id,awb_code,courier_name,status,creation_started_at").eq("order_id", body.order_id).eq("provider", "shiprocket").maybeSingle();
  if (shipmentReadError) return json({ error: "Could not load shipment record." }, 500);
  if (body.action === "track" && !shipment?.awb_code) return json({ error: "This order does not have a Shiprocket AWB yet." }, 409);
  let token: string;
  try { token = await shiprocketToken(email, password); }
  catch (cause) { return json({ error: cause instanceof Error ? cause.message : "Shiprocket authentication failed." }, 502); }

  if (body.action === "track") {
    const response = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${encodeURIComponent(shipment!.awb_code!)}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return json({ error: `Shiprocket tracking request failed (${response.status}).`, detail: await safeProviderError(response) }, 502);
    const trackResponse = asRecord(await response.json());
    const trackData = Array.isArray(trackResponse) ? asRecord(trackResponse[0]).tracking_data : trackResponse.tracking_data;
    const tracking = asRecord(trackData);
    const current = Array.isArray(tracking.shipment_track) ? asRecord(tracking.shipment_track[0]) : {};
    const rawStatus = String(current.current_status || tracking.current_status || "");
    const status = shipmentStatus(rawStatus);
    const trackingUrl = typeof tracking.track_url === "string" ? tracking.track_url : null;
    const { error: updateError } = await service.from("shipments").update({ status, raw_status: rawStatus, tracking_url: trackingUrl, provider_payload: { etd: tracking.etd || null, status: rawStatus } }).eq("id", shipment!.id);
    if (updateError) return json({ error: "Tracking was retrieved but could not be saved." }, 500);
    if (status === "delivered" && !isOrderManager) {
      const { data: order } = await service.from("orders").select("status,payment_method").eq("id", body.order_id).single();
      const { data: payment } = await service.from("payments").select("status").eq("order_id", body.order_id).single();
      if (order?.payment_method !== "cod" && order?.status === "shipped" && payment?.status === "captured") await service.from("orders").update({ status: "delivered" }).eq("id", body.order_id);
    }
    return json({ status, raw_status: rawStatus, tracking_url: trackingUrl, etd: tracking.etd || null });
  }

  if (shipment) {
    if (!shipment.shipment_id) return json({ error: "A shipment creation attempt is already recorded and needs Shiprocket reconciliation before retry." }, 409);
  } else {
    const { data: claim, error: claimError } = await service.rpc("claim_shiprocket_shipment", { p_order_id: body.order_id });
    if (claimError) return json({ error: claimError.message }, 409);
    const claimRecord = asRecord(claim);
    if (!claimRecord.claimed) return json({ error: "A shipment attempt already exists; use tracking or reconcile its provider state before retrying." }, 409);
    const { data: order, error: orderError } = await service.from("orders").select("id,order_number,status,payment_method,total,subtotal,shipping_total,cod_fee,customer_email_snapshot,shipping_addresses(recipient_name,phone,address_line_1,address_line_2,city,state,postal_code,country_code),order_items(product_name_snapshot,sku_snapshot,quantity,unit_price)").eq("id", body.order_id).single();
    if (orderError || !order) return json({ error: "Order details could not be loaded." }, 500);
    const address = asRecord(Array.isArray(order.shipping_addresses) ? order.shipping_addresses[0] : order.shipping_addresses);
    const fullName = String(address.recipient_name || "").trim();
    const [firstName, ...lastNames] = fullName.split(/\s+/);
    const orderItems = (order.order_items || []).map((item: any) => ({ name: item.product_name_snapshot, sku: item.sku_snapshot, units: item.quantity, selling_price: Number(item.unit_price), discount: 0 }));
    const totalWeight = Math.max(0.1, Number(Deno.env.get("SHIPROCKET_DEFAULT_WEIGHT_KG") || 0.5) * (order.order_items || []).reduce((sum: number, item: any) => sum + Number(item.quantity), 0));
    const shippingPayload = {
      order_id: `LL-${order.order_number}`, order_date: new Date().toISOString().slice(0, 16).replace("T", " "), pickup_location: Deno.env.get("SHIPROCKET_PICKUP_LOCATION"),
      billing_customer_name: firstName || "Customer", billing_last_name: lastNames.join(" "), billing_address: address.address_line_1,
      billing_address_2: address.address_line_2 || "", billing_city: address.city, billing_pincode: String(address.postal_code), billing_state: address.state,
      billing_country: address.country_code === "IN" ? "India" : address.country_code, billing_email: order.customer_email_snapshot,
      billing_phone: address.phone, shipping_is_billing: true, order_items: orderItems,
      payment_method: order.payment_method === "cod" ? "COD" : "Prepaid", shipping_charges: Number(order.shipping_total), sub_total: Number(order.subtotal),
      length: Number(Deno.env.get("SHIPROCKET_DEFAULT_LENGTH_CM") || 20), breadth: Number(Deno.env.get("SHIPROCKET_DEFAULT_BREADTH_CM") || 15),
      height: Number(Deno.env.get("SHIPROCKET_DEFAULT_HEIGHT_CM") || 5), weight: totalWeight,
    };
    let createResponse: Response;
    try { createResponse = await fetch("https://apiv2.shiprocket.in/v1/external/orders/create/adhoc", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(shippingPayload) }); }
    catch { return json({ error: "Shiprocket did not confirm shipment creation. Reconcile the provider order before retrying." }, 503); }
    if (!createResponse.ok) return json({ error: `Shiprocket order creation failed (${createResponse.status}).`, detail: await safeProviderError(createResponse) }, 502);
    const created = asRecord(await createResponse.json());
    const createdShipmentId = created.shipment_id;
    if (!created.order_id || !createdShipmentId) return json({ error: "Shiprocket response omitted shipment identifiers. Reconcile the provider order before retrying." }, 502);
    const { error: saveError } = await service.from("shipments").update({ provider_order_id: String(created.order_id), shipment_id: String(createdShipmentId), status: "created", provider_payload: { status: created.status || "created" } }).eq("id", claimRecord.id);
    if (saveError) return json({ error: "Shiprocket created an order but its reference could not be saved. Reconcile before retrying." }, 500);
    const awbResponse = await fetch("https://apiv2.shiprocket.in/v1/external/courier/assign/awb", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ shipment_id: createdShipmentId }) });
    if (!awbResponse.ok) return json({ shipment_id: String(createdShipmentId), error: `Shipment was created; AWB assignment needs follow-up (${awbResponse.status}).` }, 502);
    const awbResult = asRecord(await awbResponse.json());
    const awbInfo = asRecord(awbResult.response).data ? asRecord(asRecord(awbResult.response).data) : asRecord(awbResult.response);
    const awbCode = awbInfo.awb_code || awbInfo.awb || awbResult.awb_code;
    const courierName = asRecord(awbInfo.courier_company_info).courier_name || awbInfo.courier_name || null;
    const trackingUrl = awbCode ? `https://shiprocket.co/tracking/${encodeURIComponent(String(awbCode))}` : null;
    await service.from("shipments").update({ awb_code: awbCode ? String(awbCode) : null, courier_name: courierName, tracking_url: trackingUrl, status: "created" }).eq("id", claimRecord.id);
    return json({ shipment_id: String(createdShipmentId), awb_code: awbCode || null, courier_name: courierName, tracking_url: trackingUrl, status: "created" });
  }

  if (shipment.shipment_id && !shipment.awb_code) {
    const awbResponse = await fetch("https://apiv2.shiprocket.in/v1/external/courier/assign/awb", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ shipment_id: shipment.shipment_id }) });
    if (!awbResponse.ok) return json({ shipment_id: shipment.shipment_id, error: `Shipment exists; AWB assignment needs follow-up (${awbResponse.status}).` }, 502);
    const awbResult = asRecord(await awbResponse.json());
    const awbInfo = asRecord(asRecord(awbResult.response).data || awbResult.response);
    const awbCode = awbInfo.awb_code || awbInfo.awb || awbResult.awb_code;
    const courierName = asRecord(awbInfo.courier_company_info).courier_name || awbInfo.courier_name || null;
    const trackingUrl = awbCode ? `https://shiprocket.co/tracking/${encodeURIComponent(String(awbCode))}` : null;
    await service.from("shipments").update({ awb_code: awbCode ? String(awbCode) : null, courier_name: courierName, tracking_url: trackingUrl }).eq("id", shipment.id);
    return json({ shipment_id: shipment.shipment_id, awb_code: awbCode || null, courier_name: courierName, tracking_url: trackingUrl, status: shipment.status });
  }
  return json({ shipment_id: shipment.shipment_id, awb_code: shipment.awb_code, tracking_url: shipment.awb_code ? `https://shiprocket.co/tracking/${encodeURIComponent(shipment.awb_code)}` : null, status: shipment.status });
});
