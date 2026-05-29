export function HistoryStrip({ rounds }) {
  if (rounds.length === 0) {
    return (
      <div className="history-strip">
        <span className="history-empty">Раундов пока нет</span>
      </div>
    );
  }
  return (
    <div className="history-strip">
      {rounds.map((r, idx) => {
        let bucket = 'mid';
        if (r.crash_point < 1.5) bucket = 'low';
        else if (r.crash_point >= 3) bucket = 'high';
        const cls = `chip-pill ${bucket} ${idx === 0 ? 'first' : ''}`;
        return (
          <span key={r.id} className={cls} title={`Раунд #${r.id}`}>
            ×{r.crash_point.toFixed(2)}
          </span>
        );
      })}
    </div>
  );
}
