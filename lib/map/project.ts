import { PROJECTION } from "@/lib/map-shapes";

/**
 * Projects trip stops into the base map's coordinate space.
 *
 * `PROJECTION` is emitted by scripts/make-map.py with its bounds already run
 * through Mercator: all that remains here is a linear interpolation, and the
 * Mercator formula exists in exactly one place in the repository.
 */
const { lon0, lon1, mercY0, mercY1, w, h } = PROJECTION;

export const project = (lon: number, lat: number) => ({
  x: ((lon - lon0) / (lon1 - lon0)) * w,
  y:
    ((mercY1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))) /
      (mercY1 - mercY0)) *
    h,
});
