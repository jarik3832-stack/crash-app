import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STARTING_BALANCE, STARTING_GEMS, STARTING_DEMO_BALANCE } from '../game/config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '..', '..', 'data', 'crash.db');
const schemaPath = join(__dirname, 'schema.sql');

export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');
db.exec(readFileSync(schemaPath, 'utf8'));

runMigrations();
seedCases();

function plain(row) {
  if (!row) return row;
  return { ...row };
}
function plainAll(rows) {
  return rows.map(plain);
}

function tx(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

// SQLite has no `ALTER TABLE ADD COLUMN IF NOT EXISTS` — probe PRAGMA and add missing columns
// so existing databases pick up new fields without manual intervention.
function runMigrations() {
  const usersCols = new Set(db.prepare('PRAGMA table_info(users)').all().map((c) => c.name));
  const userAdds = [
    ['gems', 'INTEGER NOT NULL DEFAULT 0'],
    ['demo_balance', `INTEGER NOT NULL DEFAULT ${STARTING_DEMO_BALANCE}`],
    ['demo_last_replenish_at', 'INTEGER'],
    ['insurance_enabled', 'INTEGER NOT NULL DEFAULT 0'],
    ['demo_enabled', 'INTEGER NOT NULL DEFAULT 0'],
  ];
  for (const [name, def] of userAdds) {
    if (!usersCols.has(name)) db.exec(`ALTER TABLE users ADD COLUMN ${name} ${def}`);
  }

  const betsCols = new Set(db.prepare('PRAGMA table_info(bets)').all().map((c) => c.name));
  const betAdds = [
    ['stake_paid', 'INTEGER NOT NULL DEFAULT 0'],
    ['demo', 'INTEGER NOT NULL DEFAULT 0'],
    ['insurance', 'INTEGER NOT NULL DEFAULT 0'],
  ];
  for (const [name, def] of betAdds) {
    if (!betsCols.has(name)) db.exec(`ALTER TABLE bets ADD COLUMN ${name} ${def}`);
  }

  db.exec('CREATE INDEX IF NOT EXISTS idx_bets_leaderboard ON bets(payout DESC) WHERE demo = 0 AND payout > 0');
}

function seedCases() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM cases').get().n;
  if (count > 0) return;

  const insertCase = db.prepare(
    'INSERT INTO cases (slug, name_ru, price_coins, image_emoji) VALUES (?, ?, ?, ?)'
  );
  const insertItem = db.prepare(
    `INSERT INTO case_items (case_id, reward_kind, amount, weight, label_ru, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const cases = [
    {
      slug: 'starter',
      name_ru: 'Стартовый кейс',
      price_coins: 500,
      image_emoji: '🎁',
      items: [
        { kind: 'coins', amount: 200, weight: 50, label: 'Утешение' },
        { kind: 'coins', amount: 600, weight: 35, label: 'Стандарт' },
        { kind: 'coins', amount: 2000, weight: 12, label: 'Большой' },
        { kind: 'gems', amount: 1, weight: 3, label: 'Алмаз' },
      ],
    },
    {
      slug: 'lucky',
      name_ru: 'Удачный кейс',
      price_coins: 2000,
      image_emoji: '🍀',
      items: [
        { kind: 'coins', amount: 800, weight: 50, label: 'Минимум' },
        { kind: 'coins', amount: 3000, weight: 30, label: 'Хорошо' },
        { kind: 'coins', amount: 10000, weight: 15, label: 'Большой куш' },
        { kind: 'gems', amount: 5, weight: 5, label: 'Пять алмазов' },
      ],
    },
    {
      slug: 'diamond',
      name_ru: 'Алмазный кейс',
      price_coins: 10000,
      image_emoji: '💎',
      items: [
        { kind: 'coins', amount: 3000, weight: 40, label: 'Утешение' },
        { kind: 'coins', amount: 15000, weight: 35, label: 'Возврат' },
        { kind: 'gems', amount: 10, weight: 20, label: 'Десять алмазов' },
        { kind: 'gems', amount: 50, weight: 5, label: 'Джекпот' },
      ],
    },
  ];

  tx(() => {
    for (const c of cases) {
      const caseId = Number(insertCase.run(c.slug, c.name_ru, c.price_coins, c.image_emoji).lastInsertRowid);
      c.items.forEach((it, idx) => {
        insertItem.run(caseId, it.kind, it.amount, it.weight, it.label, idx);
      });
    }
  });
}

export { STARTING_BALANCE };

export function upsertUser({ telegram_id, username, first_name, photo_url }) {
  const existing = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegram_id);
  if (existing) {
    db.prepare(
      'UPDATE users SET username = ?, first_name = ?, photo_url = ? WHERE telegram_id = ?'
    ).run(username ?? null, first_name ?? null, photo_url ?? null, telegram_id);
    return plain(db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegram_id));
  }
  db.prepare(
    `INSERT INTO users (telegram_id, username, first_name, photo_url, balance, gems, demo_balance, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    telegram_id,
    username ?? null,
    first_name ?? null,
    photo_url ?? null,
    STARTING_BALANCE,
    STARTING_GEMS,
    STARTING_DEMO_BALANCE,
    Date.now()
  );
  return plain(db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegram_id));
}

