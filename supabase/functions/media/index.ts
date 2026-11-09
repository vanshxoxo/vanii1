import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const origin = () => Deno.env.get("STOREFRONT_ORIGIN") || "https://vanii1.vercel.app";
const cors = () => ({ "Access-Control-Allow-Origin": origin(), "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", Vary: "Origin" });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors(), "Content-Type": "application/json" } });
const hex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
async function cloudinarySignature(values: Record<string, string>, secret: string) {
  const serialized = Object.keys(values).filter((key) => values[key] !== "").sort().map((key) => `${key}=${values[key]}`).join("&") + secret;
  return hex(await crypto.subtle.digest("SHA-1", new TextEncoder().encode(serialized)));
}

Deno.serve(async (request) => {
  if (request.headers.get("Origin") && request.headers.get("Origin") !== origin()) return json({ error: "Origin is not allowed." }, 403);
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors() });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);
  const url = Deno.env.get("SUPABASE_URL"), anonKey = Deno.env.get("SUPABASE_ANON_KEY"), serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return json({ error: "Media service is not configured." }, 503);
  const authorization = request.headers.get("Authorization");
  if (!authorization) return json({ error: "Administrator sign-in required." }, 401);
  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: "Your session has expired." }, 401);
  const service = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: roles } = await service.from("admin_roles").select("role").eq("user_id", user.id);
  if (!(roles || []).some((row) => ["owner", "admin", "media_manager"].includes(row.role))) return json({ error: "Media manager access required." }, 403);
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
  const action = body.action;
  const cloud = Deno.env.get("CLOUDINARY_CLOUD_NAME"), apiKey = Deno.env.get("CLOUDINARY_API_KEY"), apiSecret = Deno.env.get("CLOUDINARY_API_SECRET");

  if (action === "sign" || action === "register" || action === "delete") {
    if ((Deno.env.get("MEDIA_PROVIDER") || "cloudinary") !== "cloudinary") return json({ error: "The configured media provider does not match this Cloudinary adapter." }, 503);
    if (!cloud || !apiKey || !apiSecret) return json({ error: "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET as Supabase Edge Function secrets." }, 503);
  }

  if (action === "sign") {
    const checksum = String(body.checksum || ""), filename = String(body.filename || "").slice(0, 180), mime = String(body.mime_type || ""), size = Number(body.file_size_bytes || 0), purpose = String(body.purpose || "");
    if (!/^[a-f0-9]{64}$/.test(checksum) || !filename || !/^(image\/(jpeg|png|webp|avif|gif)|video\/(mp4|webm))$/.test(mime) || size <= 0 || size > (mime.startsWith("video/") ? 100 : 25) * 1024 * 1024) return json({ error: "Unsupported file, size or checksum." }, 400);
    if (!["product", "collection", "category", "homepage_hero", "campaign", "brand_story", "lookbook", "video", "placeholder"].includes(purpose)) return json({ error: "Invalid media purpose." }, 400);
    const { data: duplicate, error: duplicateError } = await service.from("media_assets").select("*").eq("checksum_sha256", checksum).maybeSingle();
    if (duplicateError) return json({ error: duplicateError.message }, 500);
    if (duplicate) return json({ existing: duplicate });
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const resourceType = mime.startsWith("video/") ? "video" : "image";
    const params = { folder: "little-loom", overwrite: "false", public_id: checksum, timestamp };
    const signature = await cloudinarySignature(params, apiSecret!);
    return json({ cloud_name: cloud, api_key: apiKey, resource_type: resourceType, params, signature });
  }

  if (action === "register") {
    const checksum = String(body.checksum || ""), publicId = String(body.public_id || ""), resourceType = String(body.resource_type || "");
    const purpose = String(body.purpose || "product"), filename = String(body.filename || "asset").slice(0, 180), mime = String(body.mime_type || "application/octet-stream");
    if (!/^[a-f0-9]{64}$/.test(checksum) || publicId !== `little-loom/${checksum}` || !["image", "video"].includes(resourceType)) return json({ error: "Uploaded media could not be verified." }, 400);
    const { data: duplicate } = await service.from("media_assets").select("*").eq("checksum_sha256", checksum).maybeSingle();
    if (duplicate) return json({ asset: duplicate, reused: true });
    const endpoint = `https://api.cloudinary.com/v1_1/${cloud}/resources/${resourceType}/upload/${encodeURIComponent(publicId).replaceAll("%2F", "/")}`;
    const detailsResponse = await fetch(endpoint, { headers: { Authorization: `Basic ${btoa(`${apiKey}:${apiSecret}`)}` } });
    if (!detailsResponse.ok) return json({ error: "Cloudinary could not confirm the uploaded file." }, 502);
    const details = await detailsResponse.json();
    if (details.public_id !== publicId || details.resource_type !== resourceType || !details.secure_url) return json({ error: "Cloudinary asset details did not match the signed upload." }, 400);
    const metadata = { provider: "cloudinary", provider_asset_id: details.asset_id, resource_type: resourceType, delivery_url: details.secure_url, format: details.format || null, original_filename: filename, mime_type: mime, file_size_bytes: details.bytes, width: details.width || null, height: details.height || null, duration_seconds: details.duration || null, checksum_sha256: checksum, purpose, uploaded_by: user.id, derived_urls: { thumbnail: `https://res.cloudinary.com/${cloud}/${resourceType}/upload/f_auto,q_auto,w_400,h_400,c_fill/${publicId}.${details.format}`, responsive_widths: [320, 640, 960, 1280] } };
    const { data: asset, error: insertError } = await service.from("media_assets").insert(metadata).select("*").single();
    if (insertError) {
      const { data: raced } = await service.from("media_assets").select("*").eq("checksum_sha256", checksum).maybeSingle();
      return raced ? json({ asset: raced, reused: true }) : json({ error: insertError.message }, 500);
    }
    return json({ asset, reused: false });
  }

  if (action === "delete") {
    const assetId = String(body.asset_id || "");
    if (!/^[0-9a-f-]{36}$/i.test(assetId)) return json({ error: "Invalid asset identifier." }, 400);
    const { data: claimed, error: claimError } = await service.rpc("claim_external_media_deletion", { p_asset_id: assetId });
    if (claimError) return json({ error: claimError.message }, 409);
    const asset = claimed?.[0];
    if (!asset) return json({ error: "Media asset not found." }, 404);
    if (asset.provider !== "cloudinary") {
      await service.rpc("release_external_media_deletion", { p_asset_id: assetId });
      return json({ error: `Deletion for provider ${asset.provider} is not configured.` }, 501);
    }
    const destroy = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/resources/${asset.resource_type}/upload`, { method: "DELETE", headers: { "Authorization": `Basic ${btoa(`${apiKey}:${apiSecret}`)}`, "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ "public_ids[]": asset.provider_asset_id }) });
    const destroyResult = await destroy.json().catch(() => ({}));
    if (!destroy.ok || !["deleted", "not_found"].includes(destroyResult.deleted?.[asset.provider_asset_id])) {
      await service.rpc("release_external_media_deletion", { p_asset_id: assetId });
      return json({ error: "Cloudinary could not delete this asset; it remains in the library." }, 502);
    }
    const { error: deleteError } = await service.from("media_assets").delete().eq("id", assetId).eq("lifecycle_status", "deleting");
    if (deleteError) return json({ error: "The Cloudinary file was deleted but the metadata cleanup needs retry." }, 500);
    return json({ deleted: true });
  }
  return json({ error: "Unsupported media action." }, 400);
});
