import { t } from '../i18n/ru.js';

export function ComingSoon({ title, emoji }) {
  return (
    <div className="coming-soon">
      <div className="cs-icon">{emoji}</div>
      <div className="cs-title">{title}</div>
      <div className="cs-sub">{t.app.soonSub}</div>
    </div>
  );
}
