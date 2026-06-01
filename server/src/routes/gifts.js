import { Router } from 'express';
import https from 'node:https';
import http from 'node:http';

export const giftsRouter = Router();

// Кэш file_id -> URL
const urlCache = new Map();

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

// GET /api/gifts/image?name=InstantRamen
// Возвращает URL изображения из Telegram sticker set
giftsRouter.get('/image', async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'missing name' });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return res.status(503).json({ error: 'no bot token' });

  const cacheKey = name;
  if (urlCache.has(cacheKey)) {
    return res.redirect(urlCache.get(cacheKey));
  }

  try {
    // Получаем стикер-сет подарка
    const setData = await fetchJson(
      `https://api.telegram.org/bot${token}/getStickerSet?name=${encodeURIComponent(name)}`
    );

    if (!setData.ok || !setData.result?.stickers?.length) {
      return res.status(404).json({ error: 'sticker set not found' });
    }

    const sticker = setData.result.stickers[0];
    // Получаем thumbnail или саму наклейку
    const fileId = sticker.thumbnail?.file_id || sticker.file_id;

    // Получаем путь файла
    const fileData = await fetchJson(
      `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`
    );

    if (!fileData.ok) return res.status(404).json({ error: 'file not found' });

    const fileUrl = `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`;
    urlCache.set(cacheKey, fileUrl);

    // Проксируем изображение
    https.get(fileUrl, (imgRes) => {
      res.setHeader('Content-Type', imgRes.headers['content-type'] || 'image/webp');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      imgRes.pipe(res);
    }).on('error', () => res.status(500).json({ error: 'proxy failed' }));

  } catch (err) {
    console.error('[gifts] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});
