const DEFAULT_ALLOWED_ORIGINS = [
  "https://vjcollection.com",
  "https://www.vjcollection.com",
  "https://vanii1.vercel.app",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:3000",
];

function configuredOrigins(): Set<string> {
  const configured = Deno.env.get("STOREFRONT_ORIGINS") || Deno.env.get("STOREFRONT_ORIGIN");
  const values = configured ? configured.split(",") : DEFAULT_ALLOWED_ORIGINS;

  const result = new Set<string>();
  for (const origin of [...DEFAULT_ALLOWED_ORIGINS, ...values]) {
    try {
      const url = new URL(origin.trim());
      result.add(url.origin);
    } catch {
      // ignore malformed
    }
  }
  return result;
}

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true;
  const set = configuredOrigins();
  if (set.has(origin)) return true;
  // Allow Vercel preview deployments for vanii1 / vjcollection
  if (/^https:\/\/vanii1[a-z0-9-]*\.vercel\.app$/i.test(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+-vanshxoxos-projects\.vercel\.app$/i.test(origin)) return true;
  return false;
}

export function corsHeaders(origin: string | null) {
  const allowed = isAllowedOrigin(origin);
  return {
    ...(origin && allowed ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Vary": "Origin",
  };
}
