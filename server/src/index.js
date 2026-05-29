import 'dotenv/config';
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { Server as IOServer } from 'socket.io';
import { apiRouter } from './routes/api.js';
import adminRouter from './routes/admin.js';
import paymentsRouter from './routes/payments.js';
import { attachSockets } from './sockets/handlers.js';
import { engine } from './game/engine.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLIENT_DIST = join(__dirname, '../../client/dist');
const IS_PROD = existsSync(CLIENT_DIST);

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const ORIGINS = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();

// В dev-режиме разрешаем CORS для Vite dev-сервера.
// В prod клиент раздаётся с того же порта — CORS не нужен.
if (!IS_PROD) {
  app.use(cors({ origin: ORIGINS, credentials: true }));
}

app.use(express.json({ limit: '64kb' }));
app.use('/api', apiRouter);
app.use('/api/admin', adminRouter);
app.use('/api/payments', paymentsRouter);
app.get('/health', (_req, res) => res.json({ ok: true, phase: engine.phase }));

// Статика фронтенда (только в prod — когда dist собран)
if (IS_PROD) {
  app.use(express.static(CLIENT_DIST));
  // SPA fallback — все не-API маршруты отдают index.html
  app.get(/^(?!\/api|\/health|\/socket\.io).*/, (_req, res) => {
    res.sendFile(join(CLIENT_DIST, 'index.html'));
  });
}

const httpServer = createServer(app);
const io = new IOServer(httpServer, {
  cors: IS_PROD ? false : { origin: ORIGINS, credentials: true },
});
attachSockets(io);

// Start the game loop.
engine.start();

httpServer.listen(PORT, () => {
  console.log(`[server] listening on :${PORT}`);
  const hasToken = !!process.env.TELEGRAM_BOT_TOKEN;
  const devAuth = process.env.ALLOW_DEV_AUTH === '1' || !hasToken;
  console.log(`[server] auth: telegram=${hasToken ? 'on' : 'off'} dev=${devAuth ? 'on' : 'off'}`);
});

// log phase transitions
engine.on('round_started', (p) => console.log(`[game] round ${p.roundId} started`));
engine.on('flying_started', () => console.log('[game] flying'));
engine.on('round_crashed', (p) => console.log(`[game] crashed @ ${p.crashPoint}x`));
