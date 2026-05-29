import { createHmac, randomBytes, createHash } from 'node:crypto';
import { HOUSE_EDGE, INSTANT_CRASH_PROB } from './config.js';

export function generateServerSeed() {
  return randomBytes(32).toString('hex');
}

export function hashSeed(seed) {
  return createHash('sha256').update(seed).digest('hex');
}

export function generateCrashPoint(serverSeed, roundId) {
  const hmac = createHmac('sha256', serverSeed).update(String(roundId)).digest('hex');
  const slice = hmac.slice(0, 13);
  const e = parseInt(slice, 16);
  const r = e / Math.pow(2, 52);

  if (r < INSTANT_CRASH_PROB) return 1.00;

  const payoutFactor = 1 - HOUSE_EDGE;
  const raw = (100 * payoutFactor) / (1 - r);
  const result = Math.floor(raw) / 100;
  return Math.max(1.00, result);
}
