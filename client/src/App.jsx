import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { api, setToken } from './api/http.js';
import { useTelegram, devUserFromUrl } from './hooks/useTelegram.js';
import { t } from './i18n/ru.js';
import { Rocket } from './pages/Rocket.jsx';
import { Cases } from './pages/Cases.jsx';
import { Profile } from './pages/Profile.jsx';
import { PvP } from './pages/PvP.jsx';
import { Upgrade } from './pages/Upgrade.jsx';
import { Slots } from './pages/Slots.jsx';
import { Admin } from './pages/Admin.jsx';
import { BottomNav } from './components/BottomNav.jsx';
import { SplashScreen } from './components/SplashScreen.jsx';

export function App() {
  const { tg, ready, initData } = useTelegram();
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [authDone, setAuthDone] = useState(false);
  const [minTimeDone, setMinTimeDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeDone(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      try {
        const payload = {};
        if (initData) payload.initData = initData;
        else {
          const dev = devUserFromUrl();
          if (!dev) throw new Error(t.app.openInTelegram);
          payload.dev = dev;
        }
        const { token, user } = await api.auth(payload);
        if (cancelled) return;
        setToken(token);
        setUser(user);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setAuthDone(true);
      }
    })();
    return () => { cancelled = true; };
  }, [ready, initData]);

  function refreshUser() {
    api.me().then((r) => setUser(r.user)).catch(() => {});
  }

  const loading = !authDone || !minTimeDone;

  if (loading) return <SplashScreen message={t.app.loading} />;
  if (error) return <div className="loading error">{error}</div>;

  const pageProps = { user, onBalanceChange: refreshUser, telegramApi: tg };

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Rocket {...pageProps} />} />
        <Route path="/cases" element={<Cases {...pageProps} />} />
        <Route path="/profile" element={<Profile {...pageProps} />} />
        <Route path="/admin" element={<Admin {...pageProps} />} />
        <Route path="/pvp" element={<PvP />} />
        <Route path="/upgrade" element={<Upgrade />} />
        <Route path="/slots" element={<Slots />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  );
}
