import { createHmac, randomUUID } from 'node:crypto';
import { checkSameOrigin, json, requireImageKit, requireMediaManager } from './_media-shared.js';

const mimePattern = /^(image\/(jpeg|png|webp|avif|gif)|video\/(mp4|webm))$/;
const purposes = new Set(['product', 'collection', 'category', 'homepage_hero', 'campaign', 'brand_story', 'lookbook', 'video']);

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });
  if (!checkSameOrigin(req)) return json(res, 403, { error: 'Origin is not allowed.' });
  try {
    await requireMediaManager(req);
    const { publicKey, privateKey } = requireImageKit();
    const mime = String(req.body?.mime_type || '');
    const size = Number(req.body?.file_size_bytes || 0);
    const purpose = String(req.body?.purpose || '');
    if (!mimePattern.test(mime) || !purposes.has(purpose) || size <= 0 || size > (mime.startsWith('video/') ? 100 : 20) * 1024 * 1024) {
      return json(res, 400, { error: 'Unsupported file, purpose or size. Images up to 20 MB and MP4/WebM videos up to 100 MB are accepted.' });
    }
    const token = randomUUID();
    const expire = Math.floor(Date.now() / 1000) + 300;
    const signature = createHmac('sha1', privateKey).update(`${token}${expire}`).digest('hex');
    return json(res, 200, { token, expire, signature, publicKey });
  } catch (error) {
    return json(res, error.status || 500, { error: error.message || 'Upload authorization failed.' });
  }
}
