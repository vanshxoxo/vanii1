import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, isAllowedOrigin } from "../_shared/cors.ts";

const json = (body: unknown, status = 200, origin: string | null = null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });

const asRecord = (value: unknown) =>
  value && typeof value === "object" ? (value as Record<string, any>) : {};

const safeProviderError = async (response: Response) =>
  (await response.text()).slice(0, 300);

// Modular Provider Interface
interface CourierProvider {
  name: string;
  checkServiceability(pickupPincode: string, deliveryPincode: string, weightKg: number, isCod: boolean): Promise<any>;
  createShipment(order: any, pickupLocation: string, dimensions: any): Promise<any>;
  assignAwb(shipmentId: string): Promise<any>;
  trackAwb(awbCode: string): Promise<any>;
  generateLabel(shipmentId: string): Promise<any>;
  generateManifest(shipmentId: string): Promise<any>;
  schedulePickup(shipmentId: string, pickupDate?: string): Promise<any>;
}

// 1. SHIPROCKET PROVIDER IMPLEMENTATION
class ShiprocketProvider implements CourierProvider {
  name = "shiprocket";
  private email: string;
  private pass: string;
  private tokenCache: { token: string; expiresAt: number } | null = null;

  constructor(email: string, pass: string) {
    this.email = email;
    this.pass = pass;
  }

