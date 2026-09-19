// Shared page wrapper and film-grain texture. Animations and micro-interaction
// classes (.page-fade, .btn-lift, .card-lift, .row-list …) live in index.css.

// Subtle film-grain noise for dark surfaces (Stripe/Linear-style), pure CSS/SVG.
const NOISE_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

export function Noise({ opacity = 0.05 }) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{ backgroundImage: NOISE_URI, opacity }}
    />
  )
}

// Page — outermost wrapper of every screen; fades the content in.
export default function Page({ children, className = '', style }) {
  return (
    <div className={`page-fade ${className}`} style={style}>
      {children}
    </div>
  )
}
