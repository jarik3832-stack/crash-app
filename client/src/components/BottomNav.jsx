import { NavLink } from 'react-router-dom';

function PvPIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 12h8M12 8l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

function InventoryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="7" width="20" height="15" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="12" y1="12" x2="12" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="9.5" y1="14.5" x2="14.5" y2="14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function RewardsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

function LeadersIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M8 21H4a1 1 0 01-1-1v-5a1 1 0 011-1h4v7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M14 21H10V9a1 1 0 011-1h2a1 1 0 011 1v12z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M20 21h-4v-9h3a1 1 0 011 1v8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/pvp" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <PvPIcon />
        <span>PvP</span>
      </NavLink>

      <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <HomeIcon />
        <span>Главная</span>
        <span className="nav-home-dot" />
      </NavLink>

      <NavLink to="/cases" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <InventoryIcon />
        <span>Инвентарь</span>
      </NavLink>

      <NavLink to="/profile" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <RewardsIcon />
        <span>Награды</span>
      </NavLink>

      <NavLink to="/leaderboard" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <LeadersIcon />
        <span>Лидеры</span>
      </NavLink>
    </nav>
  );
}
