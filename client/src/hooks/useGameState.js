import { useEffect, useRef, useState } from 'react';
import { connectSocket } from '../api/socket.js';

const MULTIPLIER_RATE = 0.06; // must match server config

export function useGameState() {
  const [state, setState] = useState({
    phase: 'betting',
    roundId: null,
    seedHash: null,
    bettingEndsAt: 0,
    flyingStartedAt: 0,
    crashedAt: 0,
    crashedEndsAt: 0,
    crashPoint: null,
    serverSeed: null,
    bets: [],
    serverOffset: 0,
  });
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const s = connectSocket();

    function applyServerNow(serverNow) {
      if (!serverNow) return 0;
      return serverNow - Date.now();
    }

    function onState(snap) {
      setState((prev) => ({
        ...prev,
        ...snap,
        bets: snap.bets ?? [],
        serverOffset: applyServerNow(snap.serverNow),
      }));
    }
    function onRoundStarted(p) {
      setState({
        phase: 'betting',
        roundId: p.roundId,
        seedHash: p.seedHash,
        bettingEndsAt: p.bettingEndsAt,
        flyingStartedAt: 0,
        crashedAt: 0,
        crashedEndsAt: 0,
        crashPoint: null,
        serverSeed: null,
        bets: [],
        serverOffset: applyServerNow(p.serverNow),
      });
    }
    function onFlyingStarted(p) {
      setState((prev) => ({
        ...prev,
        phase: 'flying',
        flyingStartedAt: p.flyingStartedAt,
        serverOffset: applyServerNow(p.serverNow),
      }));
    }
    function onBetPlaced(p) {
      setState((prev) => {
        const existing = prev.bets.find((b) => b.user_id === p.user_id);
        if (existing) return prev;
        return {
          ...prev,
          bets: [
            ...prev.bets,
            {
              user_id: p.user_id,
              username: p.username,
              photo_url: p.photo_url,
              amount: p.amount,
              demo: p.demo ?? 0,
              insurance: p.insurance ?? 0,
              cashout_multiplier: null,
              payout: 0,
            },
          ],
        };
      });
    }
    function onCashedOut(p) {
      setState((prev) => ({
        ...prev,
        bets: prev.bets.map((b) =>
          b.user_id === p.user_id
            ? { ...b, cashout_multiplier: p.multiplier, payout: p.payout }
            : b
        ),
      }));
    }
    function onRoundCrashed(p) {
      setState((prev) => {
        const refundMap = new Map((p.refunds ?? []).map((r) => [r.user_id, r.amount]));
        const bets = prev.bets.map((b) =>
          refundMap.has(b.user_id) && b.cashout_multiplier == null
            ? { ...b, cashout_multiplier: 1.00, payout: refundMap.get(b.user_id) }
            : b
        );
        return {
          ...prev,
          phase: 'crashed',
          crashedAt: p.serverNow,
          crashedEndsAt: p.serverNow + 4000,
          crashPoint: p.crashPoint,
          serverSeed: p.serverSeed,
          serverOffset: applyServerNow(p.serverNow),
          bets,
        };
      });
    }

    s.on('state', onState);
    s.on('round_started', onRoundStarted);
    s.on('flying_started', onFlyingStarted);
    s.on('bet_placed', onBetPlaced);
    s.on('cashed_out', onCashedOut);
    s.on('round_crashed', onRoundCrashed);

    return () => {
      s.off('state', onState);
      s.off('round_started', onRoundStarted);
      s.off('flying_started', onFlyingStarted);
      s.off('bet_placed', onBetPlaced);
      s.off('cashed_out', onCashedOut);
      s.off('round_crashed', onRoundCrashed);
    };
  }, []);

  return state;
}

export function multiplierAt(stateOrFlyingStartedAt, nowOverride) {
  const flyingStartedAt = typeof stateOrFlyingStartedAt === 'number'
    ? stateOrFlyingStartedAt
    : stateOrFlyingStartedAt.flyingStartedAt;
  const now = nowOverride ?? Date.now();
  const t = Math.max(0, (now - flyingStartedAt) / 1000);
  return Math.exp(MULTIPLIER_RATE * t);
}