  async getToken(): Promise<string> {
    const now = Date.now();
    if (this.tokenCache && this.tokenCache.expiresAt > now + 60000) {
      return this.tokenCache.token;
    }
    const response = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: this.email, password: this.pass }),
    });
    if (!response.ok) {
      throw new Error(`Shiprocket authentication failed (${response.status}). Check API credentials.`);
    }
    const data = asRecord(await response.json());
    if (typeof data.token !== "string") {
      throw new Error("Shiprocket did not return an API authorization token.");
    }
    this.tokenCache = { token: data.token, expiresAt: now + 3600000 };
    return data.token;
  }

  async checkServiceability(pickupPincode: string, deliveryPincode: string, weightKg: number, isCod: boolean) {
    const token = await this.getToken();
    const query = new URLSearchParams({
      pickup_postcode: pickupPincode,
      delivery_postcode: deliveryPincode,
      weight: String(Math.max(0.1, weightKg)),
      cod: isCod ? "1" : "0",
    });
    const res = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/serviceability/?${query.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(`Serviceability check failed (${res.status}): ${await safeProviderError(res)}`);
    }
    const data = asRecord(await res.json());
    const couriers = Array.isArray(data.data?.available_courier_companies)
      ? data.data.available_courier_companies
      : [];

    const isServiceable = couriers.length > 0;
    const sorted = [...couriers].sort((a: any, b: any) => Number(a.rate) - Number(b.rate));
    const recommended = sorted[0] || null;

    return {
      serviceable: isServiceable,
      courier_count: couriers.length,
      recommended_courier: recommended ? {
        id: recommended.courier_company_id,
        name: recommended.courier_name,
        estimated_delivery_days: recommended.estimated_delivery_days || "3-5",
        etd: recommended.etd || null,
        rate: Number(recommended.rate) || 0,
      } : null,
      couriers: couriers.slice(0, 5).map((c: any) => ({
        id: c.courier_company_id,
        name: c.courier_name,
        estimated_delivery_days: c.estimated_delivery_days || "3-5",
        rate: Number(c.rate) || 0,
      })),
    };
  }

  async createShipment(order: any, pickupLocation: string, dimensions: any) {
    const token = await this.getToken();
    const address = asRecord(Array.isArray(order.shipping_addresses) ? order.shipping_addresses[0] : order.shipping_addresses);
    const fullName = String(address.recipient_name || "").trim();
    const [firstName, ...lastNames] = fullName.split(/\s+/);
    const orderItems = (order.order_items || []).map((item: any) => ({
      name: item.product_name_snapshot,
      sku: item.sku_snapshot,
      units: item.quantity,
      selling_price: Number(item.unit_price),
      discount: 0,
    }));

    const totalWeight = Math.max(
      0.1,
      Number(dimensions.weight || 0.5) * (order.order_items || []).reduce((sum: number, item: any) => sum + Number(item.quantity), 0)
    );

    const payload = {
      order_id: `VJ-${order.order_number}`,
      order_date: new Date().toISOString().slice(0, 16).replace("T", " "),
      pickup_location: pickupLocation || "Primary",
      billing_customer_name: firstName || "Valued",
      billing_last_name: lastNames.join(" ") || "Client",
      billing_address: address.address_line_1,
      billing_address_2: address.address_line_2 || "",
      billing_city: address.city,
      billing_pincode: String(address.postal_code),
      billing_state: address.state,
      billing_country: address.country_code === "IN" ? "India" : (address.country_code || "India"),
      billing_email: order.customer_email_snapshot || "orders@vjcollection.com",
      billing_phone: address.phone,
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: order.payment_method === "cod" ? "COD" : "Prepaid",
      shipping_charges: Number(order.shipping_total || 0),
      sub_total: Number(order.subtotal || order.total),
      length: Number(dimensions.length || 20),
      breadth: Number(dimensions.breadth || 15),
      height: Number(dimensions.height || 5),
      weight: totalWeight,
    };

    const res = await fetch("https://apiv2.shiprocket.in/v1/external/orders/create/adhoc", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Shiprocket order creation failed (${res.status}): ${await safeProviderError(res)}`);
    }
    return res.json();
  }

  async assignAwb(shipmentId: string) {
    const token = await this.getToken();
    const res = await fetch("https://apiv2.shiprocket.in/v1/external/courier/assign/awb", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ shipment_id: shipmentId }),
    });
    if (!res.ok) {
      throw new Error(`AWB assignment failed (${res.status}): ${await safeProviderError(res)}`);
    }
    return res.json();
  }

  async trackAwb(awbCode: string) {
    const token = await this.getToken();
    const res = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${encodeURIComponent(awbCode)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(`Tracking request failed (${res.status}): ${await safeProviderError(res)}`);
    }
    return res.json();
  }

  async generateLabel(shipmentId: string) {
    const token = await this.getToken();
    const res = await fetch("https://apiv2.shiprocket.in/v1/external/courier/generate/label", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ shipment_id: [shipmentId] }),
    });
    if (!res.ok) {
      throw new Error(`Label generation failed (${res.status}): ${await safeProviderError(res)}`);
    }
    return res.json();
  }

  async generateManifest(shipmentId: string) {
    const token = await this.getToken();
    const res = await fetch("https://apiv2.shiprocket.in/v1/external/manifests/generate", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ shipment_id: [shipmentId] }),
    });
    if (!res.ok) {
      throw new Error(`Manifest generation failed (${res.status}): ${await safeProviderError(res)}`);
    }
    return res.json();
  }

  async schedulePickup(shipmentId: string, pickupDate?: string) {
    const token = await this.getToken();
    const payload: any = { shipment_id: [shipmentId] };
    if (pickupDate) payload.pickup_date = [pickupDate];

    const res = await fetch("https://apiv2.shiprocket.in/v1/external/courier/generate/pickup", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Pickup scheduling failed (${res.status}): ${await safeProviderError(res)}`);
    }
    return res.json();
  }
}

function shipmentStatus(raw: string) {
  const value = raw.toLowerCase();
  if (value.includes("delivered")) return "delivered";
  if (value.includes("out for delivery")) return "out_for_delivery";
  if (value.includes("in transit") || value.includes("shipped") || value.includes("picked up")) return "in_transit";
  if (value.includes("pickup") && (value.includes("scheduled") || value.includes("queued"))) return "pickup_scheduled";
  if (value.includes("cancel")) return "cancelled";
  if (value.includes("rto") || value.includes("return")) return "returned";
  if (value.includes("exception") || value.includes("undelivered") || value.includes("lost") || value.includes("ndr")) return "exception";
  return "created";
}

