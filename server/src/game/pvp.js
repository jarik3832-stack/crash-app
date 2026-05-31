// PvP game engine
const games = new Map();
let gameIdCounter = 1;

const COLORS = ['#a855f7', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'];

export function createGame(userId, username) {
  const gameId = `rg-${gameIdCounter++}`;

  const game = {
    id: gameId,
    status: 'waiting', // waiting, playing, finished
    players: [],
    totalPot: 0,
    totalStars: 0,
    jackpot: 0,
    createdAt: Date.now(),
    startedAt: null,
    finishedAt: null,
  };

  games.set(gameId, game);
  return game;
}

export function joinGame(gameId, userId, username) {
  const game = games.get(gameId);
  if (!game) throw new Error('Game not found');
  if (game.status !== 'waiting') throw new Error('Game already started');

  const existingPlayer = game.players.find(p => p.id === userId);
  if (existingPlayer) return game;

  const player = {
    id: userId,
    username,
    betAmount: 0,
    color: COLORS[game.players.length % COLORS.length],
    chance: 0,
  };

  game.players.push(player);
  recalculateChances(game);

  return game;
}

export function placeBet(gameId, userId, amount, type = 'stars') {
  const game = games.get(gameId);
  if (!game) throw new Error('Game not found');

  const player = game.players.find(p => p.id === userId);
  if (!player) throw new Error('Player not in game');

  player.betAmount += amount;

  if (type === 'stars') {
    game.totalStars += amount;
    game.totalPot += amount;
  }

  recalculateChances(game);

  // Автостарт если 2+ игроков и есть ставки
  if (game.players.length >= 2 && game.totalPot > 0 && game.status === 'waiting') {
    setTimeout(() => startGame(gameId), 5000);
  }

  return game;
}

function recalculateChances(game) {
  const total = game.totalPot;

  if (total === 0) {
    // Равные шансы если нет ставок
    const equalChance = 100 / game.players.length;
    game.players.forEach(p => p.chance = Math.round(equalChance));
  } else {
    // Шансы пропорциональны ставкам
    game.players.forEach(p => {
      p.chance = Math.round((p.betAmount / total) * 100);
    });
  }

  // Джекпот = 20% от банка
  game.jackpot = (total * 0.2).toFixed(2);
}

function startGame(gameId) {
  const game = games.get(gameId);
  if (!game || game.status !== 'waiting') return;

  game.status = 'playing';
  game.startedAt = Date.now();

  // Выбор победителя через 3 секунды
  setTimeout(() => finishGame(gameId), 3000);
}

function finishGame(gameId) {
  const game = games.get(gameId);
  if (!game || game.status !== 'playing') return;

  // Случайный выбор победителя с учетом шансов
  const winner = selectWinner(game);

  game.status = 'finished';
  game.finishedAt = Date.now();
  game.winner = winner;

  // Удаляем игру через 30 секунд
  setTimeout(() => games.delete(gameId), 30000);

  return { game, winner };
}

function selectWinner(game) {
  // Генерируем случайное число от 0 до 100
  const random = Math.random() * 100;

  let cumulative = 0;
  for (const player of game.players) {
    cumulative += player.chance;
    if (random <= cumulative) {
      return player;
    }
  }

  // Fallback на последнего игрока
  return game.players[game.players.length - 1];
}

export function getGame(gameId) {
  return games.get(gameId);
}

export function listGames() {
  return Array.from(games.values()).filter(g => g.status === 'waiting' || g.status === 'playing');
}

export function cleanupOldGames() {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 минут

  for (const [gameId, game] of games.entries()) {
    if (now - game.createdAt > maxAge) {
      games.delete(gameId);
    }
  }
}

// Очистка старых игр каждые 5 минут
setInterval(cleanupOldGames, 5 * 60 * 1000);
