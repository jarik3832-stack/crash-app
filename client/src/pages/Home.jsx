import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/http.js';
import { AppHeader } from '../components/AppHeader.jsx';

const MOCK_RECENT_WINS = [
  { name: 'Danes', amount: '57.79', multiplier: null, avatar: null },
  { name: 'Макс', amount: null, multiplier: '10x', currency: 'V', count: 2 },
  { name: 'weltezzy', amount: null, multiplier: '5.5', currency: 'V', count: null },
  { name: 'Tripoch', amount: null, multiplier: '10x', currency: 'V', count: 2 },
];

function StarGold({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path d="M20 3l4 12h13l-10.5 7.5 4 12L20 27l-10.5 7.5 4-12L3 15h13z" fill="#FFD700" stroke="#FFA000" strokeWidth="1"/>
    </svg>
  );
}

function TONSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <polygon points="12,2 22,7 22,17 12,22 2,17 2,7" fill="#0098EA"/>
      <path d="M8 10l4-5 4 5H8z" fill="white"/>
      <line x1="12" y1="5" x2="12" y2="18" stroke="white" strokeWidth="2.5"/>
    </svg>
  );
}

function VIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" fill="#6366f1"/>
      <path d="M6 7l4 7 4-7" stroke="white" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function RecentWinCard({ win }) {
  return (
    <div className="recent-win-card">
      <div className="rwc-inner">
        {win.multiplier ? (
          <div className="rwc-multiplier">
            <span className="rwc-mult-text">{win.multiplier}</span>
            {win.count && <div className="rwc-count"><VIcon /><span>{win.count}</span></div>}
          </div>
        ) : (
          <div className="rwc-amount-wrap">
            <span className="rwc-amount">{win.amount}</span>
            <TONSmall />
          </div>
        )}
      </div>
      <div className="rwc-player">
        <div className="rwc-avatar-wrap">
          {win.avatar ? (
            <img src={win.avatar} alt={win.name} className="rwc-avatar" />
          ) : (
            <div className="rwc-avatar-placeholder">{win.name[0]}</div>
          )}
        </div>
        <span className="rwc-name">{win.name}</span>
      </div>
    </div>
  );
}