export function getUser(telegram_id) {
  return plain(db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(telegram_id));
}

export function getUserHistory(telegram_id, limit = 50) {
  return plainAll(db.prepare(
    `SELECT b.id, b.amount, b.stake_paid, b.demo, b.insurance,
            b.cashout_multiplier, b.payout, b.placed_at,
            r.crash_point, r.id AS round_id
     FROM bets b
     JOIN rounds r ON r.id = b.round_id
     WHERE b.user_id = ?
     ORDER BY b.placed_at DESC
     LIMIT ?`
  ).all(telegram_id, limit));
}

export function getRecentRounds(limit = 30) {
  return plainAll(db.prepare(
    `SELECT id, crash_point, server_seed, seed_hash, crashed_at
     FROM rounds
     WHERE crashed_at > 0
     ORDER BY id DESC
     LIMIT ?`
  ).all(limit));
}

export function createPendingRound({ server_seed, seed_hash, started_at }) {
  return Number(db.prepare(
    'INSERT INTO rounds (server_seed, seed_hash, started_at) VALUES (?, ?, ?)'
  ).run(server_seed, seed_hash, started_at).lastInsertRowid);
}

export function finalizeRound({ round_id, crash_point, crashed_at }) {
  db.prepare('UPDATE rounds SET crash_point = ?, crashed_at = ? WHERE id = ?')
    .run(crash_point, crashed_at, round_id);
}

