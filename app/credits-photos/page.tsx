import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SectionHead } from "@/components/ui";
import { getPhotoCredits } from "@/lib/content";

/**
 * The CC BY and CC BY-SA licences require crediting the author and naming the
 * licence: as long as placeholder images remain on the site, this page must stay
 * online and linked from the footer.
 */
export const metadata: Metadata = {
  title: "Crédits photographiques",
  /* Without its own canonical, the page inherited the root's and therefore
     declared itself to be the home page. */
  alternates: { canonical: "/credits-photos" },
  description: "Auteurs, licences et sources des photographies utilisées sur le site.",
  robots: { index: false, follow: true },
};

export default async function Credits() {
  const photos = await getPhotoCredits();

  return (
    <>
      <Header />
      <main id="contenu">
        <section className="sec">
          <div className="wrap">
            <h1 className="sr-only">Crédits photographiques</h1>
            <SectionHead
              kicker="Mentions"
              title="Crédits photographiques"
              lede="Les photographies en ligne proviennent de Wikimedia Commons et de Pexels. Les premières imposent de nommer l'auteur et la licence, les secondes non : elles sont créditées ici quand même, parce qu'une photographie a un auteur que la licence l'exige ou pas. Elles tiennent lieu d'images de substitution le temps de la mise au point du site, et seront remplacées par les photographies de l'agence. Les personnes qui y figurent sont des passants photographiés dans l'espace public : elles ne sont ni membres de l'équipe, ni clientes."
            />
            <div className="credits">
              {photos.map((p) => (
                <div className="credit" key={p.id}>
                  <b>{p.credit.title}</b>
                  {p.credit.author} · {p.credit.licence}
                  <br />
                  <a href={p.credit.page} rel="noopener nofollow">
                    Page du fichier sur Wikimedia Commons
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
