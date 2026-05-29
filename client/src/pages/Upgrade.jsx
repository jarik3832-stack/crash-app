import { ComingSoon } from '../components/ComingSoon.jsx';
import { t } from '../i18n/ru.js';

export function Upgrade() {
  return <ComingSoon title={t.tabs.upgrade} emoji="📈" />;
}
