# Crash — Telegram Mini App

Multiplayer Crash game as a Telegram Mini App. One shared rocket, one shared round, live feed of all players' bets. **Virtual coins only** — see chat history / planning doc for why real money / Telegram Stars are out of scope.

## Stack

- **Server**: Node.js 22+ (ESM), Express, Socket.IO, built-in `node:sqlite`, JWT
- **Client**: React 18 + Vite + Socket.IO client + Telegram WebApp SDK
- Game state machine runs server-side; cashouts are server-authoritative.

## Run locally

Two processes — backend on `:3001`, frontend on `:5173`. Vite proxies `/api` and `/socket.io` to the backend.

```bash
# 1. Server
cd server
cp .env.example .env             # then fill in TELEGRAM_BOT_TOKEN + JWT_SECRET
npm install
npm run dev

# 2. Client (separate terminal)
cd client
npm install
npm run dev
```

### Testing without Telegram (dev mode)

If `TELEGRAM_BOT_TOKEN` is empty in `.env`, the server runs in dev mode and accepts a fake user via query params. Open in a regular browser:

```
http://localhost:5173/?dev=1&id=12345&name=Alice
http://localhost:5173/?dev=1&id=67890&name=Bob   # in a second window
```

Both windows will join the same round, see each other's bets in real time, and share the rocket.

### Testing in Telegram

1. Get a bot token from `@BotFather`. Put it in `server/.env`.
2. Expose the Vite dev server publicly (cloudflared / ngrok):
   ```bash
   cloudflared tunnel --url http://localhost:5173
   ```
3. In BotFather: `/newapp` → set the Mini App URL to the tunnel URL.
4. Open your bot in Telegram → tap the Mini App button.

The server validates Telegram's `initData` HMAC against your bot token. Dev-mode query params are ignored when a real token is present.

## Verification checklist

1. `cd server && npm install && npm run dev` — logs `listening on :3001`, then phase transitions (`round … started`, `flying`, `crashed @ X×`) every ~15s.
2. Crash-point math sanity:
   ```bash
   cd server
   node -e "import('./src/game/crashPoint.js').then(m=>{let s=0,n=100000,low=0;for(let i=0;i<n;i++){const p=m.generateCrashPoint(m.generateServerSeed(),i);s+=p;if(p===1)low++;}console.log('mean',s/n,'instant-rate',low/n);})"
   ```
   Expect mean ≈ 1.95–2.05, instant-crash rate ≈ 0.03.
3. `cd client && npm install && npm run dev` — Vite serves on `:5173`, no console errors.
4. Open two browser windows with different `dev=1&id=…`. Place a bet in each → both see each other in the live list. Cash out in one → other sees the multiplier and payout immediately.
5. After a round, the `serverSeed` is revealed in the `round_crashed` socket event — you can re-run `generateCrashPoint(seed, roundId)` and verify it matches.
6. Profile tab: stats increment as you play. Claim daily bonus → balance +1000 and button disabled until 24h elapses. To re-test, run:
   ```sql
   UPDATE users SET last_daily_bonus = NULL WHERE telegram_id = 12345;
   ```
   in `server/data/crash.db`.

## File layout

```
crash-app/
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── data/                       # SQLite file lives here at runtime
│   └── src/
│       ├── index.js                # Express + Socket.IO bootstrap
│       ├── db/{schema.sql, index.js}
│       ├── auth/{telegram.js, jwt.js}
│       ├── game/{config.js, crashPoint.js, engine.js}
│       ├── routes/api.js
│       └── sockets/handlers.js
├── client/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx, App.jsx
│       ├── styles/index.css
│       ├── api/{http.js, socket.js}
│       ├── hooks/{useTelegram.js, useGameState.js}
│       ├── pages/{Game.jsx, Profile.jsx}
│       └── components/{Rocket,BetPanel,LiveBets,HistoryStrip,BottomNav,ProfileHeader,Stats,BetHistory,DailyBonus}.jsx
└── README.md
```

## Tuning game parameters

All knobs live in `server/src/game/config.js`:

| Constant              | Default            | What it controls                              |
|-----------------------|--------------------|-----------------------------------------------|
| `BETTING_MS`          | 7000               | Length of betting phase                       |
| `CRASHED_MS`          | 4000               | Length of post-crash pause                    |
| `MULTIPLIER_RATE`     | 0.06               | Multiplier growth: `m(t) = e^(rate × t)`      |
| `HOUSE_EDGE`          | 0.03               | Expected-value house take                     |
| `INSTANT_CRASH_PROB`  | 0.03               | Fraction of rounds that crash at 1.00×        |
| `STARTING_BALANCE`    | 5000               | Coins a new user starts with                  |
| `DAILY_BONUS`         | 1000               | Coins awarded on daily-bonus claim            |
| `DAILY_BONUS_COOLDOWN_MS` | 24h            | Cooldown between daily claims                 |
| `MIN_BET` / `MAX_BET` | 10 / 100000        | Bet bounds                                    |

If you change `MULTIPLIER_RATE`, also update the matching constant at the top of `client/src/hooks/useGameState.js` (clients animate the rocket locally).

## Replacing the placeholder rocket

`client/src/components/Rocket.jsx` draws the rocket with canvas paths in the `drawRocket` function. To use your own image:

1. Put it in `client/public/rocket.png`.
2. At the top of `Rocket.jsx`, replace `drawRocket` body with `ctx.drawImage(rocketImg, -16, -20, 32, 40)` (preload the image with `new Image()`).

## What's intentionally out of scope

Real-money / Stars payments, production deploy, admin tooling, anti-bot, localization beyond English, sound effects. See `.claude/plans/quiet-purring-owl.md` for the full reasoning.
