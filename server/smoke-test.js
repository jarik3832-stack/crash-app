// End-to-end smoke test: two simulated players, both bet, both cash out.
// Run with: node smoke-test.js
import { io } from 'socket.io-client';

const BASE = 'http://localhost:3001';

async function auth(id, first_name) {
  const res = await fetch(`${BASE}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dev: { id, first_name } }),
  });
  if (!res.ok) throw new Error(`auth failed: ${res.status}`);
  return await res.json();
}

async function me(token) {
  const res = await fetch(`${BASE}/api/me`, { headers: { Authorization: `Bearer ${token}` } });
  return (await res.json()).user;
}

function connect(token, label) {
  const s = io(BASE, { auth: { token }, transports: ['websocket'] });
  s.on('connect', () => console.log(`[${label}] connected`));
  s.on('state', (st) => console.log(`[${label}] state phase=${st.phase} bets=${st.bets.length}`));
  s.on('round_started', (p) => console.log(`[${label}] round_started #${p.roundId}`));
  s.on('flying_started', () => console.log(`[${label}] flying_started`));
  s.on('bet_placed', (p) => console.log(`[${label}] saw bet: ${p.username} ${p.amount}`));
  s.on('cashed_out', (p) => console.log(`[${label}] saw cashout: ${p.username} @ ${p.multiplier}x payout=${p.payout}`));
  s.on('round_crashed', (p) => console.log(`[${label}] round_crashed @ ${p.crashPoint}x seed=${p.serverSeed.slice(0,12)}…`));
  return s;
}

function emitAsync(socket, event, payload) {
  return new Promise((resolve) => socket.emit(event, payload, resolve));
}

(async () => {
  const a = await auth(111, 'Alice');
  const b = await auth(222, 'Bob');
  console.log('Alice:', a.user.telegram_id, 'bal', a.user.balance);
  console.log('Bob:  ', b.user.telegram_id, 'bal', b.user.balance);

  const sA = connect(a.token, 'A');
  const sB = connect(b.token, 'B');

  // wait for both to connect
  await new Promise((r) => setTimeout(r, 500));

  // wait for a betting phase
  console.log('--- waiting for betting phase ---');
  await new Promise((resolve) => {
    const check = () => {
      fetch(`${BASE}/health`).then((r) => r.json()).then((h) => {
        if (h.phase === 'betting') resolve();
        else setTimeout(check, 200);
      });
    };
    check();
  });

  // both bet
  console.log('--- placing bets ---');
  const bA = await emitAsync(sA, 'place_bet', { amount: 100, autoCashout: 1.5 });
  const bB = await emitAsync(sB, 'place_bet', { amount: 200 });
  console.log('A place_bet:', bA);
  console.log('B place_bet:', bB);

  // wait for flying
  await new Promise((resolve) => {
    const check = () => {
      fetch(`${BASE}/health`).then((r) => r.json()).then((h) => {
        if (h.phase === 'flying') resolve();
        else setTimeout(check, 100);
      });
    };
    check();
  });

  // wait 1.5s then B cashes out manually
  await new Promise((r) => setTimeout(r, 1500));
  console.log('--- B manual cashout ---');
  const co = await emitAsync(sB, 'cashout');
  console.log('B cashout:', co);

  // wait for crash
  await new Promise((resolve) => {
    const check = () => {
      fetch(`${BASE}/health`).then((r) => r.json()).then((h) => {
        if (h.phase === 'crashed') resolve();
        else setTimeout(check, 200);
      });
    };
    check();
  });

  await new Promise((r) => setTimeout(r, 500));

  // verify balances + history
  const uA = await me(a.token);
  const uB = await me(b.token);
  console.log('--- final ---');
  console.log('Alice balance:', uA.balance, 'wagered:', uA.total_wagered, 'won:', uA.total_won);
  console.log('Bob   balance:', uB.balance, 'wagered:', uB.total_wagered, 'won:', uB.total_won);

  sA.close();
  sB.close();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
