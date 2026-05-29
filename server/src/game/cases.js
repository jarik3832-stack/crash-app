import { randomInt } from 'node:crypto';
import { db, tx, getUser } from '../db/index.js';

export function listCases() {
  const cases = db.prepare(
    'SELECT id, slug, name_ru, price_coins, image_emoji FROM cases WHERE enabled = 1 ORDER BY price_coins ASC'
  ).all().map((c) => ({ ...c }));

  const itemStmt = db.prepare(
    `SELECT id, reward_kind, amount, weight, label_ru, sort_order
     FROM case_items WHERE case_id = ? ORDER BY sort_order ASC`
  );
  for (const c of cases) {
    c.items = itemStmt.all(c.id).map((it) => ({ ...it }));
    c.total_weight = c.items.reduce((s, it) => s + it.weight, 0);
  }
  return cases;
}

export function openCase({ telegram_id, slug }) {
  const caseRow = db.prepare(
    'SELECT id, slug, name_ru, price_coins, enabled FROM cases WHERE slug = ?'
  ).get(slug);
  if (!caseRow || !caseRow.enabled) throw new Error('case_not_found');

  const items = db.prepare(
    `SELECT id, reward_kind, amount, weight, label_ru, sort_order
     FROM case_items WHERE case_id = ? ORDER BY sort_order ASC`
  ).all(caseRow.id).map((it) => ({ ...it }));
  if (items.length === 0) throw new Error('case_empty');

  const totalWeight = items.reduce((s, it) => s + it.weight, 0);

  return tx(() => {
    const debit = db.prepare(
      'UPDATE users SET balance = balance - ? WHERE telegram_id = ? AND balance >= ?'
    ).run(caseRow.price_coins, telegram_id, caseRow.price_coins);
    if (debit.changes === 0) throw new Error('insufficient_balance');

    const r = randomInt(0, totalWeight);
    let acc = 0;
    let picked = items[items.length - 1];
    for (const it of items) {
      acc += it.weight;
      if (r < acc) { picked = it; break; }
    }

    if (picked.reward_kind === 'coins') {
      db.prepare('UPDATE users SET balance = balance + ? WHERE telegram_id = ?')
        .run(picked.amount, telegram_id);
    } else {
      db.prepare('UPDATE users SET gems = gems + ? WHERE telegram_id = ?')
        .run(picked.amount, telegram_id);
    }

    db.prepare(
      `INSERT INTO case_openings (user_id, case_id, case_item_id, reward_kind, amount, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(telegram_id, caseRow.id, picked.id, picked.reward_kind, picked.amount, Date.now());

    const user = getUser(telegram_id);
    return {
      case: { slug: caseRow.slug, name_ru: caseRow.name_ru, price_coins: caseRow.price_coins },
      item: {
        id: picked.id,
        reward_kind: picked.reward_kind,
        amount: picked.amount,
        label_ru: picked.label_ru,
        sort_order: picked.sort_order,
      },
      balances: {
        balance: user.balance,
        gems: user.gems,
        demo_balance: user.demo_balance,
      },
    };
  });
}
