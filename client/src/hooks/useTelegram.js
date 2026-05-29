import { useEffect, useState } from 'react';

export function useTelegram() {
  const [tg] = useState(() => window.Telegram?.WebApp ?? null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!tg) { setReady(true); return; }
    try {
      tg.ready();
      tg.expand();
      tg.setHeaderColor?.('#0d1117');
      tg.setBackgroundColor?.('#0d1117');
    } catch { /* ignore */ }
    setReady(true);
  }, [tg]);

  return { tg, ready, initData: tg?.initData ?? '' };
}

export function devUserFromUrl() {
  const params = new URLSearchParams(location.search);
  if (params.get('dev') !== '1') return null;
  const id = params.get('id');
  if (!id) return null;
  return {
    id: Number(id),
    username: params.get('username') ?? `dev${id}`,
    first_name: params.get('name') ?? `Dev ${id}`,
  };
}