Deno.serve(async (request) => {
  const requestOrigin = request.headers.get("Origin");
  const reply = (body: unknown, status = 200) => json(body, status, requestOrigin);
  if (!isAllowedOrigin(requestOrigin)) return reply({ error: "Origin is not allowed." }, 403);
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(requestOrigin) });
  if (request.method !== "POST") return reply({ error: "Method not allowed." }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const email = Deno.env.get("SHIPROCKET_EMAIL");
  const password = Deno.env.get("SHIPROCKET_PASSWORD");
  const pickupLocation = Deno.env.get("SHIPROCKET_PICKUP_LOCATION") || "Primary";

  if (!url || !anonKey || !serviceKey) {
    return reply({ error: "Supabase service is not configured." }, 503);
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization) return reply({ error: "Sign in required." }, 401);

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return reply({ error: "Your session has expired. Sign in again." }, 401);

  const { data: roles } = await userClient.from("admin_roles").select("role").eq("user_id", user.id);
  const isOrderManager = (roles || []).some((role: any) =>
    ["owner", "admin", "order_manager"].includes(role.role)
  );

  let body: any;
  try {
    body = await request.json();
  } catch {
    return reply({ error: "Invalid JSON request body." }, 400);
  }

  const action = body.action;

  // ACTION 1: SERVICEABILITY CHECK (Available to customers & admins)
  if (action === "serviceability") {
    const deliveryPincode = String(body.pincode || "").trim();
    if (!/^\d{6}$/.test(deliveryPincode)) {
      return reply({ error: "Valid 6-digit Indian PIN code required." }, 400);
    }
    const pickupPincode = String(body.pickup_pincode || Deno.env.get("SHIPROCKET_PICKUP_PINCODE") || "110001");
    const weightKg = Number(body.weight_kg || 0.5);
    const isCod = Boolean(body.cod);

    // If live credentials configured, call Shiprocket
    if (email && password) {
      try {
        const provider = new ShiprocketProvider(email, password);
        const result = await provider.checkServiceability(pickupPincode, deliveryPincode, weightKg, isCod);
        return reply(result);
      } catch (err: any) {
        return reply({ error: err.message || "Courier serviceability check failed." }, 502);
      }
    } else {
      // Safe fallback when credentials are not yet configured in preview
      return reply({
        serviceable: true,
        courier_count: 3,
        mock_mode: true,
        recommended_courier: {
          id: 1,
          name: "Standard Express Air",
          estimated_delivery_days: "3-5 business days",
          rate: 150,
        },
        couriers: [
          { id: 1, name: "Standard Express Air", estimated_delivery_days: "3-5 business days", rate: 150 },
          { id: 2, name: "Premium Surface Express", estimated_delivery_days: "4-6 business days", rate: 100 },
        ],
      });
    }
  }

  // Check order access for order-specific actions
  const orderId = body.order_id;
  if (!orderId) return reply({ error: "order_id is required." }, 400);

  const { data: orderAccess } = await userClient
    .from("orders")
    .select("id,customer_id")
    .eq("id", orderId)
    .maybeSingle();

  if (!orderAccess && !isOrderManager) {
    return reply({ error: "Order was not found for this account." }, 404);
  }

  const service = createClient(url, serviceKey, { auth: { persistSession: false } });

  // ACTION 2: TRACK SHIPMENT
  if (action === "track") {
    const { data: shipment, error: shipmentReadError } = await service
      .from("shipments")
      .select("id,order_id,provider_order_id,shipment_id,awb_code,courier_name,status,creation_started_at")
      .eq("order_id", orderId)
      .maybeSingle();

    if (shipmentReadError) return reply({ error: "Could not load shipment record." }, 500);
    if (!shipment?.awb_code) {
      return reply({
        status: "preparing",
        raw_status: "Awaiting dispatch",
        message: "Order is confirmed and being prepared for courier dispatch.",
      });
    }

    if (!email || !password) {
      return reply({
        status: shipment.status || "created",
        awb_code: shipment.awb_code,
        courier_name: shipment.courier_name || "Express Courier",
        tracking_url: `https://shiprocket.co/tracking/${encodeURIComponent(shipment.awb_code)}`,
      });
    }

    try {
      const provider = new ShiprocketProvider(email, password);
      const trackResponse = asRecord(await provider.trackAwb(shipment.awb_code));
      const trackData = Array.isArray(trackResponse)
        ? asRecord(trackResponse[0]).tracking_data
        : trackResponse.tracking_data;
      const tracking = asRecord(trackData);
      const current = Array.isArray(tracking.shipment_track) ? asRecord(tracking.shipment_track[0]) : {};
      const rawStatus = String(current.current_status || tracking.current_status || "");
      const status = shipmentStatus(rawStatus);
      const trackingUrl = typeof tracking.track_url === "string" ? tracking.track_url : `https://shiprocket.co/tracking/${encodeURIComponent(shipment.awb_code)}`;

      await service
        .from("shipments")
        .update({
          status,
          raw_status: rawStatus,
          tracking_url: trackingUrl,
          provider_payload: { etd: tracking.etd || null, status: rawStatus },
        })
        .eq("id", shipment.id);

      // Auto update order status if delivered
      if (status === "delivered") {
        const { data: order } = await service.from("orders").select("status,payment_method").eq("id", orderId).single();
        if (order?.status !== "delivered") {
          await service.from("orders").update({ status: "delivered" }).eq("id", orderId);
        }
      }

      return reply({
        status,
        raw_status: rawStatus,
        courier_name: shipment.courier_name,
        awb_code: shipment.awb_code,
        tracking_url: trackingUrl,
        etd: tracking.etd || null,
        activities: tracking.shipment_track_activities || [],
      });
    } catch (err: any) {
      return reply({ error: err.message || "Tracking lookup failed." }, 502);
    }
  }

  // ADMIN-ONLY ACTIONS FROM HERE
  if (!isOrderManager) {
    return reply({ error: "Staff order-management role is required." }, 403);
  }

  if (!email || !password) {
    return reply(
      { error: "Shiprocket credentials (SHIPROCKET_EMAIL & SHIPROCKET_PASSWORD) are not configured." },
      503
    );
  }

  const provider = new ShiprocketProvider(email, password);

  // ACTION 3: CREATE SHIPMENT
  if (action === "create") {
    const { data: order, error: orderError } = await service
      .from("orders")
      .select("*, shipping_addresses(*), order_items(*)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) return reply({ error: "Order details could not be loaded." }, 500);

    if (order.status === "cancelled" || order.status === "pending_payment") {
      return reply({ error: `Cannot create shipment for order with status: ${order.status}.` }, 400);
    }

    const { data: claim, error: claimError } = await service.rpc("claim_shiprocket_shipment", {
      p_order_id: orderId,
    });
    if (claimError) return reply({ error: claimError.message }, 409);
    const claimRecord = asRecord(claim);

    const dimensions = {
      weight: Deno.env.get("SHIPROCKET_DEFAULT_WEIGHT_KG") || 0.5,
      length: Deno.env.get("SHIPROCKET_DEFAULT_LENGTH_CM") || 20,
      breadth: Deno.env.get("SHIPROCKET_DEFAULT_BREADTH_CM") || 15,
      height: Deno.env.get("SHIPROCKET_DEFAULT_HEIGHT_CM") || 5,
    };

    try {
      const created = asRecord(await provider.createShipment(order, pickupLocation, dimensions));
      const createdShipmentId = created.shipment_id;
      if (!created.order_id || !createdShipmentId) {
        return reply({ error: "Shiprocket response omitted shipment identifiers.", detail: created }, 502);
      }

      await service
        .from("shipments")
        .update({
          provider_order_id: String(created.order_id),
          shipment_id: String(createdShipmentId),
          status: "created",
          provider_payload: { status: created.status || "created" },
        })
        .eq("id", claimRecord.id);

      // Auto-assign AWB
      let awbCode: string | null = null;
      let courierName: string | null = null;
      try {
        const awbResult = asRecord(await provider.assignAwb(String(createdShipmentId)));
        const awbInfo = asRecord(asRecord(awbResult.response).data || awbResult.response);
        awbCode = awbInfo.awb_code || awbInfo.awb || awbResult.awb_code || null;
        courierName = asRecord(awbInfo.courier_company_info).courier_name || awbInfo.courier_name || null;

        if (awbCode) {
          const trackingUrl = `https://shiprocket.co/tracking/${encodeURIComponent(String(awbCode))}`;
          await service
            .from("shipments")
            .update({
              awb_code: String(awbCode),
              courier_name: courierName,
              tracking_url: trackingUrl,
              status: "created",
            })
            .eq("id", claimRecord.id);
        }
      } catch (awbErr: any) {
        console.error("AWB assignment notice:", awbErr.message);
      }

      // Update order status to processing or shipped
      await service.from("orders").update({ status: "processing" }).eq("id", orderId);

      // Customer notification
      await service.from("customer_notifications").insert({
        customer_id: order.customer_id,
        order_id: order.id,
        event_type: "shipment_created",
        title: "Shipment Created",
        message: `Shipment for order #${order.order_number} has been created with courier ${courierName || 'partner'}.${awbCode ? ` AWB: ${awbCode}` : ''}`,
        metadata: { shipment_id: createdShipmentId, awb_code: awbCode, courier: courierName }
      }).catch(() => null);

      return reply({
        shipment_id: String(createdShipmentId),
        awb_code: awbCode,
        courier_name: courierName,
        tracking_url: awbCode ? `https://shiprocket.co/tracking/${encodeURIComponent(String(awbCode))}` : null,
        status: "created",
      });
    } catch (err: any) {
      return reply({ error: err.message || "Failed to create shipment with Shiprocket." }, 502);
    }
  }

  // ACTION 4: SCHEDULE PICKUP
  if (action === "schedule_pickup") {
    const { data: shipment } = await service.from("shipments").select("shipment_id").eq("order_id", orderId).maybeSingle();
    if (!shipment?.shipment_id) return reply({ error: "Shipment does not exist yet." }, 400);

    try {
      const pickupResult = await provider.schedulePickup(shipment.shipment_id, body.pickup_date);
      await service.from("shipments").update({ status: "pickup_scheduled" }).eq("order_id", orderId);
      return reply({ success: true, pickup: pickupResult });
    } catch (err: any) {
      return reply({ error: err.message }, 502);
    }
  }

  // ACTION 5: GENERATE LABEL
  if (action === "generate_label") {
    const { data: shipment } = await service.from("shipments").select("shipment_id").eq("order_id", orderId).maybeSingle();
    if (!shipment?.shipment_id) return reply({ error: "Shipment does not exist yet." }, 400);

    try {
      const labelResult = await provider.generateLabel(shipment.shipment_id);
      const labelUrl = labelResult.label_url || labelResult.response?.label_url;
      return reply({ success: true, label_url: labelUrl });
    } catch (err: any) {
      return reply({ error: err.message }, 502);
    }
  }

  // ACTION 6: GENERATE MANIFEST
  if (action === "generate_manifest") {
    const { data: shipment } = await service.from("shipments").select("shipment_id").eq("order_id", orderId).maybeSingle();
    if (!shipment?.shipment_id) return reply({ error: "Shipment does not exist yet." }, 400);

    try {
      const manifestResult = await provider.generateManifest(shipment.shipment_id);
      const manifestUrl = manifestResult.manifest_url || manifestResult.response?.manifest_url;
      return reply({ success: true, manifest_url: manifestUrl });
    } catch (err: any) {
      return reply({ error: err.message }, 502);
    }
  }

  return reply({ error: `Unknown action: ${action}.` }, 400);
});
