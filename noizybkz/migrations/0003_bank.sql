-- NOIZYBKZ schema v3: bank statement import (OFX/QFX/CSV) with de-duplication.
-- Lines are staged here, then posted to the ledger one by one (or by rule).

CREATE TABLE IF NOT EXISTS bank_lines (
  id          TEXT PRIMARY KEY,
  book_id     TEXT NOT NULL REFERENCES books(id),
  bank        TEXT NOT NULL,           -- bank account code, e.g. 1000
  fitid       TEXT NOT NULL,           -- bank's id (OFX FITID) or a content hash for CSV
  date        TEXT NOT NULL,
  amount      INTEGER NOT NULL,        -- + money in, − money out (cents)
  payee       TEXT,
  memo        TEXT,
  txn_id      TEXT REFERENCES txns(id),-- set once posted
  UNIQUE (book_id, bank, fitid)
);
CREATE INDEX IF NOT EXISTS bank_lines_open ON bank_lines(book_id, txn_id);
