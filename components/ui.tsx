import { lien } from "@/lib/content";
import type { ReactNode } from "react";
import { euro, monthYear, score } from "@/lib/format";
import type { Review } from "@/lib/content";

/** Section heading — repeated fourteen times before being extracted. */
export function SectionHead({
  kicker,
  title,
  lede,
}: {
  kicker: string;
  title: ReactNode;
  lede?: ReactNode;
}) {
  return (
    <div className="head">
      <p className="kicker">{kicker}</p>
      <h2 className="d2">{title}</h2>
      {lede && <p className="lede">{lede}</p>}
    </div>
  );
}

/** "from … / person" price, identical in the list, the card and the trip page. */
export function PriceFrom({
  amount,
  className,
  note,
}: {
  amount: number;
  className?: string;
  note?: string;
}) {
  return (
    <span className={className ? `price ${className}` : "price"}>
      <span>à partir de</span>
      <b>{euro(amount)}</b> <em>/ pers.</em>
      {note && <small>{note}</small>}
    </span>
  );
}

/** Review. `showTitle` on the home page, departure date on a trip page. */
export function ReviewCard({
  review,
  showTitle,
  departure,
}: {
  review: Review;
  showTitle?: boolean;
  departure?: boolean;
}) {
  return (
    <article className="rev">
      <p className="rev__score">{score(review.rating)} / 5</p>
      {showTitle && review.title && <h3 className="d3">{review.title}</h3>}
      <p className="rev__q">« {review.body} »</p>
      <p className="rev__by">
        <b>{review.author}</b>
        <br />
        {review.city}
        {departure ? ` · départ de ${monthYear(review.date)}` : ` · ${monthYear(review.date)}`}
        {/* The provenance is shown and clickable: a testimonial the visitor
            cannot go and verify proves nothing. */}
        {review.source && review.sourceUrl && (
          <>
            <br />
            <a className="rev__src" href={review.sourceUrl} rel="noopener nofollow">
              Vérifier sur {review.source}
            </a>
          </>
        )}
      </p>
    </article>
  );
}

/** Fil d'Ariane visible. Le pendant JSON-LD est construit par `breadcrumb()`. */
export function Fil({
  items,
  light,
}: {
  items: { label: string; href?: string }[];
  light?: boolean;
}) {
  return (
    <nav className={light ? "fil fil--light" : "fil"} aria-label="Fil d'Ariane">
      {items.map((it, i) => (
        <span key={it.label}>
          {i > 0 && <span aria-hidden="true">›</span>}
          {it.href ? <a href={lien(it.href)}>{it.label}</a> : it.label}
        </span>
      ))}
    </nav>
  );
}

/**
 * Closing block. The two call sites differ only in their two sentences; the
 * call to action is deliberately the same everywhere.
 */
export function Closing({
  title,
  body,
  /* `/#devis` by default — correct on the seventeen pages that carry no form.
     The eight that do pass "#devis" so the button scrolls instead of leaving a
     page where the form is already a few hundred pixels below. Sending someone
     back to the home page from directly above a form is the kind of detail that
     reads as carelessness. */
  href = "/#devis",
  /* The planner link below the button. On by default because every page that
     closes with this block is a page where someone has just finished reading
     about dates, distances or seasons — the exact moment the tool answers a
     question the text cannot. Off on the planner's own page, where it would
     link to itself. */
  outil = true,
}: {
  title: string;
  body: string;
  href?: string;
  outil?: boolean;
}) {
  return (
    <section className="sec close">
      <div className="wrap">
        <h2 className="d2">{title}</h2>
        <p>{body}</p>
        <a className="btn" href={lien(href)}>
          Demander mon devis gratuit
        </a>
        {/* Secondary, and deliberately a plain text link rather than a second
            button: two buttons side by side split the decision and cost
            conversions. The wording matches the home page and the blog rail
            word for word — an action keeps its name across the whole site. */}
        {outil && (
          <p className="close__outil">
            Ou vérifiez d&apos;abord vos dates&nbsp;:{" "}
            <a href={lien("/organiser-son-voyage-au-vietnam")}>
              tester mon itinéraire
            </a>{" "}
            — l&apos;outil compte les nuits et les trajets, et dit ce qui
            dépasse. Gratuit, sans inscription.
          </p>
        )}
      </div>
    </section>
  );
}

/**
 * Structured-data injection.
 *
 * Escaping `<` is the part that matters: it stops a content string from closing
 * the `script` tag. It used to be written three times.
 */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
