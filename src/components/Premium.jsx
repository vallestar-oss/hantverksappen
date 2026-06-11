// Premium visual layer — shared page wrapper, noise texture and micro-interactions.
// All visuals stay on design-system tokens: #0055FF, #111111, #F8F8F8, #E5E5E5.

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

const PREMIUM_CSS = `
@keyframes page-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.page-fade { animation: page-fade 150ms ease-out both; }

@keyframes check-pop {
  0%   { transform: scale(0);    opacity: 0; }
  60%  { transform: scale(1.18); opacity: 1; }
  100% { transform: scale(1);    opacity: 1; }
}
.check-pop { animation: check-pop 400ms cubic-bezier(0.22, 1, 0.36, 1) 100ms both; }

.btn-lift {
  transition: transform 150ms ease, background-color 200ms ease,
              border-color 200ms ease, box-shadow 200ms ease, opacity 200ms ease;
}
.btn-lift:hover:not(:disabled)  { transform: translateY(-1px); }
.btn-lift:active:not(:disabled) { transform: translateY(0) scale(0.99); }

.card-lift {
  transition: transform 150ms ease, border-color 200ms ease, box-shadow 200ms ease;
}
.card-lift:hover {
  transform: translateY(-1px);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 8px rgba(17,17,17,0.06);
}

.glow-success {
  box-shadow: 0 0 0 1px rgba(22,163,74,0.18), 0 0 12px rgba(22,163,74,0.22);
}
.glow-danger {
  box-shadow: 0 0 0 1px rgba(220,38,38,0.22), 0 0 12px rgba(220,38,38,0.22);
}

.text-gradient-blue {
  background: linear-gradient(105deg, #FFFFFF 30%, #85ADFF 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}
`

// Fx — injects the shared CSS without wrapping; for pages that keep their own
// root element. Pair with the `page-fade` class on that root.
export function Fx() {
  return <style>{PREMIUM_CSS}</style>
}

// Page — wraps a screen: injects the shared CSS once and fades the page in.
export default function Page({ children, className = '', style }) {
  return (
    <div className={`page-fade ${className}`} style={style}>
      <style>{PREMIUM_CSS}</style>
      {children}
    </div>
  )
}
