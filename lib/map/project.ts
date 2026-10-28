import { PROJECTION } from "@/lib/map-shapes";

/**
 * Projection des étapes dans l'espace du fond de carte.
 *
 * `PROJECTION` est émis par scripts/make-map.py avec ses bornes déjà passées
 * en Mercator : il ne reste donc ici qu'une interpolation linéaire, et la
 * formule de Mercator n'existe qu'à un seul endroit du dépôt.
 */
const { lon0, lon1, mercY0, mercY1, w, h } = PROJECTION;

export const project = (lon: number, lat: number) => ({
  x: ((lon - lon0) / (lon1 - lon0)) * w,
  y:
    ((mercY1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))) /
      (mercY1 - mercY0)) *
    h,
});
