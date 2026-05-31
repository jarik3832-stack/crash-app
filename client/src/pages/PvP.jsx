import { useState, useEffect } from 'react';
import { api } from '../api/http.js';
import { t } from '../i18n/ru.js';
import { AppHeader } from '../components/AppHeader.jsx';
import { StarIcon } from '../components/icons.jsx';

export function PvP({ user, onBalanceChange, telegramApi }) {
  const [games, setGames] = useState([]);
  const [currentGame, setCurrentGame] = useState(null);
  const [stage, setStage] = useState('lobby'); // lobby, game, result
  const [betAmount, setBetAmount] = useState(0);
  const [betType, setBetType] = useState('stars'); // stars, ton, gifts
  const [selectedGift, setSelectedGift] = useState(null);
  const [showBetModal, setShowBetModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadGames();
    const interval = setInterval(loadGames, 3000);
    return () => clearInterval(interval);
  }, []);

  async function loadGames() {
    try {
      const data = await api.pvpGames();
      setGames(data.games);
    } catch (err) {
      console.error('Failed to load PvP games:', err);
    }
  }

  async function createGame() {
    try {
      const game = await api.createPvpGame();
      setCurrentGame(game);
      setStage('game');
    } catch (err) {
      setError(err.message);
    }
  }

  async function joinGame(gameId) {
    try {
      const game = await api.joinPvpGame(gameId);
      setCurrentGame(game);
      setStage('game');
    } catch (err) {
      setError(err.message);
    }
  }

  async function placeBet() {
    if (!currentGame) return;

    if (betType === 'stars' && user.balance < betAmount) {
      setError('Недостаточно звезд');
      return;
    }

    try {
      const result = await api.placePvpBet({
        gameId: currentGame.id,
        amount: betAmount,
        type: betType,
        giftId: selectedGift?.id,
      });

      setCurrentGame(result.game);
      setShowBetModal(false);
      setBetAmount(0);
      onBalanceChange?.();
    } catch (err) {
      setError(err.message);
    }
  }

  function openBetModal(type) {
    setBetType(type);
    setShowBetModal(true);
    setError(null);
  }

  return (
    <div className="rocket-page">
      <AppHeader user={user} title="PvP" showToggles={false} telegramApi={telegramApi} />

      {stage === 'lobby' && (
        <div className="pvp-lobby">
          <div className="pvp-header">
            <button className="btn btn-primary" onClick={createGame}>
              Создать игру
            </button>
          </div>

          <div className="pvp-games-list">
            <h3>Активные игры</h3>
            {games.length === 0 ? (
              <div className="pvp-empty">
                Нет активных игр. Создай первую!
              </div>
            ) : (
              games.map((game) => (
                <div key={game.id} className="pvp-game-card" onClick={() => joinGame(game.id)}>
                  <div className="pvp-game-info">
                    <div className="pvp-game-id">Игра #{game.id}</div>
                    <div className="pvp-game-players">Игроков: {game.players.length}</div>
                    <div className="pvp-game-pot">
                      Банк: {game.totalPot} <StarIcon size={14} />
                    </div>
                  </div>
                  <div className="pvp-game-status">
                    {game.status === 'waiting' ? 'Ожидание' : 'Идет игра'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {stage === 'game' && currentGame && (
        <div className="pvp-game">
          <div className="pvp-game-header">
            <button className="pvp-close-btn" onClick={() => setStage('lobby')}>
              ✕ Закрыть
            </button>

            <div className="pvp-balance-chips">
              <div className="pvp-balance-chip">
                😊 0
              </div>
              <div className="pvp-balance-chip">
                0 💎
              </div>
              <div className="pvp-balance-chip">
                {user.balance} <StarIcon size={14} />
              </div>
            </div>
          </div>

          <div className="pvp-players-cards">
            {currentGame.players.slice(0, 2).map((player, idx) => (
              <div key={player.id} className="pvp-player-card">
                <div className="pvp-player-name">
                  {player.username || `Игрок #${player.id.slice(0, 10)}`}
                </div>
                <div className="pvp-player-bet">
                  {player.betAmount} <StarIcon size={12} />
                </div>
                <div className="pvp-player-time">1ч назад</div>
                <div className="pvp-player-chance">Шанс {player.chance}%</div>
              </div>
            ))}
          </div>

          <div className="pvp-stats-row">
            <div className="pvp-stat">
              <div className="pvp-stat-label">Всего:</div>
              <div className="pvp-stat-value">
                <span className="pvp-stat-icon">💎</span> 0 TON
              </div>
            </div>

            <div className="pvp-counters">
              <div className="pvp-counter">
                <span className="pvp-counter-icon">💎</span> 0
              </div>
              <div className="pvp-counter">
                <span className="pvp-counter-icon">🎁</span> 0
              </div>
              <div className="pvp-counter">
                <span className="pvp-counter-icon">⭐</span> {currentGame.totalStars || 10}
              </div>
            </div>

            <div className="pvp-stat">
              <div className="pvp-stat-label">Джекпот:</div>
              <div className="pvp-stat-value">
                <span className="pvp-stat-icon">💎</span> {currentGame.jackpot || '0.01'} TON
              </div>
              <div className="pvp-stat-percent">20%</div>
            </div>
          </div>

          <div className="pvp-wheel-container">
            <PvPWheel players={currentGame.players} />
          </div>

          <div className="pvp-bet-buttons">
            <button className="pvp-bet-btn" onClick={() => openBetModal('gifts')}>
              <span className="pvp-bet-icon">🎁</span> Гифты
            </button>
            <button className="pvp-bet-btn" onClick={() => openBetModal('ton')}>
              <span className="pvp-bet-icon">💎</span> TON
            </button>
            <button className="pvp-bet-btn" onClick={() => openBetModal('stars')}>
              <span className="pvp-bet-icon">⭐</span> Звезды
            </button>
          </div>

          <div className="pvp-players-list">
            <div className="pvp-players-header">
              <span>Игроков ({currentGame.players.length})</span>
              <span className="pvp-online-indicator">
                <span className="pvp-online-dot"></span> 0
              </span>
              <span className="pvp-game-id">Игра #{currentGame.id}</span>
            </div>
            {currentGame.players.map((player) => (
              <div key={player.id} className="pvp-player-row">
                <div className="pvp-player-avatar" style={{ background: player.color }}>
                  {player.username?.[0]?.toUpperCase() || 'P'}
                </div>
                <div className="pvp-player-info">
                  <div className="pvp-player-name">{player.username || `Игрок #${player.id.slice(0, 10)}`}</div>
                </div>
                <div className="pvp-player-total">
                  Всего {player.betAmount} TON
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showBetModal && (
        <div className="modal-backdrop" onClick={() => setShowBetModal(false)}>
          <div className="modal-content pvp-bet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {betType === 'stars' && 'Ставка звездами'}
                {betType === 'ton' && 'Ставка TON'}
                {betType === 'gifts' && 'Ставка гифтами'}
              </h3>
              <button className="modal-close" onClick={() => setShowBetModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {betType === 'stars' && (
                <>
                  <div className="form-group">
                    <label>Количество звезд:</label>
                    <input
                      type="number"
                      className="form-input"
                      value={betAmount}
                      onChange={(e) => setBetAmount(parseInt(e.target.value) || 0)}
                      placeholder="Введите количество"
                      min="1"
                      max={user.balance}
                    />
                  </div>
                  <div className="pvp-balance-info">
                    Ваш баланс: {user.balance} <StarIcon size={16} />
                  </div>
                  {user.balance < betAmount && (
                    <button className="btn btn-primary" style={{ marginTop: 12 }}>
                      Пополнить баланс
                    </button>
                  )}
                </>
              )}

              {betType === 'gifts' && (
                <div className="pvp-gifts-select">
                  <p>Выберите подарок для ставки:</p>
                  <div className="pvp-gifts-grid">
                    <div className="pvp-gift-card">
                      <div className="pvp-gift-emoji">🎁</div>
                      <div className="pvp-gift-name">Подарок 1</div>
                      <div className="pvp-gift-value">100 ⭐</div>
                    </div>
                  </div>
                </div>
              )}

              {error && <div className="feedback feedback-error">{error}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowBetModal(false)}>
                Отмена
              </button>
              <button
                className="btn btn-primary"
                onClick={placeBet}
                disabled={betAmount <= 0 || (betType === 'stars' && user.balance < betAmount)}
              >
                Сделать ставку
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PvPWheel({ players }) {
  const colors = ['#a855f7', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'];

  // Вычисляем углы для каждого игрока
  const total = players.reduce((sum, p) => sum + (p.betAmount || 0), 0);
  let currentAngle = 0;

  const segments = players.map((player, idx) => {
    const betAmount = player.betAmount || 0;
    const percentage = total > 0 ? (betAmount / total) * 100 : 100 / players.length;
    const angle = (percentage / 100) * 360;
    const segment = {
      player,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
      color: colors[idx % colors.length],
      percentage,
    };
    currentAngle += angle;
    return segment;
  });

  return (
    <div className="pvp-wheel">
      <svg viewBox="0 0 200 200" className="pvp-wheel-svg">
        <circle cx="100" cy="100" r="90" fill="#1a1a1a" />
        {segments.map((seg, idx) => {
          const startRad = (seg.startAngle - 90) * (Math.PI / 180);
          const endRad = (seg.endAngle - 90) * (Math.PI / 180);

          const x1 = 100 + 90 * Math.cos(startRad);
          const y1 = 100 + 90 * Math.sin(startRad);
          const x2 = 100 + 90 * Math.cos(endRad);
          const y2 = 100 + 90 * Math.sin(endRad);

          const largeArc = seg.endAngle - seg.startAngle > 180 ? 1 : 0;

          return (
            <path
              key={idx}
              d={`M 100 100 L ${x1} ${y1} A 90 90 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={seg.color}
              stroke="#000"
              strokeWidth="2"
            />
          );
        })}
        <circle cx="100" cy="100" r="50" fill="#000" />
      </svg>

      <div className="pvp-wheel-pointer">
        <div className="pvp-wheel-pointer-icon">🐻</div>
      </div>

      {segments.map((seg, idx) => {
        const midAngle = (seg.startAngle + seg.endAngle) / 2;
        const rad = (midAngle - 90) * (Math.PI / 180);
        const x = 50 + 35 * Math.cos(rad);
        const y = 50 + 35 * Math.sin(rad);

        return (
          <div
            key={idx}
            className="pvp-player-badge"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              background: seg.color,
            }}
          >
            {seg.player.username?.[0]?.toUpperCase() || 'P'}
          </div>
        );
      })}
    </div>
  );
}
