import { createClient } from '@supabase/supabase-js';

const env = import.meta.env as ImportMetaEnv & {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  VITE_SUPABASE_ANON_KEY?: string;
};

const url = env.VITE_SUPABASE_URL?.trim();
const key = (env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY)?.trim();
export const isSupabaseConfigured = Boolean(url && key);
export const supabase = isSupabaseConfigured ? createClient(url!, key!) : null;

export function publicMediaUrl(asset: {
  provider: 'cloudinary' | 'imagekit' | 'external' | 'supabase';
  delivery_url?: string | null;
  external_url: string | null;
  resource_type?: string;
}, width?: number) {
  const deliveryUrl = asset.delivery_url || asset.external_url || '';
  if (asset.provider === 'cloudinary' && deliveryUrl && width && asset.resource_type !== 'video') {
    return deliveryUrl.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
  }
  if (asset.provider === 'imagekit' && deliveryUrl && width && asset.resource_type !== 'video') {
    const separator = deliveryUrl.includes('?') ? '&' : '?';
    return `${deliveryUrl}${separator}tr=w-${width},q-80,f-auto`;
  }
  if (asset.provider === 'external' || asset.provider === 'supabase') return deliveryUrl;
  return deliveryUrl;
}

export function responsiveMediaSrcSet(asset: Parameters<typeof publicMediaUrl>[0], widths = [320, 480, 640, 960, 1280]) {
  if (!['cloudinary', 'imagekit'].includes(asset.provider) || asset.resource_type === 'video') return undefined;
  return widths.map((width) => `${publicMediaUrl(asset, width)} ${width}w`).join(', ');
}
