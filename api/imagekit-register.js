import { createClient } from '@supabase/supabase-js';
import { checkSameOrigin, json, privateApiAuthorization, requireImageKit, requireMediaManager } from './_media-shared.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });
  if (!checkSameOrigin(req)) return json(res, 403, { error: 'Origin is not allowed.' });
  try {
    const { client } = await requireMediaManager(req);
    const { endpoint, privateKey } = requireImageKit();
    const fileId = String(req.body?.file_id || '');
    const checksum = String(req.body?.checksum || '');
    const purpose = String(req.body?.purpose || '');
    const filename = String(req.body?.filename || '').slice(0, 180);
    const mime = String(req.body?.mime_type || '');
    if (!/^[\w-]{12,100}$/.test(fileId) || !/^[a-f0-9]{64}$/.test(checksum) || !filename || !/^(image\/(jpeg|png|webp|avif|gif)|video\/(mp4|webm))$/.test(mime)) {
      return json(res, 400, { error: 'Invalid uploaded file metadata.' });
    }
    const allowedPurposes = ['product','collection','category','homepage_hero','campaign','brand_story','lookbook','video'];
    if (!allowedPurposes.includes(purpose)) return json(res, 400, { error: 'Invalid media purpose.' });
    const { data: duplicate, error: duplicateError } = await client.from('media_assets').select('*').eq('checksum_sha256', checksum).maybeSingle();
    if (duplicateError) return json(res, 503, { error: 'Media library is unavailable. Confirm the Supabase migrations and manager role.' });
    if (duplicate) return json(res, 200, { asset: duplicate, reused: true });

    const fileResponse = await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}/details`, {
      headers: { Authorization: privateApiAuthorization(privateKey) },
    });
    if (!fileResponse.ok) return json(res, 502, { error: 'ImageKit could not verify the uploaded file.' });
    const file = await fileResponse.json();
    if (file.fileId !== fileId || !file.url?.startsWith(`${endpoint}/`) || !['image', 'non-image'].includes(file.fileType)) {
      return json(res, 400, { error: 'ImageKit file details did not match the upload.' });
    }
    const resourceType = file.fileType === 'image' ? 'image' : 'video';
    if (resourceType === 'video' && !mime.startsWith('video/')) return json(res, 400, { error: 'Uploaded file type does not match the selected media type.' });
    if (resourceType === 'image' && !mime.startsWith('image/')) return json(res, 400, { error: 'Uploaded file type does not match the selected media type.' });
    const result = await client.from('media_assets').insert({
      provider: 'imagekit', provider_asset_id: file.fileId, resource_type: resourceType,
      delivery_url: file.url, format: file.filePath?.split('.').pop()?.toLowerCase() || null,
      original_filename: filename, mime_type: mime, file_size_bytes: file.size,
      width: file.width || null, height: file.height || null, checksum_sha256: checksum,
      purpose,
      uploaded_by: (await client.auth.getUser()).data.user?.id || null,
      derived_urls: { thumbnail: file.thumbnail || file.url, responsive_widths: [320, 480, 640, 960, 1280] },
    }).select('*').single();
    if (result.error) {
      const { data: raced } = await client.from('media_assets').select('*').eq('checksum_sha256', checksum).maybeSingle();
      return raced ? json(res, 200, { asset: raced, reused: true }) : json(res, 503, { error: 'Supabase could not register this ImageKit asset.' });
    }
    return json(res, 200, { asset: result.data, reused: false });
  } catch (error) {
    return json(res, error.status || 500, { error: error.message || 'Media registration failed.' });
  }
}