export function placeBetTx({ user_id, amount, stake_paid, round_id, demo, insurance }) {
  return tx(() => {
    const balanceCol = demo ? 'demo_balance' : 'balance';
    const user = db.prepare(`SELECT ${balanceCol} AS bal FROM users WHERE telegram_id = ?`).get(user_id);
    if (!user) throw new Error('user_not_found');
    if (user.bal < stake_paid) throw new Error('insufficient_balance');

    if (demo) {
      db.prepare('UPDATE users SET demo_balance = demo_balance - ? WHERE telegram_id = ?')
        .run(stake_paid, user_id);
    } else {
      db.prepare(
        'UPDATE users SET balance = balance - ?, total_wagered = total_wagered + ? WHERE telegram_id = ?'
      ).run(stake_paid, amount, user_id);
    }

    const id = Number(db.prepare(
      `INSERT INTO bets (round_id, user_id, amount, stake_paid, demo, insurance, placed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(round_id, user_id, amount, stake_paid, demo ? 1 : 0, insurance ? 1 : 0, Date.now()).lastInsertRowid);
    return id;
  });
}

export function settleCashoutTx({ bet_id, multiplier }) {
  return tx(() => {
    const bet = db.prepare('SELECT * FROM bets WHERE id = ?').get(bet_id);
    if (!bet) throw new Error('bet_not_found');
    if (bet.cashout_multiplier != null) throw new Error('already_cashed_out');
    const payout = Math.floor(bet.amount * multiplier);
    db.prepare('UPDATE bets SET cashout_multiplier = ?, payout = ? WHERE id = ?')
      .run(multiplier, payout, bet_id);

    if (bet.demo) {
      db.prepare(`UPDATE users
                  SET demo_balance = demo_balance + ?,
                      rounds_played = rounds_played + 1,
                      biggest_multiplier = MAX(biggest_multiplier, ?)
                  WHERE telegram_id = ?`)
        .run(payout, multiplier, bet.user_id);
    } else {
      db.prepare(`UPDATE users
                  SET balance = balance + ?,
                      total_won = total_won + ?,
                      rounds_played = rounds_played + 1,
                      biggest_multiplier = MAX(biggest_multiplier, ?)
                  WHERE telegram_id = ?`)
        .run(payout, payout, multiplier, bet.user_id);
    }
    return payout;
  });
}

export function settleRoundLossesTx(round_id, crashPoint) {
  return tx(() => {
    const open = db.prepare(
      'SELECT id, user_id, amount, demo, insurance FROM bets WHERE round_id = ? AND cashout_multiplier IS NULL'
    ).all(round_id);

    const refunds = [];
    const lossStmt = db.prepare('UPDATE users SET rounds_played = rounds_played + 1 WHERE telegram_id = ?');
    const refundReal = db.prepare(
      'UPDATE users SET balance = balance + ?, rounds_played = rounds_played + 1 WHERE telegram_id = ?'
    );
    const refundDemo = db.prepare(
      'UPDATE users SET demo_balance = demo_balance + ?, rounds_played = rounds_played + 1 WHERE telegram_id = ?'
    );
    // We mark refunds in `bets`: payout = amount and a sentinel cashout_multiplier of 1.00 so the
    // bet doesn't look forever-open. (Real winning cashouts always have multiplier > 1.00.)
    const markRefund = db.prepare('UPDATE bets SET cashout_multiplier = 1.00, payout = ? WHERE id = ?');

    for (const b of open) {
      if (b.insurance && crashPoint === 1.00) {
        if (b.demo) refundDemo.run(b.amount, b.user_id);
        else refundReal.run(b.amount, b.user_id);
        markRefund.run(b.amount, b.id);
        refunds.push({ user_id: b.user_id, amount: b.amount });
      } else {
        lossStmt.run(b.user_id);
      }
    }
    return refunds;
  });
}

export function claimDailyBonus(telegram_id, amount, cooldownMs) {
  const now = Date.now();
  const user = db.prepare('SELECT last_daily_bonus FROM users WHERE telegram_id = ?').get(telegram_id);
  if (!user) throw new Error('user_not_found');
  if (user.last_daily_bonus && now - user.last_daily_bonus < cooldownMs) {
    return { claimed: false, next_at: user.last_daily_bonus + cooldownMs };
  }
  db.prepare('UPDATE users SET balance = balance + ?, last_daily_bonus = ? WHERE telegram_id = ?')
    .run(amount, now, telegram_id);
  return { claimed: true, amount, next_at: now + cooldownMs };
}

export function getLeaderboard({ period = 'all', limit, userId }) {
  const sinceClause = period === 'day' ? 'AND b.placed_at >= ?' : '';
  const params = period === 'day' ? [Date.now() - 24 * 60 * 60 * 1000, limit] : [limit];

  const rows = plainAll(db.prepare(
    `SELECT b.id AS bet_id, b.user_id, b.amount, b.cashout_multiplier, b.payout, b.placed_at,
            u.username, u.first_name, u.photo_url
     FROM bets b
     JOIN users u ON u.telegram_id = b.user_id
     WHERE b.demo = 0 AND b.payout > 0 ${sinceClause}
     ORDER BY b.payout DESC
     LIMIT ?`
  ).all(...params));

  let me = null;
  if (userId) {
    const since = Date.now() - 24 * 60 * 60 * 1000;
    const periodClause = period === 'day' ? 'AND placed_at >= ?' : '';
    const periodArgs = period === 'day' ? [since] : [];

    const meRow = db.prepare(
      `SELECT MAX(payout) AS best FROM bets
       WHERE demo = 0 AND payout > 0 AND user_id = ? ${periodClause}`
    ).get(userId, ...periodArgs);

    if (meRow?.best > 0) {
      const above = db.prepare(
        `SELECT COUNT(*) AS n FROM bets
         WHERE demo = 0 AND payout > ? ${periodClause}`
      ).get(meRow.best, ...periodArgs);
      me = { rank: above.n + 1, payout: meRow.best };
    }
  }

  return { rows, me };
}

export function replenishDemoTx({ telegram_id, target, cooldownMs }) {
  return tx(() => {
    const user = db.prepare(
      'SELECT demo_balance, demo_last_replenish_at FROM users WHERE telegram_id = ?'
    ).get(telegram_id);
    if (!user) throw new Error('user_not_found');
    const now = Date.now();
    if (user.demo_balance >= target) {
      return { ok: false, reason: 'not_needed', demo_balance: user.demo_balance };
    }
    if (user.demo_last_replenish_at && now - user.demo_last_replenish_at < cooldownMs) {
      return {
        ok: false,
        reason: 'cooldown',
        next_at: user.demo_last_replenish_at + cooldownMs,
        demo_balance: user.demo_balance,
      };
    }
    db.prepare(
      'UPDATE users SET demo_balance = ?, demo_last_replenish_at = ? WHERE telegram_id = ?'
    ).run(target, now, telegram_id);
    return { ok: true, demo_balance: target, next_at: now + cooldownMs };
  });
}

export function updateUserSettings(telegram_id, { insurance_enabled, demo_enabled }) {
  const sets = [];
  const args = [];
  if (insurance_enabled !== undefined) {
    sets.push('insurance_enabled = ?');
    args.push(insurance_enabled ? 1 : 0);
  }
  if (demo_enabled !== undefined) {
    sets.push('demo_enabled = ?');
    args.push(demo_enabled ? 1 : 0);
  }
  if (sets.length === 0) return getUser(telegram_id);
  args.push(telegram_id);
  db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE telegram_id = ?`).run(...args);
  return getUser(telegram_id);
}

// ============ Admin functions ============
export function isAdmin(telegram_id) {
  const row = db.prepare('SELECT 1 FROM admins WHERE telegram_id = ?').get(telegram_id);
  return !!row;
}

export function addAdmin(telegram_id) {
  db.prepare('INSERT OR IGNORE INTO admins (telegram_id, granted_at) VALUES (?, ?)').run(telegram_id, Date.now());
}

export function removeAdmin(telegram_id) {
  db.prepare('DELETE FROM admins WHERE telegram_id = ?').run(telegram_id);
}

export function listAdmins() {
  return plainAll(db.prepare(`
    SELECT u.telegram_id, u.username, u.first_name, a.granted_at
    FROM admins a
    JOIN users u ON u.telegram_id = a.telegram_id
  `).all());
}

export function adminListUsers({ limit = 100, offset = 0, search = '' }) {
  const searchClause = search ? 'WHERE username LIKE ? OR first_name LIKE ?' : '';
  const searchArgs = search ? [`%${search}%`, `%${search}%`] : [];
  return plainAll(db.prepare(`
    SELECT telegram_id, username, first_name, balance, gems, demo_balance,
           total_wagered, total_won, rounds_played, biggest_multiplier, created_at
    FROM users
    ${searchClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...searchArgs, limit, offset));
}

export function adminUpdateUserBalance(telegram_id, { balance, gems }) {
  const sets = [];
  const args = [];
  if (balance !== undefined) {
    sets.push('balance = ?');
    args.push(balance);
  }
  if (gems !== undefined) {
    sets.push('gems = ?');
    args.push(gems);
  }
  if (sets.length === 0) return getUser(telegram_id);
  args.push(telegram_id);
  db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE telegram_id = ?`).run(...args);
  return getUser(telegram_id);
}

export function adminListCases() {
  const cases = plainAll(db.prepare('SELECT * FROM cases ORDER BY id').all());
  for (const c of cases) {
    c.items = plainAll(db.prepare('SELECT * FROM case_items WHERE case_id = ? ORDER BY sort_order').all(c.id));
  }
  return cases;
}

export function adminCreateCase({ slug, name_ru, price_coins, image_emoji, items }) {
  return tx(() => {
    const caseId = Number(db.prepare(
      'INSERT INTO cases (slug, name_ru, price_coins, image_emoji) VALUES (?, ?, ?, ?)'
    ).run(slug, name_ru, price_coins, image_emoji).lastInsertRowid);

    const insertItem = db.prepare(
      'INSERT INTO case_items (case_id, reward_kind, amount, weight, label_ru, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    );
    items.forEach((it, idx) => {
      insertItem.run(caseId, it.reward_kind, it.amount, it.weight, it.label_ru, idx);
    });

    return caseId;
  });
}

export function adminUpdateCase(caseId, { slug, name_ru, price_coins, image_emoji, enabled }) {
  const sets = [];
  const args = [];
  if (slug !== undefined) { sets.push('slug = ?'); args.push(slug); }
  if (name_ru !== undefined) { sets.push('name_ru = ?'); args.push(name_ru); }
  if (price_coins !== undefined) { sets.push('price_coins = ?'); args.push(price_coins); }
  if (image_emoji !== undefined) { sets.push('image_emoji = ?'); args.push(image_emoji); }
  if (enabled !== undefined) { sets.push('enabled = ?'); args.push(enabled ? 1 : 0); }
  if (sets.length === 0) return;
  args.push(caseId);
  db.prepare(`UPDATE cases SET ${sets.join(', ')} WHERE id = ?`).run(...args);
}

export function adminDeleteCase(caseId) {
  db.prepare('DELETE FROM cases WHERE id = ?').run(caseId);
}

export function adminUpdateCaseItems(caseId, items) {
  return tx(() => {
    db.prepare('DELETE FROM case_items WHERE case_id = ?').run(caseId);
    const insertItem = db.prepare(
      'INSERT INTO case_items (case_id, reward_kind, amount, weight, label_ru, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    );
    items.forEach((it, idx) => {
      insertItem.run(caseId, it.reward_kind, it.amount, it.weight, it.label_ru, idx);
    });
  });
}

export { tx };
