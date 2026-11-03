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
          {it.href ? <a href={it.href}>{it.label}</a> : it.label}
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
}: {
  title: string;
  body: string;
  href?: string;
}) {
  return (
    <section className="sec close">
      <div className="wrap">
        <h2 className="d2">{title}</h2>
        <p>{body}</p>
        <a className="btn" href={href}>
          Demander mon devis gratuit
        </a>
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
