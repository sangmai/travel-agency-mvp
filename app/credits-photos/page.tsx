import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SectionHead } from "@/components/ui";
import { getPhotoCredits } from "@/lib/content";

/**
 * Les licences CC BY et CC BY-SA imposent de créditer l'auteur et de nommer
 * la licence : tant que des images de substitution figurent sur le site,
 * cette page doit rester en ligne et liée depuis le pied de page.
 */
export const metadata: Metadata = {
  title: "Crédits photographiques",
  /* Sans canonique propre, la page héritait de celle de la racine et se
     déclarait donc comme étant la page d'accueil. */
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
              lede="Les photographies actuellement en ligne proviennent de Wikimedia Commons et sont publiées sous licence libre. Elles tiennent lieu d'images de substitution le temps de la mise au point du site, et seront remplacées par les photographies de l'agence. Les personnes qui y figurent sont des passants photographiés dans l'espace public : elles ne sont ni membres de l'équipe, ni clientes."
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
