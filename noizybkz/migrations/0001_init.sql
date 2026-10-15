-- NOIZYBKZ schema v1 (Cloudflare D1 / SQLite)
-- Money is stored as INTEGER minor units (cents). Debits are positive, credits negative.
-- Posted transactions are never edited or deleted: corrections are reversals.

CREATE TABLE IF NOT EXISTS books (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,          -- e.g. CA-ON, CA-QC, GB, AU, NZ, GENERIC
  currency     TEXT NOT NULL,          -- ISO 4217
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS accounts (
  book_id TEXT NOT NULL REFERENCES books(id),
  code    TEXT NOT NULL,
  name    TEXT NOT NULL,
  type    TEXT NOT NULL CHECK (type IN ('ASSET','LIABILITY','EQUITY','INCOME','EXPENSE')),
  PRIMARY KEY (book_id, code)
);

CREATE TABLE IF NOT EXISTS txns (
  id          TEXT PRIMARY KEY,
  book_id     TEXT NOT NULL REFERENCES books(id),
  date        TEXT NOT NULL,           -- YYYY-MM-DD
  description TEXT NOT NULL,
  kind        TEXT NOT NULL,           -- journal | invoice | bill | payment | remittance | reversal
  ref         TEXT,                    -- document id, or reversed txn id
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS txns_book_date ON txns(book_id, date);

CREATE TABLE IF NOT EXISTS postings (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  txn_id       TEXT NOT NULL REFERENCES txns(id),
  book_id      TEXT NOT NULL,
  account_code TEXT NOT NULL,
  amount       INTEGER NOT NULL,       -- + debit, - credit
  tag          TEXT,                   -- e.g. tax:HST:collected, tax:GST:itc
  memo         TEXT
);
CREATE INDEX IF NOT EXISTS postings_txn ON postings(txn_id);
CREATE INDEX IF NOT EXISTS postings_book_account ON postings(book_id, account_code);

CREATE TABLE IF NOT EXISTS docs (
  id      TEXT PRIMARY KEY,
  book_id TEXT NOT NULL REFERENCES books(id),
  kind    TEXT NOT NULL CHECK (kind IN ('invoice','bill')),
  number  TEXT NOT NULL,
  party   TEXT NOT NULL,
  date    TEXT NOT NULL,
  due     TEXT,
  total   INTEGER NOT NULL,
  paid    INTEGER NOT NULL DEFAULT 0,
  txn_id  TEXT NOT NULL REFERENCES txns(id),
  UNIQUE (book_id, kind, number)
);
