import { isAdmin } from '../db/index.js';

export function requireAdmin(req, res, next) {
  if (!req.user?.telegram_id) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (!isAdmin(req.user.telegram_id)) {
    return res.status(403).json({ error: 'forbidden' });
  }
  next();
}
