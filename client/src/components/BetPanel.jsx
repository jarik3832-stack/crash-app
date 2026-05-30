import { useEffect, useMemo, useRef, useState } from 'react';
import { getSocket } from '../api/socket.js';
import { t } from '../i18n/ru.js';
import { PlusIcon, MinusIcon, StarIcon } from './icons.jsx';

const MIN_BET = 10;
const MAX_BET = 100000;

function stepFor(value) {
  if (value < 100) return 10;
  if (value < 1000) return 50;
  return 100;
}

export function BetPanel({ user, game, settings, onBalanceChange }) {
  const [amount, setAmount] = useState(100);
  const [autoCashout, setAutoCashout] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [schedule, setSchedule] = useState(() => loadSchedule());
  const [schedOpen, setSchedOpen] = useState(false);
  const [schedRounds, setSchedRounds] = useState(3);

  const myBet = useMemo(
    () => game.bets.find((b) => b.user_id === user.telegram_id) ?? null,
    [game.bets, user.telegram_id]
  );

  useEffect(() => { setFeedback(null); }, [game.roundId]);

  const lastFiredRoundRef = useRef(null);
  useEffect(() => {
    if (game.phase !== 'betting') return;
    if (!schedule || schedule.repeats <= 0) return;
    if (game.roundId == null || lastFiredRoundRef.current === game.roundId) return;
    if (myBet) return;
    lastFiredRoundRef.current = game.roundId;
    placeBet({ silent: true, fromSchedule: true });
  }, [game.phase, game.roundId, schedule, myBet]);

  function adjustAmount(delta) {
    const next = Math.max(MIN_BET, Math.min(MAX_BET, amount + delta));
    setAmount(next);
  }
  function adjustAuto(delta) {
    const cur = autoCashout === '' ? 1.5 : Number(autoCashout) || 1.5;
    const next = Math.max(1.01, Math.min(1000, Math.round((cur + delta) * 100) / 100));
    setAutoCashout(String(next));
  }

  function placeBet({ silent = false, fromSchedule = false } = {}) {
    const n = Math.floor(Number(amount));
    if (!Number.isFinite(n) || n < MIN_BET || n > MAX_BET) {
      if (!silent) setFeedback({ kind: 'error', text: t.bet.amountRange(MIN_BET, MAX_BET) });
      return;
    }
    const bucket = settings?.demo ? 'demo_balance' : 'balance';
    const have = user[bucket] ?? 0;
    const insMul = settings?.insurance ? 1.05 : 1;
    if (n * insMul > have) {
      if (!silent) setFeedback({ kind: 'error', text: t.bet.insufficient });
      return;
    }
    const auto = autoCashout ? Number(autoCashout) : null;
    if (auto != null && (!Number.isFinite(auto) || auto < 1.01)) {
      if (!silent) setFeedback({ kind: 'error', text: t.bet.autoRange });
      return;
    }
    getSocket().emit(
      'place_bet',
      { amount: n, autoCashout: auto, demo: !!settings?.demo, insurance: !!settings?.insurance },
      (res) => {
        if (res?.ok) {
          if (!silent) setFeedback({ kind: 'ok', text: t.bet.placed(n) });
          onBalanceChange?.();
          if (fromSchedule) {
            setSchedule((prev) => {
              if (!prev) return prev;
              const repeats = prev.repeats === Infinity ? Infinity : prev.repeats - 1;
              const next = repeats <= 0 ? null : { ...prev, repeats };
              persistSchedule(next);
              return next;
            });
          }
        } else if (!silent) {
          setFeedback({ kind: 'error', text: res?.error ?? t.bet.failed });
        }
      }
    );
  }

  function cashout() {
    getSocket().emit('cashout', {}, (res) => {
      if (res?.ok) {
        setFeedback({ kind: 'ok', text: t.bet.cashedOut(res.multiplier, res.payout) });
        onBalanceChange?.();
      } else {
        setFeedback({ kind: 'error', text: res?.error ?? t.bet.failed });
      }
    });
  }

  function startSchedule(repeats) {
    const next = {
      amount: Math.floor(Number(amount)),
      autoCashout: autoCashout ? Number(autoCashout) : null,
      demo: !!settings?.demo,
      insurance: !!settings?.insurance,
      repeats,
    };
    setSchedule(next);
    persistSchedule(next);
    setSchedOpen(false);
  }
  function cancelSchedule() {
    setSchedule(null);
    persistSchedule(null);
  }

  let buttonLabel = t.bet.placeBtn;
  let buttonAction = () => placeBet();
  let buttonDisabled = false;
  let buttonClass = 'btn btn-primary';

  if (game.phase === 'betting') {
    if (myBet) {
      buttonLabel = t.bet.placedBtn(myBet.amount);
      buttonDisabled = true;
      buttonClass = 'btn btn-secondary';
    }
  } else if (game.phase === 'flying') {
    if (myBet && myBet.cashout_multiplier == null) {
      buttonLabel = t.bet.cashoutBtn(currentMultiplier(game));
      buttonAction = cashout;
      buttonClass = 'btn btn-danger';
    } else if (myBet) {
      buttonLabel = t.bet.cashedBtn(myBet.cashout_multiplier);
      buttonDisabled = true;
      buttonClass = 'btn btn-secondary';
    } else {
      buttonLabel = t.bet.roundInProgress;
      buttonDisabled = true;
      buttonClass = 'btn btn-secondary';
    }
  } else {
    buttonLabel = t.bet.roundOver;
    buttonDisabled = true;
    buttonClass = 'btn btn-secondary';
  }

  return (
    <div className="bet-panel">
      {!schedOpen && (
        <button
          className={`bet-schedule-row ${schedule ? 'active' : ''}`}
          onClick={() => (schedule ? cancelSchedule() : setSchedOpen(true))}
        >
          {schedule
            ? t.bet.scheduleCancel(schedule.repeats === Infinity ? '∞' : schedule.repeats)
            : t.bet.scheduleOpen}
        </button>
      )}
      {schedOpen && (
        <div className="bet-schedule-panel">
          <div className="label">{t.bet.scheduleRounds}</div>
          <div className="bet-schedule-options">
            {[1, 3, 10].map((n) => (
              <button
                key={n}
                className={schedRounds === n ? 'selected' : ''}
                onClick={() => setSchedRounds(n)}
              >
                {n}
              </button>
            ))}
            <button
              className={schedRounds === Infinity ? 'selected' : ''}
              onClick={() => setSchedRounds(Infinity)}
            >
              ∞
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => startSchedule(schedRounds)}>
            {t.bet.scheduleStart}
          </button>
        </div>
      )}

      <div className="bet-row">
        <div className="stepper">
          <span className="lead-icon"><StarIcon size={14} /></span>
          <button className="stepper-btn" onClick={() => adjustAmount(-stepFor(amount))} disabled={!!myBet}>
            <MinusIcon size={12} />
          </button>
          <input
            type="number"
            min={MIN_BET}
            max={MAX_BET}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)}
            disabled={!!myBet || game.phase !== 'betting'}
            className="stepper-input"
          />
          <button className="stepper-btn" onClick={() => adjustAmount(stepFor(amount))} disabled={!!myBet}>
            <PlusIcon size={12} />
          </button>
        </div>
        <div className="auto-cashout-wrap">
          <span className="auto-cashout-label">Авто</span>
          <input
            type="text"
            inputMode="decimal"
            value={autoCashout}
            placeholder="выкл"
            onChange={(e) => setAutoCashout(e.target.value.replace(',', '.'))}
            disabled={!!myBet || game.phase !== 'betting'}
            className="auto-cashout-input"
          />
          <span className="auto-cashout-x">×</span>
        </div>
      </div>

      <button className={buttonClass} disabled={buttonDisabled} onClick={buttonAction}>
        {buttonLabel}
      </button>
      {feedback && (
        <div className={`feedback feedback-${feedback.kind}`}>{feedback.text}</div>
      )}
    </div>
  );
}

function currentMultiplier(game) {
  if (game.phase !== 'flying') return 1.0;
  const t = Math.max(0, (Date.now() - game.flyingStartedAt) / 1000);
  return Math.exp(0.06 * t);
}

const KEY = 'crash_schedule_v1';
function loadSchedule() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.repeats === 'inf') parsed.repeats = Infinity;
    return parsed;
  } catch {
    return null;
  }
}
function persistSchedule(s) {
  if (!s) {
    localStorage.removeItem(KEY);
    return;
  }
  const out = { ...s, repeats: s.repeats === Infinity ? 'inf' : s.repeats };
  localStorage.setItem(KEY, JSON.stringify(out));
}
