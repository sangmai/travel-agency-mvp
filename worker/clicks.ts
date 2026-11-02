/**
 * Contact-intent ledger.
 *
 * The site exposes four paths that lead straight to the operator: `tel:`,
 * WhatsApp, `mailto:` and Facebook. A visitor who takes one of them leaves
 * without a trace here — and that is often the most decided visitor, the one
 * who never fills in a form because an "Call" button sits under their thumb.
 *
 * This module counts those departures. It does not say who left or what became
 * of them: it establishes a verifiable floor — "this month the site sent 47
 * calls and 23 WhatsApp messages" — where previously there was no number at all.
 *
 * What it cannot do, ever: tell which of them end in a booking. That lives in
 * the operator's system. No measurement taken on this site will produce it, and
 * presenting this ledger as if it contained that would be self-deception.
 *
 * ## Why D1 rather than Analytics Engine
 *
 * Analytics Engine is built for this kind of counting and would be lighter on
 * writes. But it keeps 90 days. A commission disagreement regularly concerns a
 * quarter already closed: a ledger that erases itself before the conversation
 * happens is worthless. D1 keeps rows until someone deletes them, and the
 * volume here — a few dozen rows a day — sits far inside the free tier.
 *
 * ## Why nothing personal is stored
 *
 * No IP address, no identifier, no cookie, no browser fingerprint. The target
 * market is French, so the GDPR applies. A strictly aggregate count is not
 * personal data: it needs neither consent nor a banner. And a consent banner
 * would depress precisely the thing we are trying to measure.
 *
 * The country comes from the `CF-IPCountry` header, which Cloudflare sets
 * without us reading the address. It separates a French visitor from a bot
 * hosted elsewhere — useful, and far too coarse to single anyone out.
 */
import site from "../content/site.json";

/* Minimal interfaces, in the same spirit as the rest of the Worker: the project
   does not pull in @cloudflare/workers-types, so we declare exactly what we
   call and nothing more. */
interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  run(): Promise<unknown>;
  all<T>(): Promise<{ results: T[] }>;
}
interface D1 {
  prepare(sql: string): D1Statement;
}

export interface ClicEnv {
  /* Declared in wrangler.jsonc. Absent in local development until the database
     exists — hence the guards scattered here: an unavailable ledger must never
     stop a visitor from placing a call. */
  CLICS?: D1;
  CLIC_LIMIT?: { limit(options: { key: string }): Promise<{ success: boolean }> };
  /* Secrets. Without them the digest does not go out and settles for the
     Cloudflare log — the counting itself carries on. */
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
}

/* Allow-list. An unknown value is rejected rather than stored: without this,
   anyone could fill the table with arbitrary strings by calling the endpoint
   by hand. */
const CHANNELS = ["phone", "whatsapp", "email", "facebook", "quote"] as const;
export type Channel = (typeof CHANNELS)[number];

const LABEL: Record<Channel, string> = {
  phone: "Calls",
  whatsapp: "WhatsApp",
  email: "Emails",
  facebook: "Facebook",
  quote: "Quotes",
};

/* Vietnam sits at UTC+7 all year, with no daylight saving. The offset is
   therefore a constant rather than a calendar computation: that is what lets us
   cut days without a dependency and without a special case twice a year. */
const ICT = 7 * 3_600_000;

function startOfDay(now: number): string {
  const d = new Date(now + ICT);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - ICT,
  ).toISOString();
}

function startOfMonth(now: number): string {
  const d = new Date(now + ICT);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) - ICT,
  ).toISOString();
}

/**
 * Writes one row. Never awaited by the caller: see `record` below.
 *
 * Any error is swallowed after logging. A failed write is a lost measurement;
 * letting the exception bubble would turn that loss into a failure the visitor
 * can see, which is very much worse.
 */
async function write(
  env: ClicEnv,
  channel: Channel,
  page: string,
  request: Request,
): Promise<void> {
  if (!env.CLICS) return;
  try {
    const mobile = /Mobi|Android|iPhone|iPad/i.test(
      request.headers.get("user-agent") ?? "",
    );
    await env.CLICS.prepare(
      "INSERT INTO contact_click (recorded_at, channel, page, country, device) VALUES (?, ?, ?, ?, ?)",
    )
      .bind(
        new Date().toISOString(),
        channel,
        page,
        request.headers.get("CF-IPCountry") ?? "??",
        mobile ? "mobile" : "desktop",
      )
      .run();
  } catch (e) {
    console.error("[click] write failed", { channel, page, error: String(e) });
  }
}

/**
 * Records without making anyone wait.
 *
 * `waitUntil` lets the response leave immediately and finishes the write
 * afterwards. That is what guarantees adding measurement does not add a
 * millisecond to the start of a phone call — nor to the quote form, which calls
 * this same entry point.
 */
export function record(
  env: ClicEnv,
  ctx: { waitUntil(p: Promise<unknown>): void },
  channel: Channel,
  page: string,
  request: Request,
): void {
  ctx.waitUntil(write(env, channel, page, request));
}

/**
 * `POST /api/clic` — called by `navigator.sendBeacon` at click time.
 *
 * Answers 204: there is nothing to return, and the browser does not wait for a
 * beacon's response anyway. No point producing bytes.
 */
