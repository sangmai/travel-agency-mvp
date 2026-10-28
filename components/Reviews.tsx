import { ReviewCard, SectionHead } from "./ui";
import { Accent, fill } from "@/lib/text";
import { aggregate, getReviews, getHome } from "@/lib/content";
import { score } from "@/lib/format";

export async function Reviews() {
  const h = (await getHome()).avis;
  const reviews = await getReviews({ featured: true });

  return (
    <section className="sec sec--sand" id="avis">
      <div className="wrap">
        <SectionHead
          kicker={h.kicker}
          title={<Accent>{fill(h.title, { note: score(aggregate(reviews).value) })}</Accent>}
          lede={h.lede}
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
