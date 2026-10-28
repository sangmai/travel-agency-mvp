/**
 * Les deux seuls dessins qui restent. Tout le reste de l'imagerie est
 * photographique — voir lib/photos.ts.
 */

/** Marque : une fleur de jasmin, au trait. */
export function Glyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse
          key={deg}
          cx="16"
          cy="9.2"
          rx="3.6"
          ry="5.9"
          stroke="currentColor"
          strokeWidth="1.5"
          transform={`rotate(${deg} 16 16)`}
        />
      ))}
      <circle cx="16" cy="16" r="2.1" fill="#B85C12" />
    </svg>
  );
}

/**
 * Portrait de la conseillère.
 *
 * ⚠️ Volontairement une silhouette dessinée, et non une photographie.
 * Les images de substitution du site montrent des passants photographiés
 * dans la rue : en coller une sous le nom d'une fondatrice reviendrait à
 * fabriquer une identité à partir du visage de quelqu'un. À remplacer par
 * la photo de la personne réelle, avec son accord.
 */
export function Portrait() {
  return (
    <svg
      viewBox="0 0 320 400"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="320" height="400" fill="#2C6354" />
      <g stroke="#4E8878" fill="none" strokeWidth="1.2" opacity="0.6">
        {Array.from({ length: 7 }).map((_, k) => (
          <circle key={k} cx="160" cy="168" r={48 + k * 16} />
        ))}
      </g>
      <circle cx="160" cy="168" r="48" fill="#1B4238" opacity="0.55" />
      <path
        d="M160 236 q-68 6 -80 82 L244 318 q-12 -76 -84 -82 Z"
        fill="#1B4238"
        opacity="0.5"
      />
      <text
        x="160"
        y="374"
        textAnchor="middle"
        fontSize="10"
        letterSpacing="2.4"
        fill="#DDD3C4"
        fontFamily="system-ui, sans-serif"
      >
        PHOTO À REMPLACER
      </text>
    </svg>
  );
}

export function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M2.5 9.5 L7 14 L15.5 4"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
