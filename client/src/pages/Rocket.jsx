import { useEffect, useRef, useState } from 'react';
import { api } from '../api/http.js';
import { useGameState } from '../hooks/useGameState.js';
import { AppHeader } from '../components/AppHeader.jsx';
import { HistoryStrip } from '../components/HistoryStrip.jsx';
import { Rocket as RocketView } from '../components/Rocket.jsx';
import { BetPanel } from '../components/BetPanel.jsx';
import { LiveBets } from '../components/LiveBets.jsx';

export function Rocket({ user, onBalanceChange, telegramApi }) {
  const game = useGameState();
  const [rounds, setRounds] = useState([]);
  const [settings, setSettings] = useState({
    insurance: !!user.insurance_enabled,
    demo: !!user.demo_enabled,
  });

  useEffect(() => {
    api.rounds().then((r) => setRounds(r.rounds)).catch(() => {});
  }, []);

  useEffect(() => {
    if (game.phase === 'crashed' && game.crashPoint != null) {
      api.rounds().then((r) => setRounds(r.rounds)).catch(() => {});
      onBalanceChange?.();
    }
  }, [game.phase, game.crashPoint]);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const persistTimerRef = useRef(0);

  function changeSettings(partial) {
    const next = { ...settingsRef.current, ...partial };
    setSettings(next);
    clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      api.settings({
        insurance_enabled: next.insurance,
        demo_enabled: next.demo,
      }).catch(() => {});
    }, 250);
  }

  return (
    <div className="rocket-page">
      <AppHeader
        user={user}
        title="Ракета"
        showToggles
        settings={settings}
        onSettings={changeSettings}
        telegramApi={telegramApi}
      />
      <HistoryStrip rounds={rounds} />
      <RocketView game={game} />
      <BetPanel
        user={user}
        game={game}
        settings={settings}
        onBalanceChange={onBalanceChange}
      />
      <LiveBets bets={game.bets} currentUserId={user.telegram_id} />
    </div>
  );
}
