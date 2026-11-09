import { checkSameOrigin, json, privateApiAuthorization, requireImageKit, requireMediaManager } from './_media-shared.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });
  if (!checkSameOrigin(req)) return json(res, 403, { error: 'Origin is not allowed.' });
  try {
    const { client } = await requireMediaManager(req);
    const { privateKey } = requireImageKit();
    const assetId = String(req.body?.asset_id || '');
    if (!/^[0-9a-f-]{36}$/i.test(assetId)) return json(res, 400, { error: 'Invalid media asset ID.' });
    const { data: claim, error: claimError } = await client.rpc('claim_external_media_deletion', { p_asset_id: assetId });
    if (claimError) return json(res, 409, { error: claimError.message });
    const asset = claim?.[0];
    if (!asset) return json(res, 404, { error: 'Media asset not found.' });
    if (asset.provider !== 'imagekit' || !asset.provider_asset_id) {
      await client.rpc('release_external_media_deletion', { p_asset_id: assetId });
      return json(res, 409, { error: 'This legacy asset is not in ImageKit and was left unchanged.' });
    }
    const response = await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(asset.provider_asset_id)}`, {
      method: 'DELETE', headers: { Authorization: privateApiAuthorization(privateKey) },
    });
    if (!response.ok && response.status !== 404) {
      await client.rpc('release_external_media_deletion', { p_asset_id: assetId });
      return json(res, 502, { error: 'ImageKit deletion failed. The media record remains in the library.' });
    }
    const { data: finalized, error: finalizeError } = await client.rpc('finalize_external_media_deletion', { p_asset_id: assetId });
    if (finalizeError || finalized !== true) return json(res, 500, { error: 'The ImageKit file was deleted, but the metadata cleanup needs reconciliation.' });
    return json(res, 200, { deleted: true });
  } catch (error) {
    return json(res, error.status || 500, { error: error.message || 'Media deletion failed.' });
  }
}
