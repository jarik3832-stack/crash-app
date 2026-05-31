import { Router } from 'express';
import { validateInitData } from '../auth/telegram.js';
import { signSession, verifySession } from '../auth/jwt.js';
import {
  upsertUser,
  getUser,
  getUserHistory,
  getRecentRounds,
  claimDailyBonus,
  getLeaderboard,
  replenishDemoTx,
  updateUserSettings,
} from '../db/index.js';
import {
  DAILY_BONUS,
  DAILY_BONUS_COOLDOWN_MS,
  LEADERBOARD_SIZE,
  DEMO_REPLENISH_AMOUNT,
  DEMO_REPLENISH_COOLDOWN_MS,
} from '../game/config.js';
import { listCases, openCase } from '../game/cases.js';
import * as pvp from '../game/pvp.js';

export const apiRouter = Router();

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'missing_token' });
  }
  const token = header.slice(7);
  const userId = verifySession(token);
  if (!userId) return res.status(401).json({ error: 'invalid_token' });
  req.userId = userId;
  next();
}

apiRouter.post('/auth', (req, res) => {
  const { initData, dev } = req.body ?? {};
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const allowDevAuth = process.env.ALLOW_DEV_AUTH === '1' || !botToken;

  let userData = null;

  if (initData && botToken) {
    userData = validateInitData(initData, botToken);
    if (!userData) return res.status(401).json({ error: 'invalid_init_data' });
  } else if (allowDevAuth && dev && dev.id) {
    userData = {
      telegram_id: Number(dev.id),
      username: dev.username ?? null,
      first_name: dev.first_name ?? `Dev ${dev.id}`,
      photo_url: dev.photo_url ?? null,
    };
  } else {
    return res.status(400).json({ error: 'missing_init_data' });
  }

  const user = upsertUser(userData);
  const token = signSession(user.telegram_id);
  res.json({ token, user });
});

apiRouter.get('/me', authMiddleware, (req, res) => {
  const user = getUser(req.userId);
  if (!user) return res.status(404).json({ error: 'not_found' });
  res.json({ user });
});

apiRouter.get('/history', authMiddleware, (req, res) => {
  const rows = getUserHistory(req.userId, 50);
  res.json({ history: rows });
});

apiRouter.get('/rounds', (_req, res) => {
  const rounds = getRecentRounds(30);
  res.json({ rounds });
});

apiRouter.post('/daily-bonus', authMiddleware, (req, res) => {
  try {
    const result = claimDailyBonus(req.userId, DAILY_BONUS, DAILY_BONUS_COOLDOWN_MS);
    const user = getUser(req.userId);
    res.json({ ...result, user });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

apiRouter.get('/leaderboard', authMiddleware, (req, res) => {
  const period = req.query.period === 'day' ? 'day' : 'all';
  const data = getLeaderboard({ period, limit: LEADERBOARD_SIZE, userId: req.userId });
  res.json(data);
});

apiRouter.post('/demo/replenish', authMiddleware, (req, res) => {
  const result = replenishDemoTx({
    telegram_id: req.userId,
    target: DEMO_REPLENISH_AMOUNT,
    cooldownMs: DEMO_REPLENISH_COOLDOWN_MS,
  });
  if (result.ok) return res.json(result);
  if (result.reason === 'cooldown') return res.status(429).json(result);
  return res.status(400).json(result);
});

apiRouter.post('/settings', authMiddleware, (req, res) => {
  const { insurance_enabled, demo_enabled } = req.body ?? {};
  const user = updateUserSettings(req.userId, {
    insurance_enabled,
    demo_enabled,
  });
  res.json({ user });
});

apiRouter.get('/cases', authMiddleware, (_req, res) => {
  res.json({ cases: listCases() });
});

apiRouter.post('/cases/:slug/open', authMiddleware, (req, res) => {
  try {
    const result = openCase({ telegram_id: req.userId, slug: req.params.slug });
    res.json(result);
  } catch (e) {
    const code = e.message === 'insufficient_balance' ? 400 : 404;
    res.status(code).json({ error: e.message });
  }
});

// PvP routes
apiRouter.get('/pvp/games', authMiddleware, (_req, res) => {
  const games = pvp.listGames();
  res.json({ games });
});

apiRouter.post('/pvp/games', authMiddleware, (req, res) => {
  const user = getUser(req.userId);
  const game = pvp.createGame(req.userId, user.username);
  pvp.joinGame(game.id, req.userId, user.username);
  res.json({ game });
});

apiRouter.post('/pvp/games/:gameId/join', authMiddleware, (req, res) => {
  try {
    const user = getUser(req.userId);
    const game = pvp.joinGame(req.params.gameId, req.userId, user.username);
    res.json({ game });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

apiRouter.post('/pvp/bet', authMiddleware, (req, res) => {
  try {
    const { gameId, amount, type } = req.body;
    const user = getUser(req.userId);

    if (type === 'stars' && user.balance < amount) {
      return res.status(400).json({ error: 'insufficient_balance' });
    }

    // Списываем баланс
    if (type === 'stars') {
      const db = require('../db/index.js').db;
      db.prepare('UPDATE users SET balance = balance - ? WHERE telegram_id = ?').run(amount, req.userId);
    }

    const game = pvp.placeBet(gameId, req.userId, amount, type);
    const updatedUser = getUser(req.userId);

    res.json({ game, user: updatedUser });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
