import { Router } from 'express';
import { verifySession } from '../auth/jwt.js';
import { db } from '../db/index.js';

const router = Router();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

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

// TON exchange rate (1 star ≈ $0.013, convert to TON)
router.get('/ton-rate', async (_req, res) => {
  try {
    const r = await fetch('https://tonapi.io/v2/rates?tokens=ton&currencies=usd', {
      headers: { 'Accept': 'application/json' },
    });
    const data = await r.json();
    const tonUsd = data?.rates?.TON?.prices?.USD ?? 5.0;
    res.json({ ton_per_star: 0.013 / tonUsd, ton_usd: tonUsd });
  } catch {
    res.json({ ton_per_star: 0.0025, ton_usd: 5.2 });
  }
});

// Telegram webhook — handles pre_checkout_query and successful_payment
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
