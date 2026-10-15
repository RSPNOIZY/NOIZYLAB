-- NOIZYBKZ schema v2: units and LIFELUV Tokens (LLT).
-- Each account is held in one unit: the book's currency (unit NULL) or 'LLT'.
-- LLT amounts are stored in credits (1 LLT = 1,000 credits), so integers stay exact.
-- Every transaction must balance separately in every unit it touches.

ALTER TABLE accounts ADD COLUMN unit TEXT;                       -- NULL = book currency
ALTER TABLE postings ADD COLUMN party TEXT;                      -- LLT holder id, when relevant
ALTER TABLE books ADD COLUMN llt_policy TEXT NOT NULL DEFAULT 'non-fiscal'
  CHECK (llt_policy IN ('non-fiscal', 'fiscal'));
ALTER TABLE books ADD COLUMN llt_fmv_cents INTEGER;              -- fiat cents per 1 LLT (fiscal policy only)
CREATE INDEX IF NOT EXISTS postings_party ON postings(book_id, account_code, party);

-- Artist-aware books: link a licensing invoice to the HEAVEN consent token it is paid under.
ALTER TABLE docs ADD COLUMN consent_ref TEXT;
