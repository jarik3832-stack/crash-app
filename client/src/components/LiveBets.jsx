import { t } from '../i18n/ru.js';
import { GemIcon } from './icons.jsx';

export function LiveBets({ bets, currentUserId }) {
  const sorted = [...bets].sort((a, b) => b.amount - a.amount);

  return (
    <div className="live-bets">
      <div className="live-bets-list">
        {sorted.length === 0 && (
          <div className="live-bets-empty">{t.live.empty}</div>
        )}
        {sorted.map((b) => {
          const isMe = b.user_id === currentUserId;
          const initial = (b.username || '?').slice(0, 1).toUpperCase();
          let resultClass = '';
          let resultText = '—';
          if (b.cashout_multiplier != null) {
            if (b.cashout_multiplier <= 1.0) {
              resultClass = 'refund';
              resultText = t.bet.refunded;
            } else {
              resultClass = 'won';
              resultText = `× ${b.cashout_multiplier.toFixed(2)}`;
            }
          }
          return (
            <div key={b.user_id} className={`live-bet ${isMe ? 'is-me' : ''}`}>
              <div className="live-bet-user">
                {b.photo_url
                  ? <img src={b.photo_url} alt="" className="avatar avatar-md" />
                  : <div className="avatar avatar-md avatar-placeholder">{initial}</div>}
                <div className="live-bet-meta">
                  <div className="live-bet-name">
                    {b.username}
                    {isMe && <span className="live-bet-tag tag-ins" style={{ background: 'rgba(203,255,88,0.15)', color: 'var(--accent)' }}>{t.live.you}</span>}
                    {b.demo ? <span className="live-bet-tag tag-demo">{t.live.demoTag}</span> : null}
                    {b.insurance ? <span className="live-bet-tag tag-ins">{t.live.insTag}</span> : null}
                  </div>
                  <div className="live-bet-stake">
                    {b.amount.toLocaleString('ru-RU')} <GemIcon size={11} />
                  </div>
                </div>
              </div>
              <div className={`live-bet-result ${resultClass}`}>{resultText}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
