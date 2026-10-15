-- NOIZYBKZ schema v4: artist royalties, period locking.

-- Close a period: nothing can be posted on or before this date.
ALTER TABLE books ADD COLUMN locked_through TEXT;

-- People and companies who share in royalties.
CREATE TABLE IF NOT EXISTS parties (
  book_id TEXT NOT NULL REFERENCES books(id),
  id      TEXT NOT NULL,              -- short id, e.g. maria.t
  name    TEXT NOT NULL,
  ipn     TEXT,                       -- International Performer Number (SCAPR)
  isni    TEXT,
  ipi     TEXT,                       -- songwriter / publisher number
  PRIMARY KEY (book_id, id)
);

-- Works (recordings, compositions, voice licences) and who shares in them.
CREATE TABLE IF NOT EXISTS works (
  book_id     TEXT NOT NULL REFERENCES books(id),
  id          TEXT NOT NULL,
  title       TEXT NOT NULL,
  isrc        TEXT,
  iswc        TEXT,
  consent_ref TEXT,                   -- HEAVEN consent token for this work
  PRIMARY KEY (book_id, id)
);

-- Split sheet. Shares are parts per million; each work's shares must total 1,000,000.
-- party_id NULL = the house share (NOIZY keeps it; nothing is owed).
CREATE TABLE IF NOT EXISTS splits (
  book_id   TEXT NOT NULL,
  work_id   TEXT NOT NULL,
  party_id  TEXT,
  role      TEXT NOT NULL,            -- artist | writer | producer | performer | house
  share_ppm INTEGER NOT NULL CHECK (share_ppm > 0 AND share_ppm <= 1000000)
);
CREATE INDEX IF NOT EXISTS splits_work ON splits(book_id, work_id);

-- Every royalty receipt and how it was divided, for statements.
CREATE TABLE IF NOT EXISTS royalty_lines (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id   TEXT NOT NULL,
  txn_id    TEXT NOT NULL REFERENCES txns(id),
  work_id   TEXT NOT NULL,
  party_id  TEXT,
  period    TEXT NOT NULL,            -- e.g. 2026-Q3
  source    TEXT NOT NULL,            -- e.g. Re:Sound, SOCAN, DistroKid
  earned    INTEGER NOT NULL,         -- cents allocated to this party
  recouped  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS royalty_lines_party ON royalty_lines(book_id, party_id);

-- Accounts the royalty flows use, added to books created before v4.
INSERT INTO accounts (book_id, code, name, type, unit)
  SELECT id, '1400', 'Recoupable advances to artists', 'ASSET', NULL FROM books
  WHERE NOT EXISTS (SELECT 1 FROM accounts a WHERE a.book_id = books.id AND a.code = '1400');
INSERT INTO accounts (book_id, code, name, type, unit)
  SELECT id, '2650', 'Royalties payable to artists', 'LIABILITY', NULL FROM books
  WHERE NOT EXISTS (SELECT 1 FROM accounts a WHERE a.book_id = books.id AND a.code = '2650');
INSERT INTO accounts (book_id, code, name, type, unit)
  SELECT id, '5100', 'Artist royalties (share owed to others)', 'EXPENSE', NULL FROM books
  WHERE NOT EXISTS (SELECT 1 FROM accounts a WHERE a.book_id = books.id AND a.code = '5100');
