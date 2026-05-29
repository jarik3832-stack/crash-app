import { t } from '../i18n/ru.js';

export function BetHistory({ history }) {
  if (history.length === 0) {
    return (
      <div className="card">
        <div className="card-title">{t.profile.history}</div>
        <div className="bet-history-empty">{t.profile.historyEmpty}</div>
      </div>
    );
  }
  return (
    <div className="card">
      <div className="card-title">{t.profile.history}</div>
      <div className="bet-history-list">
        {history.map((h) => {
          const won = h.cashout_multiplier != null && h.cashout_multiplier > 1.0;
          const refund = h.cashout_multiplier === 1.0;
          const lost = !won && !refund;
          const result = won ? h.payout - h.amount : refund ? 0 : -h.amount;
          const colorClass = won ? 'positive' : lost ? 'negative' : '';
          let subText;
          if (won) subText = t.profile.cashedOut(h.cashout_multiplier);
          else if (refund) subText = t.bet.refunded;
          else subText = t.profile.crashed(h.crash_point);

          return (
            <div key={h.id} className={`bet-history-row ${won ? 'won' : 'lost'}`}>
              <div className="bhr-round">#{h.round_id}</div>
              <div className="bhr-mid">
                <div className="bhr-amount">
                  {h.amount.toLocaleString('ru-RU')}
                  {h.demo ? <span className="live-bet-tag tag-demo">{t.live.demoTag}</span> : null}
                  {h.insurance ? <span className="live-bet-tag tag-ins">{t.live.insTag}</span> : null}
                </div>
                <div className="bhr-mult">{subText}</div>
              </div>
              <div className={`bhr-result ${colorClass}`}>
                {result > 0 ? '+' : ''}{result.toLocaleString('ru-RU')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
