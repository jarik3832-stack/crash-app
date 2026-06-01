import { Router } from 'express';
import https from 'node:https';

export const giftsRouter = Router();

// Кэш name -> file_path
const pathCache = new Map();

function tgGet(token, method, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `https://api.telegram.org/bot${token}/${method}${qs ? '?' + qs : ''}`;
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

// GET /api/gifts/image?name=instant_ramen
giftsRouter.get('/image', async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'missing name' });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return res.status(503).json({ error: 'no bot token' });

  try {
    let filePath = pathCache.get(name);

    if (!filePath) {
      const setData = await tgGet(token, 'getStickerSet', { name });
      if (!setData.ok || !setData.result?.stickers?.length) {
        return res.status(404).json({ error: 'not found' });
      }
      const s = setData.result.stickers[0];
      const fileId = s.thumbnail?.file_id || s.file_id;
      const fileData = await tgGet(token, 'getFile', { file_id: fileId });
      if (!fileData.ok) return res.status(404).json({ error: 'file not found' });
      filePath = fileData.result.file_path;
      pathCache.set(name, filePath);
    }

    const imgUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

    https.get(imgUrl, (imgRes) => {
      res.setHeader('Content-Type', imgRes.headers['content-type'] || 'image/webp');
      res.setHeader('Cache-Control', 'public, max-age=604800');
      imgRes.pipe(res);
    }).on('error', () => res.status(500).json({ error: 'proxy error' }));

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
