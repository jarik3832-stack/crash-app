import { useEffect, useState } from 'react';
import { api } from '../api/http.js';
import { t } from '../i18n/ru.js';

const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const BONUS = 1000;

export function DailyBonus({ user, onClaimed }) {
  const nextAt = (user.last_daily_bonus ?? 0) + COOLDOWN_MS;
  const [now, setNow] = useState(Date.now());
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const canClaim = !user.last_daily_bonus || now >= nextAt;
  const remaining = Math.max(0, nextAt - now);

  async function claim() {
    setClaiming(true);
    setError(null);
    try {
      await api.dailyBonus();
      onClaimed?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="card daily-bonus">
      <div className="db-info">
        <div className="db-title">{t.profile.dailyBonus}</div>
        <div className="db-sub">
          {canClaim ? t.profile.claim(BONUS) : t.profile.nextBonus(formatRemaining(remaining))}
        </div>
      </div>
      <button
        className={`btn ${canClaim ? 'btn-primary' : 'btn-secondary'}`}
        disabled={!canClaim || claiming}
        onClick={claim}
      >
        {claiming ? '…' : canClaim ? `+${BONUS}` : t.profile.claimed}
      </button>
      {error && <div className="feedback feedback-error">{error}</div>}
    </div>
  );
}

function formatRemaining(ms) {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  if (h > 0) return `${h}ч ${m}м`;
  if (m > 0) return `${m}м ${s}с`;
  return `${s}с`;
}
