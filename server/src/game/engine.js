import { EventEmitter } from 'node:events';
import {
  createPendingRound,
  finalizeRound,
  getUser,
  placeBetTx,
  settleCashoutTx,
  settleRoundLossesTx,
} from '../db/index.js';
import { generateServerSeed, hashSeed, generateCrashPoint } from './crashPoint.js';
import {
  BETTING_MS,
  CRASHED_MS,
  MULTIPLIER_RATE,
  MIN_BET,
  MAX_BET,
  INSURANCE_PREMIUM_RATE,
} from './config.js';

export const PHASE = { BETTING: 'betting', FLYING: 'flying', CRASHED: 'crashed' };

class GameEngine extends EventEmitter {
  constructor() {
    super();
    this.phase = PHASE.BETTING;
    this.roundId = null;
    this.serverSeed = null;
    this.seedHash = null;
    this.crashPoint = null;
    this.bettingEndsAt = 0;
    this.flyingStartedAt = 0;
    this.crashedAt = 0;
    this.crashedEndsAt = 0;
    this.bets = new Map();
  }

  start() {
    this._beginBetting();
  }

  multiplierAt(nowMs) {
    if (this.phase !== PHASE.FLYING) return 1.00;
    const t = Math.max(0, (nowMs - this.flyingStartedAt) / 1000);
    return Math.exp(MULTIPLIER_RATE * t);
  }

  snapshot() {
    return {
      phase: this.phase,
      roundId: this.roundId,
      seedHash: this.seedHash,
      bettingEndsAt: this.bettingEndsAt,
      flyingStartedAt: this.flyingStartedAt,
      crashedAt: this.crashedAt,
      crashedEndsAt: this.crashedEndsAt,
      crashPoint: this.phase === PHASE.CRASHED ? this.crashPoint : null,
      serverSeed: this.phase === PHASE.CRASHED ? this.serverSeed : null,
      bets: [...this.bets.values()].map((b) => ({
        user_id: b.user_id,
        username: b.username,
        photo_url: b.photo_url,
        amount: b.amount,
        demo: b.demo ? 1 : 0,
        insurance: b.insurance ? 1 : 0,
        cashout_multiplier: b.cashout_multiplier ?? null,
        payout: b.payout ?? 0,
      })),
      serverNow: Date.now(),
    };
  }

  placeBet({ user_id, amount, autoCashout, demo = false, insurance = false }) {
    if (this.phase !== PHASE.BETTING) throw new Error('not_betting_phase');
    if (this.bets.has(user_id)) throw new Error('already_bet');
    if (!Number.isInteger(amount) || amount < MIN_BET || amount > MAX_BET) {
      throw new Error('invalid_amount');
    }
    if (autoCashout != null && (typeof autoCashout !== 'number' || autoCashout < 1.01 || autoCashout > 1000)) {
      throw new Error('invalid_autocashout');
    }
    const user = getUser(user_id);
    if (!user) throw new Error('user_not_found');

    const stake_paid = insurance ? amount + Math.ceil(amount * INSURANCE_PREMIUM_RATE) : amount;

    const bet_id = placeBetTx({
      user_id,
      amount,
      stake_paid,
      round_id: this.roundId,
      demo: !!demo,
      insurance: !!insurance,
    });

    const entry = {
      bet_id,
      user_id,
      username: user.username || user.first_name || `Player ${user_id}`,
      photo_url: user.photo_url,
      amount,
      stake_paid,
      demo: !!demo,
      insurance: !!insurance,
      autoCashout: autoCashout ?? null,
      cashout_multiplier: null,
      payout: 0,
    };
    this.bets.set(user_id, entry);

    this.emit('bet_placed', {
      user_id,
      username: entry.username,
      photo_url: entry.photo_url,
      amount,
      demo: entry.demo ? 1 : 0,
      insurance: entry.insurance ? 1 : 0,
    });
    return entry;
  }

  cashout({ user_id }) {
    if (this.phase !== PHASE.FLYING) throw new Error('not_flying_phase');
    const bet = this.bets.get(user_id);
    if (!bet) throw new Error('no_bet');
    if (bet.cashout_multiplier != null) throw new Error('already_cashed_out');

    const now = Date.now();
    const multiplier = Math.max(1.00, Math.floor(this.multiplierAt(now) * 100) / 100);

    if (multiplier > this.crashPoint) throw new Error('round_already_crashed');

    const payout = settleCashoutTx({ bet_id: bet.bet_id, multiplier });
    bet.cashout_multiplier = multiplier;
    bet.payout = payout;

    this.emit('cashed_out', {
      user_id,
      username: bet.username,
      multiplier,
      payout,
    });
    return { multiplier, payout };
  }

  _beginBetting() {
    this.phase = PHASE.BETTING;
    this.serverSeed = generateServerSeed();
    this.seedHash = hashSeed(this.serverSeed);
    const now = Date.now();
    this.roundId = createPendingRound({
      server_seed: this.serverSeed,
      seed_hash: this.seedHash,
      started_at: now,
    });
    this.crashPoint = generateCrashPoint(this.serverSeed, this.roundId);
    this.bettingEndsAt = now + BETTING_MS;
    this.flyingStartedAt = 0;
    this.crashedAt = 0;
    this.crashedEndsAt = 0;
    this.bets = new Map();

    this.emit('round_started', {
      roundId: this.roundId,
      seedHash: this.seedHash,
      bettingEndsAt: this.bettingEndsAt,
      serverNow: now,
    });
    setTimeout(() => this._beginFlying(), BETTING_MS);
  }

  _beginFlying() {
    this.phase = PHASE.FLYING;
    this.flyingStartedAt = Date.now();
    const flightMs = Math.log(this.crashPoint) / MULTIPLIER_RATE * 1000;
    this.emit('flying_started', {
      flyingStartedAt: this.flyingStartedAt,
      serverNow: this.flyingStartedAt,
    });
    for (const bet of this.bets.values()) {
      if (bet.autoCashout) {
        const targetMs = Math.log(bet.autoCashout) / MULTIPLIER_RATE * 1000;
        if (targetMs < flightMs) {
          setTimeout(() => {
            if (this.phase === PHASE.FLYING && bet.cashout_multiplier == null) {
              try { this.cashout({ user_id: bet.user_id }); } catch { /* swallow */ }
            }
          }, targetMs);
        }
      }
    }
    setTimeout(() => this._crash(), flightMs);
  }

  _crash() {
    if (this.phase !== PHASE.FLYING) return;
    this.phase = PHASE.CRASHED;
    this.crashedAt = Date.now();
    this.crashedEndsAt = this.crashedAt + CRASHED_MS;

    const refunds = settleRoundLossesTx(this.roundId, this.crashPoint);
    for (const r of refunds) {
      const inMem = this.bets.get(r.user_id);
      if (inMem) {
        inMem.cashout_multiplier = 1.00;
        inMem.payout = r.amount;
      }
    }

    finalizeRound({
      round_id: this.roundId,
      crash_point: this.crashPoint,
      crashed_at: this.crashedAt,
    });
    this.emit('round_crashed', {
      roundId: this.roundId,
      crashPoint: this.crashPoint,
      serverSeed: this.serverSeed,
      refunds,
      serverNow: this.crashedAt,
    });
    setTimeout(() => this._beginBetting(), CRASHED_MS);
  }
}

export const engine = new GameEngine();
