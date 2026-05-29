import { NavLink } from 'react-router-dom';
import { t } from '../i18n/ru.js';
import { RocketNavIcon, ProfileNavIcon } from './icons.jsx';

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavItem to="/pvp" label={t.tabs.pvp} icon={<span className="nav-emoji">⚔️</span>} />
      <NavItem to="/" exact label={t.tabs.rocket} icon={<RocketNavIcon size={22} />} dot />
      <NavItem to="/cases" label={t.tabs.cases} icon={<span className="nav-emoji">🎁</span>} />
      <NavItem to="/upgrade" label={t.tabs.upgrade} icon={<span className="nav-emoji">📈</span>} />
      <NavItem to="/slots" label={t.tabs.slots} icon={<span className="nav-emoji">🎰</span>} />
      <NavItem to="/profile" label={t.tabs.profile} icon={<ProfileNavIcon size={22} />} />
    </nav>
  );
}

function NavItem({ to, label, icon, exact, dot }) {
  return (
    <NavLink
      to={to}
      end={!!exact}
      className={({ isActive }) =>
        `nav-item ${isActive ? 'active' : ''} ${dot ? 'has-dot' : ''}`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