export async function clic(
  request: Request,
  env: ClicEnv,
  ctx: { waitUntil(p: Promise<unknown>): void },
): Promise<Response> {
  /* sendBeacon allows no custom header: the body arrives as text/plain. So we
     read text and then parse — trusting the Content-Type would reject every
     genuine call. */
  let channel = "";
  let page = "";
  try {
    const body = JSON.parse(await request.text()) as { c?: unknown; p?: unknown };
    channel = typeof body.c === "string" ? body.c : "";
    page = typeof body.p === "string" ? body.p.slice(0, 120) : "";
  } catch {
    return new Response(null, { status: 204 });
  }

  /* `quote` is excluded here: it is written server-side, when the email
     actually goes out. Accepting it from the browser would let anyone inflate
     the quote count without sending a single one. */
  if (!CHANNELS.includes(channel as Channel) || channel === "quote") {
    return new Response(null, { status: 204 });
  }
  if (!page.startsWith("/")) page = "/";

  /* A legitimate click is far more frequent than a form submission, hence a
     separate and generous limit. It protects no visitor: it only stops someone
     from manufacturing a number in bursts. */
  if (env.CLIC_LIMIT) {
    const ip = request.headers.get("CF-Connecting-IP") ?? "local";
    const { success } = await env.CLIC_LIMIT.limit({ key: ip });
    if (!success) return new Response(null, { status: 204 });
  }

  record(env, ctx, channel as Channel, page, request);
  return new Response(null, { status: 204 });
}

interface Row {
  channel: string;
  n: number;
}
interface PageRow {
  page: string;
  n: number;
}

function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Daily digest pushed to Telegram.
 *
 * Gives the day just passed *and* the running month. The month total is the
 * useful figure: it is the one you put on the table when a count is disputed,
 * the daily number being only a sign of life.
 *
 * Days and months are cut at Vietnam time (UTC+7), not UTC — that is where this
 * message is read.
 */
export async function digest(env: ClicEnv): Promise<void> {
  if (!env.CLICS) {
    console.error("[click] no CLICS database: digest impossible");
    return;
  }

  const now = Date.now();
  const day = startOfDay(now);
  const month = startOfMonth(now);

  let today: Row[] = [];
  let thisMonth: Row[] = [];
  let pages: PageRow[] = [];
  try {
    [today, thisMonth, pages] = await Promise.all([
      env.CLICS.prepare(
        "SELECT channel, COUNT(*) AS n FROM contact_click WHERE recorded_at >= ? GROUP BY channel",
      )
        .bind(day)
        .all<Row>()
        .then((r) => r.results),
      env.CLICS.prepare(
        "SELECT channel, COUNT(*) AS n FROM contact_click WHERE recorded_at >= ? GROUP BY channel",
      )
        .bind(month)
        .all<Row>()
        .then((r) => r.results),
      env.CLICS.prepare(
        "SELECT page, COUNT(*) AS n FROM contact_click WHERE recorded_at >= ? GROUP BY page ORDER BY n DESC LIMIT 5",
      )
        .bind(month)
        .all<PageRow>()
        .then((r) => r.results),
    ]);
  } catch (e) {
    console.error("[click] read failed", { error: String(e) });
    return;
  }

  const count = (rows: Row[], c: Channel) => rows.find((r) => r.channel === c)?.n ?? 0;
  const dayTotal = today.reduce((s, r) => s + r.n, 0);
  const monthTotal = thisMonth.reduce((s, r) => s + r.n, 0);

  const monthName = new Intl.DateTimeFormat("en-GB", {
    month: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(now));

  const rows = CHANNELS.map((c) => {
    const d = count(today, c);
    const m = count(thisMonth, c);
    return `${LABEL[c].padEnd(9)} ${String(d).padStart(5)} ${String(m).padStart(6)}`;
  });

  /* A day with no contact is not an anomaly on a new site. Saying so in one
     line beats a table of zeros, and beats silence — silence cannot tell
     "nothing to report" apart from "the job stopped running". */
  const body = [
    `<b>${escape(site.name)} — site contacts</b>`,
    "",
    dayTotal === 0
      ? "No contacts today."
      : `${dayTotal} contact${dayTotal > 1 ? "s" : ""} today.`,
    "",
    "<pre>",
    `${"".padEnd(9)} ${"today".padStart(5)} ${monthName.padStart(6)}`,
    ...rows,
    `${"Total".padEnd(9)} ${String(dayTotal).padStart(5)} ${String(monthTotal).padStart(6)}`,
    "</pre>",
    pages.length > 0 ? "\nPages driving contact this month:" : "",
    ...pages.map((p) => `· ${escape(p.page)} — ${p.n}`),
  ]
    .filter((l) => l !== "")
    .join("\n");

  await sendTelegram(env, body);
}

/**
 * Telegram delivery. Silent and harmless when the secrets are missing — which
 * is the case on first deploy, before the bot exists.
 */
export async function sendTelegram(env: ClicEnv, text: string): Promise<void> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    console.warn(
      "[click] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing — digest not sent. " +
        "Create the bot through @BotFather, then: npx wrangler secret put TELEGRAM_BOT_TOKEN",
    );
    return;
  }
  const r = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    },
  );
  if (!r.ok) {
    console.error("[click] Telegram refused the message", {
      status: r.status,
      response: await r.text(),
    });
  }
}
