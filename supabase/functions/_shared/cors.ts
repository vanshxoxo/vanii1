const FALLBACK_ORIGIN = "https://vanii1.vercel.app";

function configuredOrigins(): Set<string> {
  const configured = Deno.env.get("STOREFRONT_ORIGINS") || Deno.env.get("STOREFRONT_ORIGIN");
  const values = configured ? configured.split(",") : [FALLBACK_ORIGIN];

  return new Set(values.map((value) => {
    try {
      const url = new URL(value.trim());
      return url.origin;
    } catch {
      return "";
    }
  }).filter(Boolean));
}

export function isAllowedOrigin(origin: string | null): boolean {
  return !origin || configuredOrigins().has(origin);
}

export function corsHeaders(origin: string | null) {
  return {
    ...(origin && configuredOrigins().has(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
