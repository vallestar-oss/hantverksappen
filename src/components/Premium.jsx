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
/* Strong custom easing — Emil Kowalski principles */
:root {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
}

@keyframes page-fade {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.page-fade { animation: page-fade 200ms var(--ease-out) both; }

@keyframes check-pop {
  0%   { transform: scale(0.6); opacity: 0; }
  60%  { transform: scale(1.12); opacity: 1; }
  100% { transform: scale(1);    opacity: 1; }
}
.check-pop { animation: check-pop 360ms cubic-bezier(0.34, 1.56, 0.64, 1) 100ms both; }

/* btn-lift: instant feedback, scale-down on press, no translateY bounce */
.btn-lift {
  transition: transform 140ms var(--ease-out),
              background-color 160ms var(--ease-out),
              border-color 160ms var(--ease-out),
              box-shadow 160ms var(--ease-out),
              opacity 160ms var(--ease-out);
}
@media (hover: hover) and (pointer: fine) {
  .btn-lift:hover:not(:disabled) { transform: translateY(-1px); }
}
.btn-lift:active:not(:disabled) { transform: scale(0.97); }

/* card-lift: tinted shadow matches #F5F4F2 background */
.card-lift {
  transition: transform 150ms var(--ease-out),
              border-color 150ms var(--ease-out),
              box-shadow 150ms var(--ease-out),
              background-color 150ms var(--ease-out);
}
@media (hover: hover) and (pointer: fine) {
  .card-lift:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(17,17,17,0.07), 0 1px 3px rgba(17,17,17,0.04);
  }
}
.card-lift:active { transform: scale(0.99); }

.glow-success {
  box-shadow: 0 0 0 1px rgba(22,163,74,0.18), 0 0 10px rgba(22,163,74,0.18);
}
.glow-danger {
  box-shadow: 0 0 0 1px rgba(220,38,38,0.2), 0 0 10px rgba(220,38,38,0.18);
}

.text-gradient-blue {
  background: linear-gradient(120deg, #FFFFFF 20%, #85ADFF 90%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

/* Stagger list entries — apply .stagger-item to list children */
@keyframes stagger-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.stagger-item {
  animation: stagger-in 220ms var(--ease-out) both;
}
.stagger-item:nth-child(1) { animation-delay:   0ms; }
.stagger-item:nth-child(2) { animation-delay:  40ms; }
.stagger-item:nth-child(3) { animation-delay:  80ms; }
.stagger-item:nth-child(4) { animation-delay: 120ms; }
.stagger-item:nth-child(5) { animation-delay: 160ms; }
.stagger-item:nth-child(6) { animation-delay: 200ms; }
.stagger-item:nth-child(7) { animation-delay: 240ms; }
.stagger-item:nth-child(8) { animation-delay: 280ms; }

/* row-list / row-item — flat premium list pattern */
.row-list {
  background: white;
  border-radius: 14px;
  border: 1px solid #E8E8E6;
  overflow: hidden;
}
.row-item {
  width: 100%;
  display: flex;
  align-items: center;
  background: white;
  transition: background-color 110ms var(--ease-out);
  cursor: pointer;
  border: none;
  text-align: left;
}
.row-item + .row-item { border-top: 1px solid #F1F0EE; }
@media (hover: hover) and (pointer: fine) {
  .row-item:hover { background: #FAFAF8; }
}
.row-item:active { background: #F5F4F2 !important; }

/* stat-card-light — white stat card for mobile dashboard */
.stat-card-light {
  background: white;
  border: 1px solid #E8E8E6;
  border-radius: 14px;
  padding: 16px;
  cursor: pointer;
  transition: box-shadow 150ms var(--ease-out), transform 150ms var(--ease-out);
}
@media (hover: hover) and (pointer: fine) {
  .stat-card-light:hover {
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    transform: translateY(-1px);
  }
}
.stat-card-light:active { transform: scale(0.98); }
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
