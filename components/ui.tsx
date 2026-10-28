import type { ReactNode } from "react";
import { euro, monthYear, score } from "@/lib/format";
import type { Review } from "@/lib/content";

/** En-tête de section — répété quatorze fois avant d'être extrait. */
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

/** Prix « à partir de … / pers. », identique dans la liste, la carte et la fiche. */
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

/** Avis. `showTitle` sur la page d'accueil, date de départ sur une fiche. */
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
 * Bloc de clôture. Les deux appels ne diffèrent que par les deux phrases ;
 * l'appel à l'action est volontairement le même partout.
 */
export function Closing({ title, body }: { title: string; body: string }) {
  return (
    <section className="sec close">
      <div className="wrap">
        <h2 className="d2">{title}</h2>
        <p>{body}</p>
        <a className="btn" href="/#devis">
          Demander mon devis gratuit
        </a>
      </div>
    </section>
  );
}

/**
 * Injection de données structurées.
 *
 * L'échappement de `<` est la partie qui compte : il empêche une chaîne de
 * contenu de refermer la balise `script`. Il était écrit trois fois.
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
