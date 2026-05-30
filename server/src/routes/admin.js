import express from 'express';
import { requireAdmin } from '../auth/admin.js';
import {
  adminListUsers,
  adminUpdateUserBalance,
  adminListCases,
  adminCreateCase,
  adminUpdateCase,
  adminDeleteCase,
  adminUpdateCaseItems,
  listAdmins,
  addAdmin,
  removeAdmin,
} from '../db/index.js';

const router = express.Router();

// All admin routes require admin privileges
router.use(requireAdmin);

// ============ Users management ============
router.get('/users', (req, res) => {
  const { limit = 100, offset = 0, search = '' } = req.query;
  const users = adminListUsers({ limit: Number(limit), offset: Number(offset), search });
  res.json({ users });
});

router.patch('/users/:telegram_id/balance', (req, res) => {
  const telegram_id = Number(req.params.telegram_id);
  const { balance, gems } = req.body;
  const user = adminUpdateUserBalance(telegram_id, { balance, gems });
  res.json({ user });
});

// ============ Cases management ============
router.get('/cases', (req, res) => {
  const cases = adminListCases();
  res.json({ cases });
});

router.post('/cases', (req, res) => {
  const { slug, name_ru, price_coins, image_emoji, image_url, rarity, items } = req.body;
  const caseId = adminCreateCase({ slug, name_ru, price_coins, image_emoji, image_url, rarity, items });
  res.json({ case_id: caseId });
});

router.patch('/cases/:id', (req, res) => {
  const caseId = Number(req.params.id);
  const { slug, name_ru, price_coins, image_emoji, image_url, rarity, enabled } = req.body;
  adminUpdateCase(caseId, { slug, name_ru, price_coins, image_emoji, image_url, rarity, enabled });
  res.json({ ok: true });
});

router.delete('/cases/:id', (req, res) => {
  const caseId = Number(req.params.id);
  adminDeleteCase(caseId);
  res.json({ ok: true });
});

router.put('/cases/:id/items', (req, res) => {
  const caseId = Number(req.params.id);
  const { items } = req.body;
  adminUpdateCaseItems(caseId, items);
  res.json({ ok: true });
});

// ============ Admins management ============
router.get('/admins', (req, res) => {
  const admins = listAdmins();
  res.json({ admins });
});

router.post('/admins', (req, res) => {
  const { telegram_id } = req.body;
  addAdmin(Number(telegram_id));
  res.json({ ok: true });
});

router.delete('/admins/:telegram_id', (req, res) => {
  const telegram_id = Number(req.params.telegram_id);
  removeAdmin(telegram_id);
  res.json({ ok: true });
});

export default router;
