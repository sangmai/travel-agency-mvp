import { NEIGHBOURS, VIETNAM, type Shape } from "@/lib/map-shapes";
import { project } from "@/lib/map/project";
import type { ResolvedStop } from "@/lib/content";

/**
 * Itinerary map: SVG computed at build time, with no mapping library, no tiles
 * and no JavaScript. It therefore sits in the served HTML, visible without
 * script and readable by a crawler.
 *
 * `aria-hidden`: the ordered list of stops published next to it says the same
 * thing, and says it better for a screen reader.
 */

type Box = { x0: number; y0: number; x1: number; y1: number };

const hits = (a: Box, b: Box) =>
  a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

/** Approximate text width. 0.52 em per character is enough: the estimate only
 *  serves to avoid overlaps. */
const textWidth = (s: string, fs: number) => s.length * fs * 0.52;

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Framing fitted to the trip, corrected only outside an acceptable range of
 *  aspect ratios: a wide, short map reads perfectly well, and forcing an exact
 *  ratio used to drown compact itineraries in empty space. */
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
 * `route` connects the stops in programme order. The country map reuses the
 * same projection and the same label placement, but draws no path: joining
 * twenty-three places there would sketch a journey that does not exist.
 */
export function TripMap({
  stops,
  route = true,
  inconnus,
  nuits,
  onPick,
}: {
  stops: ResolvedStop[];
  route?: boolean;
  /**
   * Indices of the hops the planner has no travel data for: `i` marks the
   * segment from stop `i` to stop `i + 1`.
   *
   * Left undefined — which is every trip sheet — the route stays one polyline,
   * byte for byte what it was. Only the planner passes this, and only then is
   * the line split into segments so the unaccounted ones can be greyed.
   *
   * Grey rather than a different dash: the line is ALREADY dashed, and that
   * dash means "this joins two stops, it does not draw the road". A second
   * meaning on the same signal would cost both.
   */
  inconnus?: ReadonlySet<number>;
  /**
   * Nights per stop, aligned with `stops`, for the hover line.
   *
   * Passed in rather than read off the stop, because `resolveStops` spreads
   * the PLACE — whose `nuits` is the generic `{min, ideal}` for that town, not
   * what this trip actually stays. Reading it there would print "Hoi An ·
   * 4 nuits" on a sheet whose own programme says two. Only a caller that holds
   * the real figure can supply it, so only a caller that does gets the hover.
   */
  nuits?: number[];
  /**
   * Called with the stop's index when a marker is clicked.
   *
   * This is what closes the loop: the map sits under the list, so spotting a
   * wrong stop there used to mean scrolling back up and finding it again from
   * memory. It also gives touch something to do — there is no hover on a
   * phone, so without this the feature would be invisible to half the visitors.
   *
   * The SVG stays `aria-hidden`, which means this shortcut is for pointers
   * only. That is deliberate and it is a trade: un-hiding the map to make the
   * markers focusable would have a screen reader read the whole itinerary
   * twice. The list above remains fully operable by keyboard and is the
   * primary control; this is a redundant shortcut layered on top of it.
   */
  onPick?: (i: number) => void;
}) {
  const pts = stops.map((s) => ({ label: s.map, ...project(s.lon, s.lat) }));
  const view = frame(pts);
  const { x0, y0, w, h } = view;

  /* Markers sized against the frame's larger dimension, to keep the same
     apparent size whatever the zoom. */
  const k = Math.max(w, h) / 560;
  const r = 10 * k;
  const stroke = 2.2 * k;
  const fs = 13.5 * k;
  const gap = r * 0.7;

  /* Paths entirely outside the frame are not rendered: otherwise an itinerary
     confined to the North dragged in Cambodia and the whole South. */
  const visible = (s: Shape) =>
    hits({ x0: s.b[0], y0: s.b[1], x1: s.b[2], y1: s.b[3] }, view);

  /* Candidate position table hoisted out of the loop: it depends only on r,
     gap and fs, all known beforehand. */
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

  /* Each label tries the eight positions and keeps the first that overlaps
     nothing; a placed label then becomes an obstacle for the next ones. Greedy
     and walked in programme order, therefore deterministic: the same trip
     produces the same map on every build. */
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

      {/* Dashed: the line joins stops, it does not describe the road. */}
      {route && !inconnus && (
        <polyline
          points={pts.map((p) => `${r1(p.x)},${r1(p.y)}`).join(" ")}
          className="tripmap__route"
          strokeWidth={r1(stroke * 1.4)}
          strokeDasharray={`${r1(6 * k)} ${r1(5 * k)}`}
        />
      )}

      {/* One line per hop, so the ones we cannot cost can say so. */}
      {route &&
        inconnus &&
        pts.slice(0, -1).map((p, i) => (
          <line
            key={i}
            x1={r1(p.x)}
            y1={r1(p.y)}
            x2={r1(pts[i + 1].x)}
            y2={r1(pts[i + 1].y)}
            className={
              inconnus.has(i)
                ? "tripmap__route tripmap__route--inconnu"
                : "tripmap__route"
            }
            strokeWidth={r1(stroke * 1.4)}
            strokeDasharray={`${r1(6 * k)} ${r1(5 * k)}`}
          />
        ))}

      {/* Labels before markers: if a halo bites into a marker, it is the
          marker that must stay crisp. */}
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
        <g
          key={p.label}
          className={onPick ? "tripmap__pt tripmap__pt--cliquable" : "tripmap__pt"}
          /* Attached only when a caller asked for it. A trip sheet renders on
             the server, where a handler cannot exist; leaving the attribute off
             entirely is what keeps this one file usable from both sides. */
          {...(onPick ? { onClick: () => onPick(i) } : {})}
        >
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
          {/* Shown on hover, and only where the caller supplied real nights.
              A single line of text rather than a boxed tooltip: the label
              style already carries a paper-coloured halo drawn under the fill,
              which is what makes a name readable over land, sea or the route
              line — the same trick works here and saves measuring a box.

              It repeats the name on purpose. The name is already printed
              beside the dot, but in a dense cluster the placement algorithm
              puts it wherever it finds room, and which name belongs to which
              dot is exactly what a visitor cannot tell. */}
          {nuits?.[i] !== undefined && (
            <text
              x={r1(p.x)}
              y={r1(p.y + r * 2.9)}
              textAnchor="middle"
              className="tripmap__tip"
              fontSize={r1(fs * 0.92)}
              strokeWidth={r1(3.6 * k)}
            >
              {p.label} · {nuits[i]} {nuits[i] > 1 ? "nuits" : "nuit"}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
