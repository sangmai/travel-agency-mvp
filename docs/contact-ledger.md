# Contact ledger

Counts visitors who leave the site towards the operator — call, WhatsApp,
email, Facebook — plus quote requests that actually went out.

## What it is for, and what it is not

The site exposes four paths leading straight to the operator. A visitor who
takes one of them used to leave without a trace, even though that is often the
most decided visitor: nobody fills in a form on a six-inch screen when a "Call"
button sits under their thumb.

This ledger establishes a **verifiable floor**: "this month the site sent 47
calls and 23 WhatsApp messages." Where there was no number, there is one.

**What it will never do:** tell you which of them ended in a booking, or at what
value. That data lives in the operator's system. No measurement placed on this
site will produce it. A dashboard that suggested otherwise would be worse than
none.

## Privacy

Nothing personal is stored: no IP address, no identifier, no cookie, no browser
fingerprint. A row holds the timestamp, the channel, the page path, the
two-letter country and `mobile` or `desktop`.

The target market is French, so the GDPR applies. A strictly aggregate count is
not personal data: **no consent banner is needed**. That is deliberate — a
banner would depress precisely what we are trying to measure.

The country comes from the `CF-IPCountry` header, set by Cloudflare without the
code reading the address. It separates a French visitor from a bot hosted
elsewhere, and is far too coarse to single anyone out.

## What is in place

| Piece | State |
|---|---|
| D1 database `travel-clics` | created, schema applied |
| Table `contact_click` | `recorded_at`, `channel`, `page`, `country`, `device` |
| Binding `CLICS` | deployed |
| Endpoint `POST /api/clic` | deployed, tested in a real browser |
| Click script | served on every page |
| Rate limit `CLIC_LIMIT` | 30 per minute per IP |
| Daily job | `0 16 * * *` UTC, i.e. 23:00 in Vietnam |
| Telegram delivery | configured (`@jasmin_sang_bot`) |

## Channel names must match in two places

The browser script in `app/layout.tsx` sends a channel name; `worker/clicks.ts`
holds the allow-list it is checked against. **A mismatch is dropped silently** —
the endpoint still answers 204 and simply writes no row.

```
phone · whatsapp · email · facebook · quote
```

`quote` is written server-side only, when the email actually goes out. The
endpoint refuses it from the browser, otherwise anyone could inflate the quote
count without sending one.

## The daily digest

Arrives at 23:00 Vietnam time. Days and months are cut at UTC+7 — Vietnam has no
daylight saving, so the offset is a constant rather than a calendar computation.

```
Jasmin Travel — site contacts

6 contacts today.

          today    Nov
Calls         3      4
WhatsApp      2      2
Emails        0      1
Facebook      0      1
Quotes        1      2
Total         6     10

Pages driving contact this month:
· /visa-vietnam/ — 4
· / — 4
```

The **month total** is the useful figure: it is what you put on the table when a
count is disputed. The daily number is only a sign of life — and a day with no
contact is stated in words, so silence can never be confused with a job that
stopped running.

## Reading it without Telegram

```bash
# This month's total, by channel
npx wrangler d1 execute travel-clics --remote \
  --command "SELECT channel, COUNT(*) n FROM contact_click WHERE recorded_at >= '2026-11-01T00:00:00Z' GROUP BY channel ORDER BY n DESC"

# One day in detail
npx wrangler d1 execute travel-clics --remote \
  --command "SELECT recorded_at, channel, page, country, device FROM contact_click WHERE recorded_at LIKE '2026-11-02%' ORDER BY id"

# Full export, for a conversation about numbers
npx wrangler d1 execute travel-clics --remote --json \
  --command "SELECT * FROM contact_click ORDER BY id" > contacts.json
```

## Limits worth knowing

**The script needs JavaScript.** A visitor who disables it still places the call
— the link works — but is not counted. That is a minority, and the error leans
the right way: the ledger under-counts, it never inflates.

**A click is not a call.** Someone can click and hang up. The figure measures an
intent to make contact, not a conversation. Presenting it otherwise would be
dishonest, and would be turned against you in a dispute.

**Bots.** `sendBeacon` rules out most crawlers, which do not run JavaScript. The
`country` column catches the rest: a spike from a country unrelated to the French
market deserves a look before being counted.

**No automatic purge.** Rows stay indefinitely, and that is deliberate: a
commission disagreement often concerns a quarter already closed. It is also why
this ledger lives in D1 rather than Analytics Engine, which keeps only 90 days.

## If the bot token is ever rotated

```bash
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
```

Nothing to redeploy: secrets are read at runtime. While they are missing, the
counting carries on and the daily job writes a warning to the logs.
