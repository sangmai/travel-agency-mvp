import { getPhotoMeta, type PhotoId } from "@/lib/content";
import manifest from "@/lib/image-manifest.json";

/**
 * Every image slot, described once: a component says *where* the image sits,
 * not how to compress it.
 *
 * `priority` is true only for `hero` — that is the LCP element, and a second
 * priority image would only compete with it for bandwidth.
 */
const ROLES = {
  hero: { sizes: "100vw", priority: true },

  /* Under a 68-95% opaque veil the detail will never be seen: no point
     fetching the full width. */
  backdrop: { sizes: "min(100vw, 1100px)", priority: false },

  half: { sizes: "(max-width: 800px) 100vw, 50vw", priority: false },
  card: {
    sizes: "(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw",
    priority: false,
  },

  /**
   * `shot` and `story` both sit in PORTRAIT boxes — 3/4 and 1/1 for the
   * carnet, 4/5 for the story — while every photograph on the site is
   * landscape. With `object-fit: cover` the browser scales the image until it
   * fills the *height*, then crops the sides: the file it needs is far wider
   * than the box.
   *
   * These two previously declared the box width alone, and the carnet came out
   * visibly soft. The arithmetic: a 360px-wide box at 3/4 is 480px tall; a 3:2
   * photograph covering it is 720px wide before cropping, 1440 on a 2× screen.
   * `sizes` said 360, the browser fetched the 384 variant and stretched it.
   *
   * The factor is source ratio ÷ box ratio — about 2 for both (1.5 ÷ 0.75,
   * 1.5 ÷ 0.8). Hence the doubled values below. They look wrong next to the
   * CSS until you remember `sizes` describes the file to fetch, not the
   * element to draw.
   *
   * `min()` still mirrors the CSS clamp(230px, 27vw, 360px), doubled: without
   * it a wide screen asked for more than the element can ever use.
   */
  shot: { sizes: "(max-width: 700px) 120vw, min(56vw, 720px)", priority: false },

  /* Standalone band between two sections. Never priority: the LCP element is
     the hero, and a second image asking for the same bandwidth only delays it. */
  bande: { sizes: "(max-width: 1240px) 100vw, 1200px", priority: false },

  thumb: { sizes: "(max-width: 560px) 100vw, 190px", priority: false },
  day: { sizes: "(max-width: 1000px) 100vw, 260px", priority: false },
  story: { sizes: "(max-width: 900px) 200vw, 92vw", priority: false },
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
  /** Backdrop image: hidden from screen readers, the text over it already says everything. */
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

/** "place · latitude" caption, when an image carries one. */
export async function photoCaption(id: PhotoId) {
  const meta = (await getPhotoMeta())[id];
  return meta.lat === null ? meta.place : `${meta.place} · ${meta.lat}°N`;
}
