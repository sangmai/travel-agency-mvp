import { ReviewCard, SectionHead } from "./ui";
import { getReviews, getSite } from "@/lib/content";
import { score } from "@/lib/format";

export async function Reviews() {
  const site = await getSite();
  const reviews = await getReviews({ featured: true });

  return (
    <section className="sec sec--sand" id="avis">
      <div className="wrap">
        <SectionHead
          kicker="Avis vérifiés"
          title={<>{score(site.rating.value)} sur 5, <em>réserves comprises</em></>}
          lede="Nous publions les avis tels qu'ils nous parviennent, y compris ceux qui pointent un hôtel décevant ou une étape ratée. Un mur de cinq étoiles sans une seule réserve n'a jamais aidé personne à choisir."
        />
        <div className="revs">
          {reviews.map((r) => (
            <ReviewCard key={r.author + r.date} review={r} showTitle />
          ))}
        </div>
      </div>
    </section>
  );
}
