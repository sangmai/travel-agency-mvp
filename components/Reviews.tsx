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
        {/* The aggregate is the platform's, reused as-is and clickable. The
            count is modest and that is fine: three verifiable reviews beat a
            flattering average nobody can cross-check.

            The wording says "sur Tripadvisor", not "avis publiés": the figure is
            the platform's total, while this page quotes a subset. Claiming three
            are published here when two are is the same category of small,
            checkable lie this section exists to avoid. */}
        <p className="note">
          <b>{score(site.reviewSource.rating)}/5</b> sur{" "}
          {site.reviewSource.count} avis {site.reviewSource.name}.{" "}
          {site.reviewSource.note}{" "}
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
