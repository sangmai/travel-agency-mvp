import { getPhotoMeta, type PhotoId } from "@/lib/content";
import manifest from "@/lib/image-manifest.json";

/**
 * Chaque emplacement d'image, décrit une fois : un composant dit *où* l'image
 * est posée, pas comment la compresser.
 *
 * `priority` n'est vrai que pour `hero` — c'est le LCP, et une seconde image
 * prioritaire ne ferait que lui disputer la bande passante.
 */
const ROLES = {
  hero: { sizes: "100vw", priority: true },

  /* Sous un voile opaque à 68-95 %, le détail ne se verra jamais : inutile
     d'aller chercher la pleine largeur. */
  backdrop: { sizes: "min(100vw, 1100px)", priority: false },

  half: { sizes: "(max-width: 800px) 100vw, 50vw", priority: false },
  card: {
    sizes: "(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw",
    priority: false,
  },

  /* `min()` reprend le clamp(230px, 27vw, 360px) du CSS : sans lui, un écran
     large demandait 403 px pour un élément qui ne dépasse jamais 360. */
  shot: { sizes: "(max-width: 700px) 60vw, min(28vw, 360px)", priority: false },

  thumb: { sizes: "(max-width: 560px) 100vw, 190px", priority: false },
  day: { sizes: "(max-width: 1000px) 100vw, 260px", priority: false },
  story: { sizes: "(max-width: 900px) 100vw, 46vw", priority: false },
} as const;

export type PhotoRole = keyof typeof ROLES;

type Variant = { w: number; h: number; widths: number[]; blur: string };
const variants = manifest as Record<string, Variant>;

export async function Photo({
  id,
  role,
  decorative,
}: {
  id: PhotoId;
  role: PhotoRole;
  /** Image de fond : masquée aux lecteurs d'écran, le texte posé dessus dit déjà tout. */
  decorative?: boolean;
}) {
  const meta = (await getPhotoMeta())[id];
  if (!meta) throw new Error(`Photo « ${id} » absente de content/photos.json.`);
  const v = variants[id];
  if (!v) throw new Error(`Photo « ${id} » absente du manifeste — relancez scripts/make-images.mjs.`);

  const { sizes, priority } = ROLES[role];

  return (
    <img
      src={`/photos/v/${id}-${v.widths.at(-1)}.webp`}
      srcSet={v.widths.map((w) => `/photos/v/${id}-${w}.webp ${w}w`).join(", ")}
      sizes={sizes}
      alt={decorative ? "" : meta.alt}
      aria-hidden={decorative || undefined}
      width={v.w}
      height={v.h}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      /* Vignette floue le temps du chargement — l'image la recouvre ensuite. */
      style={{ backgroundImage: `url(${v.blur})`, backgroundSize: "cover" }}
    />
  );
}

/** Légende « lieu · latitude », quand une image en porte une. */
export async function photoCaption(id: PhotoId) {
  const meta = (await getPhotoMeta())[id];
  return meta.lat === null ? meta.place : `${meta.place} · ${meta.lat}°N`;
}
