import { useState } from 'react';
import { TopUpModal } from './TopUpModal.jsx';

function ButterflyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 12C9 9 4 5 4 9c0 3 3 4 8 3z" fill="#c084fc" stroke="#c084fc" strokeWidth="0.5"/>
      <path d="M12 12C15 9 20 5 20 9c0 3-3 4-8 3z" fill="#a855f7" stroke="#a855f7" strokeWidth="0.5"/>
      <path d="M12 12C9 15 4 19 4 15c0-3 3-4 8-3z" fill="#a855f7" stroke="#a855f7" strokeWidth="0.5"/>
      <path d="M12 12C15 15 20 19 20 15c0-3-3-4-8-3z" fill="#c084fc" stroke="#c084fc" strokeWidth="0.5"/>
      <ellipse cx="12" cy="12" rx="1.2" ry="2" fill="#1a0a2e"/>
    </svg>
  );
}

function TONIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <polygon points="12,2 22,7 22,17 12,22 2,17 2,7" fill="#0098EA"/>
      <path d="M8 10l4-5 4 5H8z" fill="white"/>
      <line x1="12" y1="5" x2="12" y2="18" stroke="white" strokeWidth="2.5"/>
    </svg>
  );
}

export function AppHeader({ user, showToggles, settings, onSettings, telegramApi, showTopUp = true }) {
  const [topUpOpen, setTopUpOpen] = useState(false);

  return (
    <header className="chance-header">
      <div className="chance-header-logo">
        <ButterflyIcon />
        <span className="chance-logo-text">Chance</span>
      </div>

      <div className="chance-header-balances">
        <div className="chance-balance-chip butterfly-chip">
          <ButterflyIcon />
          <span>{(user?.gems ?? 0).toLocaleString('ru-RU')}</span>
        </div>
        <button
          className="chance-balance-chip ton-chip"
          onClick={showTopUp ? () => setTopUpOpen(true) : undefined}
        >
          <TONIcon />
          <span>{(user?.balance ?? 0).toLocaleString('ru-RU')}</span>
          {showTopUp && <span className="chance-plus-btn">+</span>}
        </button>
      </div>

      {topUpOpen && <TopUpModal onClose={() => setTopUpOpen(false)} telegramApi={telegramApi} />}
    </header>
  );
}
