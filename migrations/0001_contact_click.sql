-- Contact-intent ledger.
--
-- One row per departure towards the operator: call, WhatsApp, email, Facebook,
-- plus quote requests written server-side when the email actually goes out.
--
-- No personal data. No IP address, no identifier, no cookie: which removes the
-- need for a consent banner in France, and avoids depressing — through that
-- very banner — the thing being measured.
--
-- `recorded_at` is ISO 8601 UTC. The lexicographic order of that form matches
-- chronological order, so ranges can be compared as text without a date
-- function — and indexed simply.

CREATE TABLE IF NOT EXISTS contact_click (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  recorded_at TEXT NOT NULL,
  -- phone | whatsapp | email | facebook | quote
  channel     TEXT NOT NULL,
  -- Path only, never the full URL: no query string, so no risk of carrying an
  -- identifier in here by accident.
  page        TEXT NOT NULL,
  -- CF-IPCountry. Two letters, set by Cloudflare without us reading the
  -- address. Separates a French visitor from a bot hosted elsewhere, and stays
  -- far too coarse to single anyone out.
  country     TEXT,
  device      TEXT NOT NULL
);

-- Every digest read bounds on the timestamp.
CREATE INDEX IF NOT EXISTS idx_contact_click_recorded_at ON contact_click (recorded_at);

-- The monthly total groups by channel over a time bound.
CREATE INDEX IF NOT EXISTS idx_contact_click_channel ON contact_click (channel, recorded_at);
