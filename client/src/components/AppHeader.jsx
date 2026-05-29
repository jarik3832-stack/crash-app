import { useEffect, useState } from 'react';
import { api } from '../api/http.js';
import { t } from '../i18n/ru.js';
import {
  CloseIcon, StarIcon, GemIcon, ChevronDownIcon, MoreIcon, TrophyIcon,
} from './icons.jsx';
import { LeaderboardModal } from './LeaderboardModal.jsx';
import { TopUpModal } from './TopUpModal.jsx';

export function AppHeader({ user, title, showToggles, settings, onSettings, telegramApi, showTopUp = true }) {
  const [lbOpen, setLbOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [rank, setRank] = useState(null);

  useEffect(() => {
    let cancel = false;
    api.leaderboard('all')
      .then((r) => { if (!cancel) setRank(r.me?.rank ?? null); })
      .catch(() => {});
    return () => { cancel = true; };
  }, [user?.balance, user?.gems]);

  function closeApp() {
    if (telegramApi?.close) telegramApi.close();
    else window.history.back();
  }

  return (
    <header className="app-header">
      <div className="app-header-row">
        <button className="header-close" onClick={closeApp}>
          <CloseIcon size={12} /> {t.app.close}
        </button>
        <div className="header-center">
          <span className="balance-chip" title={t.profile.gems}>
            <GemIcon size={16} />
            {(user?.gems ?? 0).toLocaleString('ru-RU')}
          </span>
        </div>
        {showTopUp && (
          <button className="balance-topup-chip" onClick={() => setTopUpOpen(true)}>
            <StarIcon size={15} />
            <span className="balance-topup-value">{(user?.balance ?? 0).toLocaleString('ru-RU')}</span>
            <span className="balance-topup-plus">+</span>
          </button>
        )}
        <button className="header-chevron" aria-label="dropdown">
          <ChevronDownIcon size={14} />
        </button>
        <button className="header-more" aria-label="more">
          <MoreIcon size={16} />
        </button>
      </div>

      <div className="header-extras">
        <button className="top-wins-btn" onClick={() => setLbOpen(true)}>
          <TrophyIcon size={14} />
          <span className={`rank-badge ${rank ? '' : 'empty'}`}>
            {rank ? rank : '—'}
          </span>
          <span className="top-wins-label-sub">{t.header.topWins}</span>
        </button>

        {showToggles && (
          <>
            <button
              className={`toggle-pill ${settings.insurance ? 'on' : ''}`}
              onClick={() => onSettings({ insurance: !settings.insurance })}
            >
              {t.header.insurance}
              <span className="switch" />
            </button>
            <button
              className={`toggle-pill ${settings.demo ? 'on' : ''}`}
              onClick={() => onSettings({ demo: !settings.demo })}
            >
              {t.header.demo}
              <span className="switch" />
            </button>
          </>
        )}
      </div>

      {lbOpen && <LeaderboardModal onClose={() => setLbOpen(false)} user={user} />}
      {topUpOpen && <TopUpModal onClose={() => setTopUpOpen(false)} telegramApi={telegramApi} />}
    </header>
  );
}
