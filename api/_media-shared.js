import { createClient } from '@supabase/supabase-js';

export function json(res, status, body) {
  res.status(status).json(body);
}

export function checkSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

export async function requireMediaManager(req) {
  const authorization = req.headers.authorization || '';
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!token) throw Object.assign(new Error('Sign in to manage media.'), { status: 401 });
  if (!url || !key) throw Object.assign(new Error('Supabase URL and publishable key are not configured in this Vercel environment.'), { status: 503 });
  const client = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authError } = await client.auth.getUser(token);
  if (authError || !user) throw Object.assign(new Error('Your session expired. Sign in again.'), { status: 401 });
  const { data: roles, error: roleError } = await client.from('admin_roles').select('role').eq('user_id', user.id);
  if (roleError) throw Object.assign(new Error('Could not verify media permissions. Confirm the Supabase migrations are applied.'), { status: 503 });
  if (!(roles || []).some(({ role }) => ['owner', 'admin', 'media_manager'].includes(role))) {
    throw Object.assign(new Error('Media manager access required.'), { status: 403 });
  }
  return { client, user };
}

export function requireImageKit() {
  const endpoint = process.env.IMAGEKIT_URL_ENDPOINT;
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!endpoint || !publicKey || !privateKey) throw Object.assign(new Error('Set IMAGEKIT_URL_ENDPOINT, IMAGEKIT_PUBLIC_KEY and IMAGEKIT_PRIVATE_KEY in the Vercel Preview and Production environments.'), { status: 503 });
  return { endpoint: endpoint.replace(/\/+$/, ''), publicKey, privateKey };
}

export function privateApiAuthorization(privateKey) {
  return `Basic ${Buffer.from(`${privateKey}:`).toString('base64')}`;
}
