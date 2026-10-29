import { NEIGHBOURS, VIETNAM, type Shape } from "@/lib/map-shapes";
import { project } from "@/lib/map/project";
import type { ResolvedStop } from "@/lib/content";

/**
 * Carte de l'itinéraire : SVG calculé au build, sans bibliothèque
 * cartographique, sans tuiles et sans JavaScript. Elle est donc dans le HTML
 * servi, visible sans script et lisible par un crawler.
 *
 * `aria-hidden` : la liste ordonnée des étapes publiée à côté dit la même
 * chose, en mieux pour un lecteur d'écran.
 */

type Box = { x0: number; y0: number; x1: number; y1: number };

const hits = (a: Box, b: Box) =>
  a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

/** Largeur approchée d'un texte. 0,52 em par caractère suffit : l'estimation
 *  ne sert qu'à éviter les chevauchements. */
const textWidth = (s: string, fs: number) => s.length * fs * 0.52;

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Cadrage ajusté au voyage, avec correction seulement hors d'une plage de
 *  rapports acceptable : une carte large et courte se lit très bien, et
 *  imposer un rapport exact noyait les circuits compacts dans du vide. */
function frame(pts: { x: number; y: number }[]) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const pad = Math.max(42, 0.16 * Math.max(maxX - minX, maxY - minY));
  let x0 = minX - pad * 1.55;
  let x1 = maxX + pad * 1.55;
  let y0 = minY - pad;
  let y1 = maxY + pad;

  const MIN = 0.55;
  const MAX = 1.6;
  const ratio = (x1 - x0) / (y1 - y0);
  if (ratio < MIN) {
    const need = (y1 - y0) * MIN;
    const cx = (x0 + x1) / 2;
    [x0, x1] = [cx - need / 2, cx + need / 2];
  } else if (ratio > MAX) {
    const need = (x1 - x0) / MAX;
    const cy = (y0 + y1) / 2;
    [y0, y1] = [cy - need / 2, cy + need / 2];
  }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

/**
 * `route` relie les étapes dans l'ordre du programme. La carte du pays
 * réutilise la même projection et le même placement de noms, mais sans
 * tracé : y relier vingt-trois lieux dessinerait un parcours qui n'existe
 * pas.
 */
export function TripMap({
  stops,
  route = true,
}: {
  stops: ResolvedStop[];
  route?: boolean;
}) {
  const pts = stops.map((s) => ({ label: s.map, ...project(s.lon, s.lat) }));
  const view = frame(pts);
  const { x0, y0, w, h } = view;

  /* Repères dimensionnés sur la plus grande dimension du cadre, pour garder
     la même taille apparente quel que soit le zoom. */
  const k = Math.max(w, h) / 560;
  const r = 10 * k;
  const stroke = 2.2 * k;
  const fs = 13.5 * k;
  const gap = r * 0.7;

  /* Les tracés entièrement hors cadrage ne sont pas rendus : un circuit
     limité au Nord embarquait sinon le Cambodge et tout le Sud. */
  const visible = (s: Shape) =>
    hits({ x0: s.b[0], y0: s.b[1], x1: s.b[2], y1: s.b[3] }, view);

  /* Table de positions candidates hissée hors de la boucle : elle ne dépend
     que de r, gap et fs, tous connus avant. */
  const candidates = [
    { dx: r + gap, dy: fs * 0.36, anchor: "start" as const },
    { dx: -(r + gap), dy: fs * 0.36, anchor: "end" as const },
    { dx: 0, dy: -(r + gap), anchor: "middle" as const },
    { dx: 0, dy: r + gap + fs * 0.85, anchor: "middle" as const },
    { dx: r * 0.75, dy: -(r + gap * 0.8), anchor: "start" as const },
    { dx: -(r * 0.75), dy: -(r + gap * 0.8), anchor: "end" as const },
    { dx: r * 0.75, dy: r + gap + fs * 0.75, anchor: "start" as const },
    { dx: -(r * 0.75), dy: r + gap + fs * 0.75, anchor: "end" as const },
  ];

  const inset = 3 * k;
  const inside = (b: Box) =>
    b.x0 >= view.x0 + inset &&
    b.x1 <= view.x1 - inset &&
    b.y0 >= view.y0 + inset &&
    b.y1 <= view.y1 - inset;

  /* Chaque nom essaie les huit positions et retient la première qui ne
     chevauche rien ; l'étiquette posée devient obstacle pour les suivantes.
     Glouton et parcouru dans l'ordre du programme, donc déterministe : le
     même voyage produit la même carte à chaque build. */
  const obstacles: Box[] = pts.map((p) => ({
    x0: p.x - r * 1.15,
    y0: p.y - r * 1.15,
    x1: p.x + r * 1.15,
    y1: p.y + r * 1.15,
  }));

  const labels = pts.map((p) => {
    const tw = textWidth(p.label, fs);
    const th = fs * 1.15;
    const boxOf = (c: (typeof candidates)[number]): Box => {
      const tx = p.x + c.dx;
      const ty = p.y + c.dy;
      const left =
        c.anchor === "start" ? tx : c.anchor === "end" ? tx - tw : tx - tw / 2;
      return { x0: left, y0: ty - th * 0.84, x1: left + tw, y1: ty + th * 0.2 };
    };

    let chosen = candidates[0];
    let box = boxOf(chosen);
    for (const c of candidates) {
      const b = boxOf(c);
      if (inside(b) && !obstacles.some((o) => hits(o, b))) {
        chosen = c;
        box = b;
        break;
      }
    }
    obstacles.push(box);
    return { ...p, ...chosen };
  });

  return (
    <svg
      className="tripmap"
      viewBox={`${r1(x0)} ${r1(y0)} ${r1(w)} ${r1(h)}`}
      aria-hidden="true"
      focusable="false"
    >
      <rect x={r1(x0)} y={r1(y0)} width={r1(w)} height={r1(h)} className="tripmap__sea" />

      {NEIGHBOURS.filter(visible).map((s) => (
        <path key={s.d.slice(0, 24)} d={s.d} className="tripmap__neighbour" />
      ))}
      {VIETNAM.filter(visible).map((s) => (
        <path key={s.d.slice(0, 24)} d={s.d} className="tripmap__land" />
      ))}

      {/* Pointillé : le trait relie des étapes, il ne décrit pas la route. */}
      {route && (
        <polyline
          points={pts.map((p) => `${r1(p.x)},${r1(p.y)}`).join(" ")}
          className="tripmap__route"
          strokeWidth={r1(stroke * 1.4)}
          strokeDasharray={`${r1(6 * k)} ${r1(5 * k)}`}
        />
      )}

      {/* Noms avant pastilles : si un halo mord sur un repère, c'est le
          repère qui doit rester net. */}
      {labels.map((l) => (
        <text
          key={`t${l.label}`}
          x={r1(l.x + l.dx)}
          y={r1(l.y + l.dy)}
          textAnchor={l.anchor}
          className="tripmap__label"
          fontSize={r1(fs)}
          strokeWidth={r1(3.6 * k)}
        >
          {l.label}
        </text>
      ))}

      {pts.map((p, i) => (
        <g key={p.label}>
          <circle
            cx={r1(p.x)}
            cy={r1(p.y)}
            r={r1(r)}
            className="tripmap__dot"
            strokeWidth={r1(stroke)}
          />
          <text
            x={r1(p.x)}
            y={r1(p.y + r * 0.36)}
            className="tripmap__n"
            fontSize={r1(r * 1.06)}
          >
            {i + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}
