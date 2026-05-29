import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function signSession(telegram_id) {
  return jwt.sign({ sub: telegram_id }, SECRET, { expiresIn: '7d' });
}

export function verifySession(token) {
  try {
    const decoded = jwt.verify(token, SECRET);
    return decoded.sub;
  } catch {
    return null;
  }
}
