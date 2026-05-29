import { createHmac } from 'node:crypto';

// Validate Telegram Mini App initData per
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
export function validateInitData(initData, botToken) {
  if (!initData || !botToken) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const pairs = [];
  for (const [k, v] of params.entries()) pairs.push(`${k}=${v}`);
  pairs.sort();
  const dataCheckString = pairs.join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (computedHash !== hash) return null;

  const authDate = parseInt(params.get('auth_date') ?? '0', 10);
  if (!authDate || Date.now() / 1000 - authDate > 86400) return null; // 24h freshness

  let user = null;
  const userRaw = params.get('user');
  if (userRaw) {
    try {
      user = JSON.parse(userRaw);
    } catch {
      return null;
    }
  }
  if (!user || !user.id) return null;

  return {
    telegram_id: user.id,
    username: user.username ?? null,
    first_name: user.first_name ?? null,
    photo_url: user.photo_url ?? null,
  };
}
