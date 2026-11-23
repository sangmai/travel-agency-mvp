import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SectionHead } from "@/components/ui";
import { DataTable } from "@/components/DataTable";
import { APIS, CATALOG_PATH, OPENAPI_PATH } from "@/lib/api-catalog";

/**
 * Cible des liens `service-doc` du catalogue RFC 9727.
 *
 * Hors du sitemap et hors du pied de page, volontairement : elle s'adresse à
 * qui intègre le site, pas à qui prépare un voyage, et elle ne répond à aucune
 * requête de recherche. Elle reste publique et explorable, parce qu'un
 * `service-doc` qui renvoie un 404 vaut moins qu'un catalogue absent.
 */
export const metadata: Metadata = {
  title: "Documentation des interfaces",
  alternates: { canonical: "/documentation-api" },
  description:
    "Le contenu du site en Markdown, et le dépôt d'une demande de devis. Catalogue RFC 9727 et document OpenAPI.",
  robots: { index: false, follow: true },
};

export default function DocumentationApi() {
  return (
    <>
      <Header />
      <main id="contenu">
        <section className="sec">
          <div className="wrap">
            <h1 className="sr-only">Documentation des interfaces</h1>
            <SectionHead
              kicker="Pour les machines"
              title="Documentation des interfaces"
              lede="Ce site publie un catalogue d'API au sens de la RFC 9727. Deux interfaces y figurent : la lecture du contenu en Markdown, et le dépôt d'une demande de devis. Le relevé de clics n'y est pas, et n'y sera pas."
            />

            <DataTable
              caption="Les deux documents de découverte"
              columns={["Adresse", "Type", "Ce qu'on y trouve"]}
              rows={[
                [
                  <a key="c" href={CATALOG_PATH}>
                    {CATALOG_PATH}
                  </a>,
                  "application/linkset+json",
                  "Le catalogue : une entrée par interface, avec sa spécification et sa documentation.",
                ],
                [
                  <a key="o" href={OPENAPI_PATH}>
                    {OPENAPI_PATH}
                  </a>,
                  "OpenAPI 3.1",
                  "La description complète des routes, de leurs paramètres et de leurs réponses.",
                ],
              ]}
            />

            <h2 id={APIS[0].id}>{APIS[0].nom}</h2>
            <p>{APIS[0].resume}</p>
            <p>
              Toute page existe en Markdown, et deux chemins y mènent. Le premier est l&apos;adresse
              de la page suffixée de <code>.md</code> : <code>/blog/quy-nhon.md</code>. Le second est
              la même adresse HTML avec un en-tête <code>Accept</code> qui nomme explicitement{" "}
              <code>text/markdown</code> — un <code>Accept</code> générique renvoie le HTML, ce qui
              est voulu : presque tout client qui n&apos;est pas un navigateur envoie{" "}
              <code>*/*</code>, et répondre du Markdown à <code>curl</code> par défaut serait une
              surprise, pas un service.
            </p>
            <p>
              L&apos;inventaire des pages publiées est sur <a href="/llms.txt">/llms.txt</a>, et le
              plan du site sur <a href="/sitemap.xml">/sitemap.xml</a>. Les deux suffisent à
              parcourir le site sans jamais analyser de HTML.
            </p>

            <h2 id={APIS[1].id}>{APIS[1].nom}</h2>
            <p>{APIS[1].resume}</p>
            <p>
              <code>POST /api/devis</code>, corps encodé en formulaire. La réponse normale est une
              redirection <code>303</code> vers la page de remerciement ; un formulaire incomplet
              renvoie un <code>400</code> en JSON nommant les champs fautifs. Quatre champs sont
              obligatoires : <code>prenom</code>, <code>nom</code>, <code>email</code> et{" "}
              <code>consentement</code>, ce dernier devant valoir <code>on</code>.
            </p>
            <p>
              Deux limites, et elles ne sont pas négociables. Cinq requêtes par minute et par
              adresse IP, au-delà desquelles la route répond <code>429</code>. Et un champ{" "}
              <code>reference-interne</code> qui doit rester vide : rempli, la demande est acceptée
              en apparence et n&apos;est jamais envoyée. Il est documenté précisément pour qu&apos;un
              agent honnête sache ne pas y toucher.
            </p>
            <p>
              Chaque demande arrive dans une boîte relevée par des personnes. Ce n&apos;est pas une
              interface de test : n&apos;y envoyez une requête que si vous voulez réellement un
              devis.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
