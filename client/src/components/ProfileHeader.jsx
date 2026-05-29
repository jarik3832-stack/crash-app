import { t } from '../i18n/ru.js';

export function ProfileHeader({ user }) {
  const initial = (user.first_name || user.username || '?').slice(0, 1).toUpperCase();
  return (
    <div className="profile-header">
      {user.photo_url
        ? <img src={user.photo_url} alt="" className="avatar avatar-lg" />
        : <div className="avatar avatar-lg avatar-placeholder">{initial}</div>}
      <div className="profile-name">
        <div className="profile-name-main">{user.first_name ?? `Игрок ${user.telegram_id}`}</div>
        {user.username && <div className="profile-name-sub">@{user.username}</div>}
      </div>
    </div>
  );
}