export function Home({ user, onBalanceChange, telegramApi }) {
  const navigate = useNavigate();
  const [recentWins, setRecentWins] = useState(MOCK_RECENT_WINS);

  useEffect(() => {
    api.rounds().then((r) => {
      if (r.rounds && r.rounds.length > 0) {
        const wins = r.rounds
          .filter((round) => round.crash_point >= 2)
          .slice(0, 8)
          .map((round) => ({
            name: 'Игрок',
            multiplier: round.crash_point.toFixed(2) + 'x',
            currency: 'V',
            count: null,
            avatar: null,
          }));
        if (wins.length > 0) setRecentWins(wins);
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="home-page">
      <AppHeader user={user} telegramApi={telegramApi} showTopUp />

      {/* Promotional Banner */}
      <div className="home-banner">
        <div className="home-banner-stars-left">
          <StarGold size={40} />
          <StarGold size={26} />
        </div>
        <div className="home-banner-content">
          <div className="home-banner-sub">
            <span className="home-banner-logo-mini">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 12C9 9 4 5 4 9c0 3 3 4 8 3z" fill="#c084fc"/>
                <path d="M12 12C15 9 20 5 20 9c0 3-3 4-8 3z" fill="#a855f7"/>
                <path d="M12 12C9 15 4 19 4 15c0-3 3-4 8-3z" fill="#a855f7"/>
                <path d="M12 12C15 15 20 19 20 15c0-3-3-4-8-3z" fill="#c084fc"/>
              </svg>
            </span>
            ChanceStars
          </div>
          <div className="home-banner-title">
            Звезды <StarGold size={22} />
          </div>
          <div className="home-banner-sub2">
            за{' '}
            <span className="home-banner-sbp">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="4" fill="#1DA462"/>
                <path d="M6 12h12M12 6v12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              сбп
            </span>
          </div>
        </div>
        <div className="home-banner-stars-right">
          <StarGold size={26} />
          <StarGold size={40} />
        </div>
      </div>

      {/* Recent Wins Strip */}
      <div className="recent-wins-strip">
        {recentWins.map((win, i) => (
          <RecentWinCard key={i} win={win} />
        ))}
      </div>

      {/* Game Cards */}
      <div className="home-scroll">
        <div className="home-games-grid">
          {/* Crash/Rocket Game Card */}
          <div className="home-game-card" onClick={() => navigate('/rocket')}>
            <div className="hgc-online">
              <span className="hgc-dot" />
              <span>20 Онлайн</span>
            </div>
            <div className="hgc-art rocket-art">
              <img src="/Animated_AgADyxsAAteJkUs.gif" alt="rocket" className="hgc-rocket-gif" />
            </div>
            <button className="hgc-btn">Играть &gt;</button>
          </div>

          {/* Cases Game Card */}
          <div className="home-game-card home-game-card-featured" onClick={() => navigate('/cases')}>
            <div className="hgc-badge-free">Бесплатный</div>
            <div className="hgc-online">
              <span className="hgc-dot" />
              <span>18 Онлайн</span>
            </div>
            <div className="hgc-art crystal-art">
              <svg width="90" height="90" viewBox="0 0 100 100" fill="none">
                <polygon points="50,5 80,30 80,70 50,95 20,70 20,30" fill="#7c3aed" opacity="0.3" stroke="#a855f7" strokeWidth="1"/>
                <polygon points="50,15 70,32 70,68 50,85 30,68 30,32" fill="#6d28d9" opacity="0.5"/>
                <polygon points="50,20 65,35 65,65 50,80 35,65 35,35" fill="#8b5cf6" opacity="0.8"/>
                <polygon points="50,25 60,37 60,63 50,75 40,63 40,37" fill="#a78bfa"/>
                <path d="M50 25 L60 37 L50 45 L40 37Z" fill="#c4b5fd" opacity="0.9"/>
                <path d="M50 75 L60 63 L50 55 L40 63Z" fill="#7c3aed" opacity="0.7"/>
                <line x1="50" y1="25" x2="50" y2="75" stroke="white" strokeWidth="0.5" opacity="0.3"/>
                <line x1="40" y1="37" x2="60" y2="63" stroke="white" strokeWidth="0.5" opacity="0.3"/>
                <line x1="60" y1="37" x2="40" y2="63" stroke="white" strokeWidth="0.5" opacity="0.3"/>
                <ellipse cx="50" cy="50" rx="8" ry="12" fill="white" opacity="0.15"/>
              </svg>
            </div>
            <button className="hgc-btn">Открыть &gt;</button>
          </div>

          {/* PvP Card */}
          <div className="home-game-card" onClick={() => navigate('/pvp')}>
            <div className="hgc-online">
              <span className="hgc-dot" />
              <span>12 Онлайн</span>
            </div>
            <div className="hgc-art pvp-art">
              <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="35" stroke="#7c3aed" strokeWidth="2" opacity="0.5"/>
                <circle cx="50" cy="50" r="25" fill="#4c1d95" opacity="0.6"/>
                <path d="M35 50h30M50 35v30" stroke="#c084fc" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="35" cy="40" r="8" fill="#6d28d9"/>
                <circle cx="65" cy="60" r="8" fill="#7c3aed"/>
                <text x="32" y="44" fill="white" fontSize="10" fontWeight="bold">P1</text>
                <text x="61" y="64" fill="white" fontSize="10" fontWeight="bold">P2</text>
              </svg>
            </div>
            <button className="hgc-btn">Играть &gt;</button>
          </div>

          {/* Upgrade Card */}
          <div className="home-game-card" onClick={() => navigate('/upgrade')}>
            <div className="hgc-online">
              <span className="hgc-dot" />
              <span>8 Онлайн</span>
            </div>
            <div className="hgc-art upgrade-art">
              <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="30" stroke="#6d28d9" strokeWidth="2" opacity="0.5" strokeDasharray="4 3"/>
                <circle cx="50" cy="50" r="20" fill="#4c1d95" opacity="0.7"/>
                <path d="M50 30v25M38 42l12-12 12 12" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <text x="40" y="72" fill="#c084fc" fontSize="11" fontWeight="bold">UP</text>
              </svg>
            </div>
            <button className="hgc-btn">Играть &gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
}
