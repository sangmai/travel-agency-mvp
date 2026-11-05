-- Leads, and how long each one waited for an answer.
--
-- ## Why this table is different from contact_click
--
-- contact_click holds no identifier at all: no address, no cookie, no name.
-- That is what lets it run without a consent banner, and it was a deliberate
-- choice. This table breaks that rule — it stores the name and the e-mail of
-- someone who wrote in — and the break is the whole point: a ledger of clicks
-- can say how many people knocked, never whether anyone opened the door.
--
-- Storing it brings obligations that counting did not: a retention period, the
-- right of access, the right to erasure. `scheduled` in worker/index.ts
-- anonymises rows older than a year — the timestamps survive, the person does
-- not. The statistics stay complete, the identity does not outlive its use.
--
-- ## What answered_at means
--
-- Not "the agency read it". It means a message addressed to this traveller was
-- seen leaving, because the agency copied our follow-up address on it. The
-- difference matters: this column is the only thing in the whole system that
-- records an outcome rather than an intention.

CREATE TABLE IF NOT EXISTS lead (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  recorded_at TEXT NOT NULL,

  -- The match key. An inbound copy is tied back to its lead by this address
  -- and nothing else, so it is stored lower-cased at write time.
  email       TEXT NOT NULL,
  prenom      TEXT NOT NULL,
  nom         TEXT NOT NULL,

  -- Enough to tell one request from another in a reminder, no more.
  circuit     TEXT,
  duree       TEXT,
  voyageurs   TEXT,
  -- Path only, same rule as contact_click: never a query string.
  page        TEXT NOT NULL,

  -- NULL until a reply to this traveller is observed. The two columns are the
  -- measurement: recorded_at to answered_at is the delay the agency actually
  -- took, not the one it believes it took.
  answered_at TEXT,
  answered_by TEXT,

  -- Set when the identity is erased and the row becomes a pure statistic.
  anonymised_at TEXT
);

-- The CC handler looks a lead up by address, and only ever an unanswered one.
CREATE INDEX IF NOT EXISTS idx_lead_email ON lead (email, answered_at);

-- The digest and the retention sweep both read by date.
CREATE INDEX IF NOT EXISTS idx_lead_recorded_at ON lead (recorded_at);
