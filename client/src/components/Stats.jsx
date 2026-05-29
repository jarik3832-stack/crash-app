import { t } from '../i18n/ru.js';

export function Stats({ user }) {
  const profit = user.total_won - user.total_wagered;
  return (
    <div className="stats">
      <div className="stat-card">
        <div className="stat-label">{t.profile.rounds}</div>
        <div className="stat-value">{user.rounds_played}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">{t.profile.biggest}</div>
        <div className="stat-value">
          {user.biggest_multiplier ? `×${user.biggest_multiplier.toFixed(2)}` : '–'}
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">{t.profile.wagered}</div>
        <div className="stat-value">{user.total_wagered.toLocaleString('ru-RU')}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">{t.profile.profit}</div>
        <div className={`stat-value ${profit >= 0 ? 'positive' : 'negative'}`}>
          {profit >= 0 ? '+' : ''}{profit.toLocaleString('ru-RU')}
        </div>
      </div>
    </div>
  );
}
