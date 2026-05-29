import { verifySession } from '../auth/jwt.js';
import { engine } from '../game/engine.js';
import { getUser } from '../db/index.js';

export function attachSockets(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('missing_token'));
    const userId = verifySession(token);
    if (!userId) return next(new Error('invalid_token'));
    socket.data.userId = userId;
    next();
  });

  io.on('connection', (socket) => {
    socket.emit('state', engine.snapshot());

    socket.on('place_bet', (payload, ack) => {
      try {
        const amount = Number(payload?.amount);
        const autoCashout = payload?.autoCashout != null ? Number(payload.autoCashout) : null;
        const demo = !!payload?.demo;
        const insurance = !!payload?.insurance;
        engine.placeBet({ user_id: socket.data.userId, amount, autoCashout, demo, insurance });
        const user = getUser(socket.data.userId);
        ack?.({
          ok: true,
          balance: user.balance,
          gems: user.gems,
          demo_balance: user.demo_balance,
        });
      } catch (e) {
        ack?.({ ok: false, error: e.message });
      }
    });

    socket.on('cashout', (_payload, ack) => {
      try {
        const result = engine.cashout({ user_id: socket.data.userId });
        const user = getUser(socket.data.userId);
        ack?.({
          ok: true,
          ...result,
          balance: user.balance,
          gems: user.gems,
          demo_balance: user.demo_balance,
        });
      } catch (e) {
        ack?.({ ok: false, error: e.message });
      }
    });
  });

  const forward = (event) => (payload) => io.emit(event, { ...payload, serverNow: Date.now() });
  engine.on('round_started', forward('round_started'));
  engine.on('flying_started', forward('flying_started'));
  engine.on('bet_placed', forward('bet_placed'));
  engine.on('cashed_out', forward('cashed_out'));
  engine.on('round_crashed', forward('round_crashed'));
}
