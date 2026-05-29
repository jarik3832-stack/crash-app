import { Router } from 'express';
import { createHmac, createHash } from 'crypto';
import { verifySession } from '../auth/jwt.js';
import { db } from '../db/index.js';

const router = Router();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CRYPTO_PAY_TOKEN = process.env.CRYPTO_PAY_TOKEN;
// 1 star = 1.19 RUB (Telegram rate)
const STAR_TO_RUB = 1.19;

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
  const userId = verifySession(header.slice(7));
  if (!userId) return res.status(401).json({ error: 'invalid_token' });
  req.userId = userId;
  next();
}

// Create Telegram Stars invoice
router.post('/stars/invoice', authMiddleware, async (req, res) => {
  const { stars } = req.body;
  if (!stars || typeof stars !== 'number' || stars < 1) {
    return res.status(400).json({ error: 'invalid_amount' });
  }
  if (!BOT_TOKEN) {
    return res.status(503).json({ error: 'stars_not_configured' });
  }
  try {
    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `${stars} монет`,
        description: `Зачисление ${stars} монет на игровой баланс в Darilo`,
        payload: JSON.stringify({ uid: req.userId, coins: stars }),
        currency: 'XTR',
        prices: [{ label: 'Монеты', amount: stars }],
      }),
    });
    const data = await r.json();
    if (!data.ok) throw new Error(data.description);
    res.json({ link: data.result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// TON exchange rate — returns TON/star and USDT display rate
router.get('/ton-rate', async (_req, res) => {
  try {
    const r = await fetch('https://tonapi.io/v2/rates?tokens=ton&currencies=usd,rub', {
      headers: { 'Accept': 'application/json' },
    });
    const data = await r.json();
    const tonUsd = data?.rates?.TON?.prices?.USD ?? 5.0;
    const tonRub = data?.rates?.TON?.prices?.RUB ?? 450;
    // 1 USDT ≈ 1 USD, so rub_per_usdt ≈ tonRub / tonUsd
    const rubPerUsdt = tonRub / tonUsd;
    res.json({ ton_per_star: 0.013 / tonUsd, ton_usd: tonUsd, rub_per_usdt: rubPerUsdt });
  } catch {
    res.json({ ton_per_star: 0.0025, ton_usd: 5.2, rub_per_usdt: 90 });
  }
});

// CryptoPay (Crypto Bot) USDT invoice for @Send payments
router.post('/cryptopay/invoice', authMiddleware, async (req, res) => {
  const { stars } = req.body;
  if (!stars || typeof stars !== 'number' || stars < 1) {
    return res.status(400).json({ error: 'invalid_amount' });
  }
  if (!CRYPTO_PAY_TOKEN) {
    return res.status(503).json({ error: 'cryptopay_not_configured' });
  }
  const rubles = (stars * STAR_TO_RUB).toFixed(2);
  const description = `Darilo deposit ${stars} stars`;
  const payload = JSON.stringify({ uid: req.userId, coins: stars });
  try {
    const r = await fetch('https://pay.crypt.bot/api/createInvoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Crypto-Pay-API-Token': CRYPTO_PAY_TOKEN,
      },
      body: JSON.stringify({
        currency_type: 'fiat',
        fiat: 'RUB',
        amount: rubles,
        accepted_assets: 'USDT',
        description,
        payload,
      }),
    });
    const data = await r.json();
    if (!data.ok) throw new Error(data.error?.name || JSON.stringify(data.error));
    const invoice = data.result;
    // mini_app_invoice_url opens inside Telegram Mini App context
    const url = invoice.mini_app_invoice_url || invoice.bot_invoice_url;
    res.json({ url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// CryptoPay webhook — credits balance on successful USDT payment
router.post('/cryptopay-webhook', async (req, res) => {
  res.json({ ok: true }); // respond immediately
  try {
    // Verify HMAC-SHA256 signature
    const signature = req.headers['crypto-pay-api-signature'];
    if (CRYPTO_PAY_TOKEN && signature) {
      const secretKey = createHash('sha256').update(CRYPTO_PAY_TOKEN).digest();
      const body = JSON.stringify(req.body);
      const expected = createHmac('sha256', secretKey).update(body).digest('hex');
      if (expected !== signature) {
        console.warn('[cryptopay-webhook] invalid signature, ignoring');
        return;
      }
    }
    const update = req.body;
    if (update.update_type === 'invoice_paid') {
      const invoice = update.payload;
      if (invoice?.payload) {
        const p = JSON.parse(invoice.payload);
        if (p.uid && p.coins) {
          db.prepare('UPDATE users SET balance = balance + ? WHERE telegram_id = ?')
            .run(p.coins, p.uid);
          console.log(`[cryptopay] USDT credited: ${p.coins} coins → user ${p.uid}`);
        }
      }
    }
  } catch (e) {
    console.error('[cryptopay-webhook]', e.message);
  }
});

// Telegram webhook — handles Stars pre_checkout_query and successful_payment
router.post('/tg-webhook', async (req, res) => {
  res.json({ ok: true }); // respond immediately
  const update = req.body;
  try {
    if (update.pre_checkout_query && BOT_TOKEN) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pre_checkout_query_id: update.pre_checkout_query.id, ok: true }),
      });
    }
    if (update.message?.successful_payment) {
      const payment = update.message.successful_payment;
      const payload = JSON.parse(payment.invoice_payload);
      if (payload.uid && payload.coins) {
        db.prepare('UPDATE users SET balance = balance + ? WHERE telegram_id = ?')
          .run(payload.coins, payload.uid);
        console.log(`[payment] Stars credited: ${payload.coins} coins → user ${payload.uid}`);
      }
    }
  } catch (e) {
    console.error('[webhook]', e.message);
  }
});

export default router;
