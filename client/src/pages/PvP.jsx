import { useState, useEffect, useRef } from 'react';
import { api } from '../api/http.js';
import { AppHeader } from '../components/AppHeader.jsx';
import { StarIcon } from '../components/icons.jsx';

const COLORS = ['#a855f7', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];

export function PvP({ user, onBalanceChange, telegramApi }) {
  const [game, setGame] = useState(null);
  const [showStarsModal, setShowStarsModal] = useState(false);
  const [showGiftsModal, setShowGiftsModal] = useState(false);
  const [betAmount, setBetAmount] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGame();
    const interval = setInterval(loadGame, 2000);
    return () => clearInterval(interval);
  }, []);

  async function loadGame() {
    try {
      const data = await api.pvpCurrentGame();
      setGame(data.game);
    } catch {}
  }

  async function placeBet(amount) {
    if (loading) return;
    if (user.balance < amount) {
      setError('insufficient');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.placePvpBet({ amount, type: 'stars' });
      setGame(data.game);
      onBalanceChange?.();
      setShowStarsModal(false);
      setBetAmount('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const players = game?.players ?? [];
  const totalPot = players.reduce((s, p) => s + (p.betAmount || 0), 0);
  const myPlayer = players.find(p => p.userId === user.telegram_id);

  return (
    <div className="rocket-page">
      <AppHeader user={user} title="PvP" showToggles={false} telegramApi={telegramApi} />

      <div className="pvp-screen">

        {/* Карточки игроков вверху */}
        {players.length > 0 && (
          <div className="pvp-top-cards">
            {players.slice(0, 3).map((p, idx) => (
              <div key={p.userId} className="pvp-top-card" style={{ borderColor: COLORS[idx % COLORS.length] }}>
                <div className="pvp-top-card-name" style={{ color: COLORS[idx % COLORS.length] }}>
                  {p.username || `Игрок #${String(p.userId).slice(-6)}`}
                </div>
                <div className="pvp-top-card-bet">
                  {p.betAmount} <StarIcon size={12} />
                </div>
                <div className="pvp-top-card-chance">Шанс {p.chance}%</div>
              </div>
            ))}

            {/* Джекпот */}
            <div className="pvp-jackpot-card">
              <div className="pvp-jackpot-label">Джекпот</div>
              <div className="pvp-jackpot-value">{game?.jackpot || '0.00'} <span className="pvp-ton-icon">💎</span></div>
              <div className="pvp-jackpot-percent">20%</div>
            </div>
          </div>
        )}

        {/* Статистика */}
        <div className="pvp-stats-bar">
          <div className="pvp-stats-left">
            <span className="pvp-stat-text">Всего:</span>
            <span className="pvp-stat-val">{totalPot > 0 ? `${totalPot} TON` : '0 TON'}</span>
          </div>
          <div className="pvp-stats-center">
            <div className="pvp-mini-chip">💎 0</div>
            <div className="pvp-mini-chip">🎁 0</div>
            <div className="pvp-mini-chip">⭐ {totalPot}</div>
          </div>
          <div className="pvp-stats-right">
            <span className="pvp-stat-text">Джекпот:</span>
            <span className="pvp-stat-val pvp-jackpot-accent">{game?.jackpot || '0.01'} TON</span>
          </div>
        </div>

        {/* Колесо */}
        <div className="pvp-wheel-wrap">
          <div className="pvp-history-btn">↺</div>
          <div className="pvp-help-btn">?</div>

          <PvPWheel players={players} totalPot={totalPot} />
        </div>

        {/* Кнопки ставок */}
        <div className="pvp-actions">
          <button className="pvp-action-btn" onClick={() => setShowGiftsModal(true)}>
            <span className="pvp-action-plus">⊕</span> Гифты
          </button>
          <button className="pvp-action-btn" onClick={() => {}}>
            <span className="pvp-action-plus">⊕</span> TON
          </button>
          <button className="pvp-action-btn" onClick={() => { setShowStarsModal(true); setError(null); }}>
            <span className="pvp-action-plus">⊕</span> Звезды
          </button>
        </div>

        {/* Список игроков */}
        <div className="pvp-players-footer">
          <div className="pvp-players-meta">
            <span>Игроков ({players.length})</span>
            <span className="pvp-green-dot-row"><span className="pvp-green-dot"></span> {game?.watching ?? 0}</span>
            <span className="pvp-game-num">Игра #{game?.id || '...'}</span>
          </div>
          <div className="pvp-players-rows">
            {players.map((p, idx) => (
              <div key={p.userId} className="pvp-player-entry">
                <div className="pvp-entry-avatar" style={{ background: COLORS[idx % COLORS.length] }}>
                  {(p.username || 'P')[0].toUpperCase()}
                </div>
                <div className="pvp-entry-name">{p.username || `Игрок #${String(p.userId).slice(-6)}`}</div>
                <div className="pvp-entry-total" style={{ color: COLORS[idx % COLORS.length] }}>
                  Всего {p.betAmount} <StarIcon size={12} />
                </div>
              </div>
            ))}
            {players.length === 0 && (
              <div className="pvp-no-players">Нет игроков. Сделай ставку первым!</div>
            )}
          </div>
        </div>
      </div>

      {/* Модал ставки звездами */}
      {showStarsModal && (
        <div className="modal-backdrop" onClick={() => setShowStarsModal(false)}>
          <div className="pvp-stars-modal" onClick={e => e.stopPropagation()}>
            <div className="pvp-modal-title">⭐ Ставка звездами</div>
            <div className="pvp-modal-balance">
              Баланс: {user.balance} <StarIcon size={16} />
            </div>

            {error === 'insufficient' ? (
              <div className="pvp-insufficient">
                <div className="pvp-insufficient-text">Не хватает звезд</div>
                <button
                  className="btn btn-primary btn-large"
                  onClick={() => { setShowStarsModal(false); telegramApi?.openTelegramLink?.('https://t.me/ton_stars_bot'); }}
                >
                  💳 Пополнить баланс
                </button>
              </div>
            ) : (
              <>
                <input
                  type="number"
                  className="pvp-stars-input"
                  value={betAmount}
                  onChange={e => { setBetAmount(e.target.value); setError(null); }}
                  placeholder="Введите количество звезд"
                  min="1"
                  max={user.balance}
                  autoFocus
                />
                <div className="pvp-quick-bets">
                  {[10, 50, 100, 500].map(v => (
                    <button key={v} className="pvp-quick-btn" onClick={() => setBetAmount(String(v))}>
                      {v}
                    </button>
                  ))}
                  <button className="pvp-quick-btn pvp-quick-max" onClick={() => setBetAmount(String(user.balance))}>
                    MAX
                  </button>
                </div>
                {error && <div className="feedback feedback-error">{error}</div>}
                <div className="pvp-modal-actions">
                  <button className="btn btn-secondary" onClick={() => setShowStarsModal(false)}>Отмена</button>
                  <button
                    className="btn btn-primary"
                    onClick={() => placeBet(parseInt(betAmount) || 0)}
                    disabled={loading || !betAmount || parseInt(betAmount) <= 0}
                  >
                    {loading ? 'Ставим...' : 'Поставить'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Модал гифтов */}
      {showGiftsModal && (
        <div className="modal-backdrop" onClick={() => setShowGiftsModal(false)}>
          <div className="pvp-stars-modal" onClick={e => e.stopPropagation()}>
            <div className="pvp-modal-title">🎁 Ставка гифтами</div>
            <div className="pvp-gifts-coming">Скоро будет доступно!</div>
            <button className="btn btn-secondary" onClick={() => setShowGiftsModal(false)}>Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
}

function PvPWheel({ players, totalPot }) {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const R = 130;
  const innerR = 72;

  if (players.length === 0 || totalPot === 0) {
    return (
      <div className="pvp-wheel-svg-wrap">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={R} fill="#2a2a3a" stroke="#333" strokeWidth="2" />
          <circle cx={cx} cy={cy} r={innerR} fill="#111118" />
        </svg>
        <div className="pvp-wheel-arrow">▼</div>
        <div className="pvp-wheel-mascot">🐸</div>
      </div>
    );
  }

  let startAngle = -90;
  const segments = players.map((p, idx) => {
    const pct = p.betAmount / totalPot;
    const angle = pct * 360;
    const seg = { ...p, startAngle, angle, color: COLORS[idx % COLORS.length] };
    startAngle += angle;
    return seg;
  });

  function polarToXY(angleDeg, r) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function segmentPath(startDeg, angleDeg) {
    const endDeg = startDeg + angleDeg;
    const p1 = polarToXY(startDeg, R);
    const p2 = polarToXY(endDeg, R);
    const large = angleDeg > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${R} ${R} 0 ${large} 1 ${p2.x} ${p2.y} Z`;
  }

  return (
    <div className="pvp-wheel-svg-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((seg, idx) => (
          <path
            key={idx}
            d={segmentPath(seg.startAngle, seg.angle)}
            fill={seg.color}
            stroke="#111118"
            strokeWidth="2"
          />
        ))}
        <circle cx={cx} cy={cy} r={innerR} fill="#111118" />

        {/* Аватары на секторах */}
        {segments.map((seg, idx) => {
          const midAngle = seg.startAngle + seg.angle / 2;
          const { x, y } = polarToXY(midAngle, R * 0.68);
          return (
            <g key={`badge-${idx}`}>
              <circle cx={x} cy={y} r={16} fill={seg.color} stroke="#111118" strokeWidth="2" />
              <text x={x} y={y + 5} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff">
                {(seg.username || 'P')[0].toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Стрелка сверху */}
      <div className="pvp-wheel-arrow">▼</div>
      {/* Маскот */}
      <div className="pvp-wheel-mascot">🐸</div>
    </div>
  );
}
