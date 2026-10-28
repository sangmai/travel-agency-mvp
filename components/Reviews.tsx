import { ReviewCard, SectionHead } from "./ui";
import { Accent, fill } from "@/lib/text";
import { aggregate, getReviews, getHome, getSite } from "@/lib/content";
import { score } from "@/lib/format";

export async function Reviews() {
  const h = (await getHome()).avis;
  const site = await getSite();
  const reviews = await getReviews({ featured: true });

  return (
    <section className="sec sec--sand" id="avis">
      <div className="wrap">
        <SectionHead
          kicker={h.kicker}
          title={<Accent>{fill(h.title, { note: score(site.reviewSource.rating), avis: site.reviewSource.count })}</Accent>}
          lede={h.lede}
        />
        {/* L'agrégat est celui de la plateforme, repris tel quel et cliquable.
            Le nombre est modeste et c'est ainsi : trois avis vérifiables valent
            mieux qu'une moyenne flatteuse que personne ne peut recouper. */}
        <p className="note">
          Note moyenne de {score(site.reviewSource.rating)}/5 sur{" "}
          {site.reviewSource.count} avis publiés, {site.reviewSource.note}.{" "}
          <a className="lnk" href={site.reviewSource.url} rel="noopener nofollow">
            Voir la page {site.reviewSource.name}
          </a>
        </p>

        <div className="revs">
          {reviews.map((r) => (
            <ReviewCard key={r.author + r.date} review={r} showTitle />
          ))}
        </div>
      </div>
    </section>
  );
}
