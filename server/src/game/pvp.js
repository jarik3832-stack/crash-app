import { db } from '../db/index.js';

const COLORS = ['#a855f7', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];
const ROUND_DURATION_MS = 60 * 1000; // 60 секунд до спина
const SPIN_DURATION_MS = 5000;       // 5 секунд анимация спина

let currentGame = createNewGame();
let gameTimer = null;

function createNewGame() {
  const id = `rg-${Math.floor(10000 + Math.random() * 90000)}`;
  return {
    id,
    status: 'betting',  // betting | spinning | finished
    players: [],
    totalPot: 0,
    jackpot: '0.00',
    watching: 0,
    startedAt: Date.now(),
    winner: null,
  };
}

function recalcChances() {
  const total = currentGame.players.reduce((s, p) => s + p.betAmount, 0);
  currentGame.totalPot = total;
  currentGame.jackpot = (total * 0.2 / 100).toFixed(2);

  currentGame.players.forEach(p => {
    p.chance = total > 0 ? Math.round((p.betAmount / total) * 100) : 0;
  });
}

function selectWinner() {
  const total = currentGame.totalPot;
  if (total === 0 || currentGame.players.length === 0) return null;

  const rand = Math.random() * total;
  let cumulative = 0;
  for (const p of currentGame.players) {
    cumulative += p.betAmount;
    if (rand <= cumulative) return p;
  }
  return currentGame.players[currentGame.players.length - 1];
}

function startSpinTimer() {
  if (gameTimer) clearTimeout(gameTimer);

  gameTimer = setTimeout(() => {
    if (currentGame.players.length < 2 || currentGame.totalPot === 0) {
      // Не хватает игроков — сбрасываем таймер
      gameTimer = setTimeout(startSpinTimer, ROUND_DURATION_MS);
      return;
    }

    currentGame.status = 'spinning';

    setTimeout(() => {
      const winner = selectWinner();
      if (winner) {
        currentGame.status = 'finished';
        currentGame.winner = winner;

        // Выдаем выигрыш победителю
        db.prepare('UPDATE users SET balance = balance + ? WHERE telegram_id = ?')
          .run(currentGame.totalPot, winner.userId);
      }

      // Через 5 секунд — новая игра
      setTimeout(() => {
        currentGame = createNewGame();
        startSpinTimer();
      }, 5000);
    }, SPIN_DURATION_MS);
  }, ROUND_DURATION_MS);
}

// Запускаем первый таймер
startSpinTimer();

export function getCurrentGame() {
  return currentGame;
}

export function addBet(userId, username, amount) {
  if (currentGame.status !== 'betting') {
    throw new Error('round_in_progress');
  }

  let player = currentGame.players.find(p => p.userId === userId);
  if (!player) {
    const idx = currentGame.players.length;
    player = {
      userId,
      username,
      betAmount: 0,
      color: COLORS[idx % COLORS.length],
      chance: 0,
    };
    currentGame.players.push(player);
  }

  player.betAmount += amount;
  recalcChances();

  return currentGame;
}
