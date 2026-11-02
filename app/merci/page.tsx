import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSite } from "@/lib/content";

/**
 * Deindexed: no search value, and it would pollute landing-page statistics. It
 * is, however, the page on which to fire the conversion in the analytics tool.
 */
export const metadata: Metadata = {
  title: "Votre demande est bien arrivée",
  robots: { index: false, follow: false },
};

export default async function Merci() {
  const site = await getSite();

  return (
    <>
      <Header />
      <main id="contenu">
        <section className="sec">
          <div className="wrap">
            <p className="kicker">Demande reçue</p>
            <h1 className="d2">
              Votre projet est arrivé. <em>À nous de jouer.</em>
            </h1>
            <p className="lede">
              Votre conseillère revient vers vous sous {site.responseTime} ouvrées
              avec un itinéraire complet, les hôtels nommés et un prix ferme. Pour
              ajouter quelque chose entre-temps, répondez à l&apos;e-mail de
              confirmation ou écrivez à{" "}
              <a href={`mailto:${site.email}`} className="lnk">{site.email}</a>.
            </p>
            <p className="cta-row">
              <a className="btn btn--outline" href="/">Revenir à l&apos;accueil</a>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
