import { useEffect, useState } from 'react';
import { api } from '../api/http.js';
import { t } from '../i18n/ru.js';
import { CloseIcon, GemIcon } from './icons.jsx';

export function LeaderboardModal({ onClose, user }) {
  const [period, setPeriod] = useState('all');
  const [data, setData] = useState({ rows: [], me: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.leaderboard(period)
      .then((r) => setData(r))
      .catch(() => setData({ rows: [], me: null }))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="title">{t.leaderboard.title}</div>
          <button className="modal-close" onClick={onClose} aria-label="close">
            <CloseIcon size={14} />
          </button>
        </div>

        <div className="leaderboard-tabs">
          <button
            className={period === 'day' ? 'active' : ''}
            onClick={() => setPeriod('day')}
          >
            {t.leaderboard.today}
          </button>
          <button
            className={period === 'all' ? 'active' : ''}
            onClick={() => setPeriod('all')}
          >
            {t.leaderboard.all}
          </button>
        </div>

        <div className="leaderboard-list">
          {loading && <div className="leaderboard-empty">{t.app.loading}</div>}
          {!loading && data.rows.length === 0 && (
            <div className="leaderboard-empty">{t.leaderboard.empty}</div>
          )}
          {!loading && data.rows.map((row, idx) => {
            const isMe = row.user_id === user?.telegram_id;
            const rankClass = idx === 0 ? 'r1' : idx === 1 ? 'r2' : idx === 2 ? 'r3' : '';
            const name = row.username || row.first_name || `Игрок ${row.user_id}`;
            return (
              <div key={row.bet_id} className={`leaderboard-row ${rankClass} ${isMe ? 'me' : ''}`}>
                <div className="lb-rank">{idx + 1}</div>
                <div className="lb-player">
                  {row.photo_url
                    ? <img src={row.photo_url} alt="" className="avatar avatar-sm" />
                    : <div className="avatar avatar-sm avatar-placeholder">{(name).slice(0, 1).toUpperCase()}</div>}
                  <div>
                    <div className="lb-name">{name}{isMe ? ` · ${t.leaderboard.you.toLowerCase()}` : ''}</div>
                    <div className="lb-sub">
                      {(row.amount ?? 0).toLocaleString('ru-RU')} × {(row.cashout_multiplier ?? 1).toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="lb-payout">
                  <GemIcon size={14} />
                  {(row.payout ?? 0).toLocaleString('ru-RU')}
                </div>
              </div>
            );
          })}
        </div>

        <div className="leaderboard-me-row">
          <div className="lb-rank">
            {data.me?.rank ?? '—'}
          </div>
          <div>
            <div className="lb-name">{t.leaderboard.you}</div>
            <div className="lb-sub">
              {data.me ? '' : t.leaderboard.outOfTop}
            </div>
          </div>
          <div className="lb-payout">
            <GemIcon size={14} />
            {data.me?.payout?.toLocaleString('ru-RU') ?? 0}
          </div>
        </div>
      </div>
    </div>
  );
}
