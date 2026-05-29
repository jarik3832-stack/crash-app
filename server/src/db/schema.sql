CREATE TABLE IF NOT EXISTS users (
  telegram_id              INTEGER PRIMARY KEY,
  username                 TEXT,
  first_name               TEXT,
  photo_url                TEXT,
  balance                  INTEGER NOT NULL DEFAULT 5000,
  gems                     INTEGER NOT NULL DEFAULT 0,
  demo_balance             INTEGER NOT NULL DEFAULT 5000,
  demo_last_replenish_at   INTEGER,
  insurance_enabled        INTEGER NOT NULL DEFAULT 0,
  demo_enabled             INTEGER NOT NULL DEFAULT 0,
  total_wagered            INTEGER NOT NULL DEFAULT 0,
  total_won                INTEGER NOT NULL DEFAULT 0,
  rounds_played            INTEGER NOT NULL DEFAULT 0,
  biggest_multiplier       REAL    NOT NULL DEFAULT 0,
  last_daily_bonus         INTEGER,
  created_at               INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS rounds (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  crash_point REAL    NOT NULL DEFAULT 0,
  server_seed TEXT    NOT NULL,
  seed_hash   TEXT    NOT NULL,
  started_at  INTEGER NOT NULL,
  crashed_at  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bets (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  round_id           INTEGER NOT NULL REFERENCES rounds(id),
  user_id            INTEGER NOT NULL REFERENCES users(telegram_id),
  amount             INTEGER NOT NULL,
  stake_paid         INTEGER NOT NULL DEFAULT 0,
  demo               INTEGER NOT NULL DEFAULT 0,
  insurance          INTEGER NOT NULL DEFAULT 0,
  cashout_multiplier REAL,
  payout             INTEGER NOT NULL DEFAULT 0,
  placed_at          INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bets_user ON bets(user_id, placed_at DESC);
CREATE INDEX IF NOT EXISTS idx_bets_round ON bets(round_id);

CREATE TABLE IF NOT EXISTS cases (
  id           INTEGER PRIMARY KEY,
  slug         TEXT    UNIQUE NOT NULL,
  name_ru      TEXT    NOT NULL,
  price_coins  INTEGER NOT NULL,
  image_emoji  TEXT    NOT NULL,
  enabled      INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS case_items (
  id           INTEGER PRIMARY KEY,
  case_id      INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  reward_kind  TEXT    NOT NULL CHECK (reward_kind IN ('coins','gems')),
  amount       INTEGER NOT NULL,
  weight       INTEGER NOT NULL CHECK (weight > 0),
  label_ru     TEXT    NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_case_items_case ON case_items(case_id, sort_order);

CREATE TABLE IF NOT EXISTS case_openings (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(telegram_id),
  case_id      INTEGER NOT NULL REFERENCES cases(id),
  case_item_id INTEGER NOT NULL REFERENCES case_items(id),
  reward_kind  TEXT    NOT NULL,
  amount       INTEGER NOT NULL,
  created_at   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_case_openings_user ON case_openings(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS admins (
  telegram_id INTEGER PRIMARY KEY REFERENCES users(telegram_id),
  granted_at  INTEGER NOT NULL
);
