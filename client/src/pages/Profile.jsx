import { useEffect, useState } from 'react';
import { api } from '../api/http.js';
import { t } from '../i18n/ru.js';
import { AppHeader } from '../components/AppHeader.jsx';
import { ProfileHeader } from '../components/ProfileHeader.jsx';
import { Stats } from '../components/Stats.jsx';
import { DailyBonus } from '../components/DailyBonus.jsx';
import { BetHistory } from '../components/BetHistory.jsx';
import { StarIcon } from '../components/icons.jsx';

export function Profile({ user, onBalanceChange, telegramApi }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.history().then((r) => setHistory(r.history)).catch(() => {});
  }, [user.balance]);

  return (
    <>
      <AppHeader user={user} title={t.tabs.profile} showToggles={false} telegramApi={telegramApi} />
      <div className="page-scroll">
        <div className="profile-page">
          <ProfileHeader user={user} />

          <div className="profile-balances">
            <div className="profile-balance-tile coins">
              <StarIcon size={28} />
              <div>
                <div className="label">{t.profile.coins}</div>
                <div className="value">{user.balance.toLocaleString('ru-RU')}</div>
              </div>
            </div>
          </div>

          <DailyBonus user={user} onClaimed={onBalanceChange} />
          <SettingsCard user={user} onChanged={onBalanceChange} />
          <Stats user={user} />
          <BetHistory history={history} />
        </div>
      </div>
    </>
  );
}

function DemoCard({ user, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [nextAt, setNextAt] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  async function replenish() {
    setBusy(true);
    setErr(null);
    try {
      await api.replenishDemo();
      onChanged?.();
    } catch (e) {
      if (e.status === 429) {
        try {
          const body = JSON.parse(e.message);
          setNextAt(body.next_at);
        } catch { /* ignore */ }
        setErr('cooldown');
      } else {
        setErr(e.message);
      }
    } finally {
      setBusy(false);
    }
  }

  const cooldownLeft = nextAt ? Math.max(0, nextAt - now) : 0;
  const canReplenish = !cooldownLeft;

  return (
    <div className="card demo-card">
      <div className="card-title">{t.profile.demoBalance}</div>
      <div className="demo-row">
        <div className="demo-balance">
          <div className="value">{user.demo_balance.toLocaleString('ru-RU')}</div>
        </div>
        <button
          className={`btn ${canReplenish ? 'btn-primary' : 'btn-secondary'}`}
          disabled={busy || !canReplenish}
          onClick={replenish}
        >
          {cooldownLeft
            ? t.profile.nextReplenish(formatLeft(cooldownLeft))
            : t.profile.replenishDemo}
        </button>
      </div>
      {err && err !== 'cooldown' && <div className="feedback feedback-error">{err}</div>}
    </div>
  );
}

function SettingsCard({ user, onChanged }) {
  const [insurance, setInsurance] = useState(!!user.insurance_enabled);
  const [demo, setDemo] = useState(!!user.demo_enabled);

  async function toggle(field, value) {
    if (field === 'insurance') setInsurance(value);
    else setDemo(value);
    try {
      await api.settings({
        insurance_enabled: field === 'insurance' ? value : insurance,
        demo_enabled: field === 'demo' ? value : demo,
      });
      onChanged?.();
    } catch { /* swallow */ }
  }

  return (
    <div className="card">
      <div className="card-title">{t.profile.settings}</div>
      <div className="settings-row">
        <div className="label">{t.profile.insuranceDefault}</div>
        <button
          className={`toggle-pill ${insurance ? 'on' : ''}`}
          onClick={() => toggle('insurance', !insurance)}
        >
          <span className="switch" />
        </button>
      </div>
      <div className="settings-row">
        <div className="label">{t.profile.demoDefault}</div>
        <button
          className={`toggle-pill ${demo ? 'on' : ''}`}
          onClick={() => toggle('demo', !demo)}
        >
          <span className="switch" />
        </button>
      </div>
    </div>
  );
}

function formatLeft(ms) {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}м ${s}с`;
}
