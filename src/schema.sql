-- One row per page view or quote-form click. No IP addresses are stored.
CREATE TABLE IF NOT EXISTS hits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,            -- unix ms
  day TEXT NOT NULL,              -- YYYY-MM-DD in Pakistan time
  event TEXT NOT NULL,            -- 'view' or 'quote'
  path TEXT,
  source TEXT,                    -- Google, ChatGPT, Facebook, Direct, Internal ...
  ref_host TEXT,
  utm_source TEXT, utm_medium TEXT, utm_campaign TEXT,
  country TEXT, city TEXT,
  device TEXT,                    -- Mobile, Tablet, Desktop
  visitor TEXT                    -- daily hash of IP + browser, not reversible
);
CREATE INDEX IF NOT EXISTS hits_day ON hits(day);
CREATE INDEX IF NOT EXISTS hits_ts ON hits(ts);
