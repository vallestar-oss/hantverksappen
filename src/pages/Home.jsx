import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion, MotionConfig, useReducedMotion } from 'framer-motion'
import {
  FileText, Briefcase, Receipt, ArrowRight,
  Check, Wrench, Menu, X,
} from 'lucide-react'

// ─── Shared CSS ───────────────────────────────────────────────────────────────

const HOME_CSS = `
  :root {
    --ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1);
    --ease-in-out-strong: cubic-bezier(0.77, 0, 0.175, 1);
  }

  /* Button press: origin-aware scale */
  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #0055FF;
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    padding: 14px 28px;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    transition:
      transform 140ms var(--ease-out-strong),
      background-color 160ms var(--ease-out-strong),
      box-shadow 160ms var(--ease-out-strong);
  }
  .btn-primary:active { transform: scale(0.97); }
  @media (hover: hover) and (pointer: fine) {
    .btn-primary:hover {
      background: #0044CC;
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(0,85,255,0.28);
    }
  }

  .btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #F5F5F5;
    color: #111;
    font-size: 15px;
    font-weight: 600;
    padding: 14px 28px;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    text-decoration: none;
    transition: transform 140ms var(--ease-out-strong), background-color 160ms var(--ease-out-strong);
  }
  .btn-secondary:active { transform: scale(0.97); }
  @media (hover: hover) and (pointer: fine) {
    .btn-secondary:hover { background: #EBEBEB; }
  }

  .btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    color: rgba(255,255,255,0.6);
    font-size: 15px;
    font-weight: 500;
    padding: 14px 28px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.12);
    cursor: pointer;
    transition: transform 140ms var(--ease-out-strong), background-color 160ms var(--ease-out-strong), color 160ms;
  }
  .btn-ghost:active { transform: scale(0.97); }
  @media (hover: hover) and (pointer: fine) {
    .btn-ghost:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.85); }
  }

  /* Mobile: hide product preview sidebar so content area has room */
  @media (max-width: 767px) {
    .preview-sidebar { display: none !important; }
    .preview-window  { max-width: 100%; }
  }

  /* Marquee */
  @keyframes marquee-scroll {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  .marquee-track {
    display: flex;
    width: max-content;
    animation: marquee-scroll 28s linear infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .marquee-track { animation: none; }
  }

  /* Nav link hover */
  .nav-link {
    font-size: 14px;
    font-weight: 500;
    color: #666;
    text-decoration: none;
    transition: color 150ms;
  }
  .nav-link:hover { color: #111; }

  /* Pricing button */
  .btn-plan-featured {
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    background: #fff;
    color: #0055FF;
    border: none;
    cursor: pointer;
    transition: transform 140ms var(--ease-out-strong), box-shadow 140ms var(--ease-out-strong);
  }
  .btn-plan-featured:active { transform: scale(0.97); }
  @media (hover: hover) and (pointer: fine) {
    .btn-plan-featured:hover { box-shadow: 0 4px 16px rgba(255,255,255,0.25); }
  }

  .btn-plan {
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    background: #111;
    color: #fff;
    border: none;
    cursor: pointer;
    transition: transform 140ms var(--ease-out-strong), background-color 140ms;
  }
  .btn-plan:active { transform: scale(0.97); }
  @media (hover: hover) and (pointer: fine) {
    .btn-plan:hover { background: #222; }
  }

  /* Keyboard focus — visible outline for all interactive elements */
  .btn-primary:focus-visible,
  .btn-secondary:focus-visible,
  .btn-ghost:focus-visible,
  .btn-plan:focus-visible,
  .btn-plan-featured:focus-visible,
  .nav-link:focus-visible {
    outline: 2px solid #0055FF;
    outline-offset: 3px;
    border-radius: 4px;
  }
`

// ─── Motion helpers ───────────────────────────────────────────────────────────

const EASE = [0.23, 1, 0.32, 1]

function fadeUp(delay = 0, y = 22) {
  return {
    initial: { opacity: 0, y },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-56px' },
    transition: { duration: 0.65, delay, ease: EASE },
  }
}

function fadeIn(delay = 0) {
  return {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true, margin: '-56px' },
    transition: { duration: 0.55, delay, ease: EASE },
  }
}

// ─── Product preview ──────────────────────────────────────────────────────────

const JOBS = [
  { customer: 'Svenssons Fastighet AB', type: 'VVS',     amount: '34 500 kr', status: 'Pågående',       sc: '#0055FF', sb: '#EEF4FF' },
  { customer: 'Lindqvist Villa',         type: 'El',      amount: '18 900 kr', status: 'Offert skickad', sc: '#D97706', sb: '#FFF8EE' },
  { customer: 'Bergstrom och Co',        type: 'Målning', amount: '9 200 kr',  status: 'Klart',          sc: '#16A34A', sb: '#F0FFF4' },
  { customer: 'Nilsson Bostad',          type: 'Snickeri',amount: '22 700 kr', status: 'Fakturerat',     sc: '#777',    sb: '#F5F5F5' },
]

function ProductPreview() {
  return (
    <div className="relative" style={{ width: '100%', maxWidth: 580, flexShrink: 0 }}>
      {/* Main window */}
      <div
        className="rounded-2xl overflow-hidden relative"
        style={{
          background: '#fff',
          boxShadow:
            '0 0 0 1px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.07), 0 32px 80px rgba(0,0,0,0.10)',
        }}
      >
        {/* Browser chrome */}
        <div
          className="flex items-center gap-1.5 px-4 py-3"
          style={{ background: '#FAFAFA', borderBottom: '1px solid #E5E5E5' }}
        >
          <span className="w-3 h-3 rounded-full" style={{ background: '#FF6057' }} />
          <span className="w-3 h-3 rounded-full" style={{ background: '#FEBC2E' }} />
          <span className="w-3 h-3 rounded-full" style={{ background: '#29C740' }} />
          <div
            className="flex-1 mx-3 h-5 rounded flex items-center px-3"
            style={{ background: '#EFEFEF' }}
          >
            <span style={{ fontSize: 11, color: '#999', fontWeight: 500 }}>
              app.hantverksappen.se/jobb
            </span>
          </div>
        </div>

        <div className="flex" style={{ minHeight: 320 }}>
          {/* Sidebar */}
          <div
            className="preview-sidebar flex flex-col py-4 px-2.5 gap-0.5"
            style={{ width: 148, background: '#111111', flexShrink: 0 }}
          >
            <div className="flex items-center gap-2 px-2.5 py-2 mb-3">
              <div
                className="flex items-center justify-center rounded-md"
                style={{ width: 20, height: 20, background: '#0055FF', flexShrink: 0 }}
              >
                <Wrench style={{ width: 11, height: 11, color: '#fff' }} strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
                Hantverksappen
              </span>
            </div>
            {[
              { label: 'Översikt',  active: false },
              { label: 'Jobb',      active: true  },
              { label: 'Offerter',  active: false },
              { label: 'Fakturor',  active: false },
              { label: 'Kunder',    active: false },
            ].map(({ label, active }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                style={{
                  background: active ? 'rgba(0,85,255,0.16)' : 'transparent',
                  color:      active ? '#6699FF' : '#777',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                <span
                  className="rounded-full"
                  style={{ width: 5, height: 5, background: active ? '#0055FF' : '#444', flexShrink: 0 }}
                />
                {label}
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-5" style={{ background: '#F8F8F8' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#111', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  Jobb
                </p>
                <p style={{ fontSize: 11, color: '#999', marginTop: 3 }}>4 aktiva jobb</p>
              </div>
              <button
                className="flex items-center gap-1 rounded-lg text-white"
                style={{ background: '#0055FF', fontSize: 11, fontWeight: 600, padding: '6px 12px' }}
              >
                + Nytt jobb
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {JOBS.map((job) => (
                <div
                  key={job.customer}
                  className="flex items-center gap-3 rounded-xl px-3"
                  style={{ background: '#fff', border: '1px solid #E5E5E5', padding: '8px 12px' }}
                >
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {job.customer}
                    </p>
                    <p style={{ fontSize: 10, color: '#999', marginTop: 1 }}>{job.type}</p>
                  </div>
                  <span
                    style={{
                      fontSize: 10, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 99,
                      background: job.sb, color: job.sc,
                      flexShrink: 0,
                    }}
                  >
                    {job.status}
                  </span>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#111', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                    {job.amount}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating card: paid invoice */}
      <div
        className="absolute hidden md:block"
        style={{
          bottom: -20, left: -24,
          background: '#fff',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.09)',
          borderRadius: 14,
          padding: '12px 14px',
          width: 196,
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ width: 28, height: 28, background: '#F0FFF4', flexShrink: 0 }}
          >
            <Check style={{ width: 13, height: 13, color: '#16A34A' }} strokeWidth={3} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#111', lineHeight: 1 }}>Faktura betald</p>
            <p style={{ fontSize: 10, color: '#999', marginTop: 2 }}>Svenssons Fastighet AB</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 10, color: '#BBB' }}>ROT inkluderat</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#111', fontVariantNumeric: 'tabular-nums' }}>34 500 kr</span>
        </div>
      </div>

      {/* Floating card: ROT badge */}
      <div
        className="absolute hidden md:block"
        style={{
          top: -16, right: -16,
          background: '#0055FF',
          boxShadow: '0 8px 28px rgba(0,85,255,0.32)',
          borderRadius: 14,
          padding: '10px 14px',
        }}
      >
        <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.65)', lineHeight: 1, marginBottom: 3 }}>
          ROT-avdrag
        </p>
        <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1, letterSpacing: '-0.02em' }}>
          -2 100 kr
        </p>
        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>
          Beraknat automatiskt
        </p>
      </div>
    </div>
  )
}

// ─── Pricing card ─────────────────────────────────────────────────────────────

function PricingCard({ name, price, period, description, features, featured, cta, delay, onSignup }) {
  return (
    <motion.div
      {...fadeUp(delay)}
      className="relative flex flex-col rounded-2xl"
      style={{
        padding: 28,
        background: featured ? '#0055FF' : '#fff',
        border: `1px solid ${featured ? 'transparent' : '#E5E5E5'}`,
        boxShadow: featured
          ? '0 24px 64px rgba(0,85,255,0.28), 0 8px 24px rgba(0,85,255,0.16)'
          : '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      {featured && (
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: -12,
            background: '#fff',
            color: '#0055FF',
            fontSize: 11,
            fontWeight: 800,
            padding: '4px 12px',
            borderRadius: 99,
            whiteSpace: 'nowrap',
          }}
        >
          Popularast
        </div>
      )}

      <p
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: featured ? 'rgba(255,255,255,0.65)' : '#888',
          marginBottom: 6,
        }}
      >
        {name}
      </p>

      <div className="flex items-baseline gap-1 mb-2">
        <span
          style={{
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            color: featured ? '#fff' : '#111',
          }}
        >
          {price}
        </span>
        {period && (
          <span style={{ fontSize: 14, color: featured ? 'rgba(255,255,255,0.55)' : '#AAA' }}>
            {period}
          </span>
        )}
      </div>

      <p
        style={{
          fontSize: 13,
          lineHeight: 1.6,
          color: featured ? 'rgba(255,255,255,0.65)' : '#777',
          marginBottom: 24,
        }}
      >
        {description}
      </p>

      <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, flex: 1 }}>
        {features.map(f => (
          <li key={f} className="flex items-start gap-2.5">
            <Check
              style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1, color: featured ? 'rgba(255,255,255,0.8)' : '#0055FF' }}
              strokeWidth={2.5}
            />
            <span style={{ fontSize: 13, color: featured ? 'rgba(255,255,255,0.85)' : '#555' }}>
              {f}
            </span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSignup}
        className={featured ? 'btn-plan-featured' : 'btn-plan'}
      >
        {cta}
      </button>
    </motion.div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const reduce = useReducedMotion()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const TRADE_LABELS = [
    'Rörmokare', 'Elektriker', 'Målare', 'Snickare', 'Städare',
    'VVS-tekniker', 'Plattsättare', 'Golvläggare', 'Fasadmålare', 'Murare',
  ]

  const PLANS = [
    {
      name: 'Start',
      price: '0 kr',
      period: '',
      description: '60 dagars provperiod med alla funktioner. Inget kreditkort krävs.',
      features: ['Offerter med ROT och RUT', 'Jobbhantering', 'Fakturor och PDF-export', 'E-postsupport'],
      featured: false,
      cta: 'Kom igång gratis',
    },
    {
      name: 'Proffs',
      price: '249 kr',
      period: '/mån',
      description: 'För aktiva hantverkare som vill spara tid varje dag.',
      features: ['Allt i Start', 'Obegränsade kunder', 'Fortnox-export', 'Anpassad logotyp på PDF', 'Prioriterad support'],
      featured: true,
      cta: 'Starta provperiod',
    },
    {
      name: 'Företag',
      price: '549 kr',
      period: '/mån',
      description: 'För team med upp till 10 anställda och hög faktureringsvolym.',
      features: ['Allt i Proffs', 'Upp till 10 användare', 'Flera projektledare', 'API-åtkomst', 'Dedikerad support'],
      featured: false,
      cta: 'Starta provperiod',
    },
  ]

  return (
    <MotionConfig reducedMotion="user">
    <div
      className="min-h-screen antialiased"
      style={{ background: '#060A14', color: '#111', fontFamily: '"Geist Variable", Geist, system-ui, sans-serif' }}
    >
      <style>{HOME_CSS}</style>

      {/* ─── Navbar ─────────────────────────────────────────────────────────── */}
      <header
        className="fixed inset-x-0 top-0 z-50"
        style={{
          transition: 'background 300ms, border-color 300ms, backdrop-filter 300ms',
          background: scrolled ? 'rgba(255,255,255,0.88)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px) saturate(160%)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(160%)' : 'none',
          borderBottom: `1px solid ${scrolled ? '#E5E5E5' : 'transparent'}`,
        }}
      >
        <div
          className="flex items-center justify-between px-6"
          style={{ maxWidth: 1280, margin: '0 auto', height: 64 }}
        >
          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 outline-none"
          >
            <div
              className="flex items-center justify-center rounded-xl"
              style={{ width: 32, height: 32, background: '#0055FF', flexShrink: 0 }}
            >
              <Wrench style={{ width: 15, height: 15, color: '#fff' }} strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#111', letterSpacing: '-0.02em' }}>
              Hantverksappen
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: 'Funktioner', href: '#features' },
              { label: 'ROT & RUT',  href: '#rotrut'   },
              { label: 'Hur det fungerar', href: '#how' },
              { label: 'Priser',     href: '#pricing'  },
            ].map(({ label, href }) => (
              <a key={href} href={href} className="nav-link">{label}</a>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              style={{
                fontSize: 14, fontWeight: 500, color: '#555',
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '8px 14px', borderRadius: 8, transition: 'color 150ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#111' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#555' }}
            >
              Logga in
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="btn-primary"
              style={{ fontSize: 14, padding: '9px 18px', borderRadius: 10 }}
            >
              Kom igång gratis
              <ArrowRight style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="md:hidden p-2 rounded-lg"
            style={{ color: '#555', background: 'none', border: 'none', cursor: 'pointer' }}
            aria-label={menuOpen ? 'Stäng meny' : 'Öppna meny'}
          >
            {menuOpen ? <X style={{ width: 20, height: 20 }} /> : <Menu style={{ width: 20, height: 20 }} />}
          </button>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div style={{ background: '#fff', borderTop: '1px solid #E5E5E5' }}>
            {[
              { label: 'Funktioner', href: '#features' },
              { label: 'ROT & RUT',  href: '#rotrut'   },
              { label: 'Hur det fungerar', href: '#how' },
              { label: 'Priser',     href: '#pricing'  },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'block', padding: '14px 24px',
                  fontSize: 15, fontWeight: 500, color: '#333',
                  borderBottom: '1px solid #F5F5F5', textDecoration: 'none',
                }}
              >
                {label}
              </a>
            ))}
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => navigate('/login')}
                style={{
                  width: '100%', padding: '12px', borderRadius: 10,
                  fontSize: 14, fontWeight: 600, color: '#111',
                  background: '#F5F5F5', border: 'none', cursor: 'pointer',
                }}
              >
                Logga in
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', borderRadius: 10 }}
              >
                Kom igång gratis
              </button>
            </div>
          </div>
        )}
      </header>


      {/* ─── Hero ───────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ minHeight: '100dvh', background: '#fff' }}
      >
        {/* Subtle grid */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,0,0,0.045) 1px, transparent 1px),' +
              'linear-gradient(90deg, rgba(0,0,0,0.045) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            maskImage: 'radial-gradient(ellipse 90% 60% at 50% 0%, black 0%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 90% 60% at 50% 0%, black 0%, transparent 100%)',
          }}
        />

        <div
          className="relative flex flex-col lg:flex-row items-center lg:items-start gap-12 lg:gap-16 px-6"
          style={{ maxWidth: 1280, margin: '0 auto', paddingTop: 'clamp(80px, 8vw, 96px)', paddingBottom: 'clamp(64px, 6vw, 96px)' }}
        >
          {/* Left: copy */}
          <div style={{ flex: '1 1 0', minWidth: 0, maxWidth: 600 }}>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 700, color: '#0055FF',
                  background: '#EEF4FF', border: '1px solid #B8CFFF',
                  padding: '5px 12px', borderRadius: 99, marginBottom: 28,
                }}
              >
                Byggt för svenska hantverkare
              </span>
            </motion.div>

            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.05, ease: EASE }}
              style={{
                fontSize: 'clamp(38px, 4.2vw, 60px)',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                lineHeight: 1.0,
                color: '#111',
                marginBottom: 24,
                textWrap: 'balance',
              }}
            >
              Mer tid på jobbet.{' '}
              <span style={{ color: '#0055FF' }}>Mindre tid på pappren.</span>
            </motion.h1>

            <motion.p
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.13, ease: EASE }}
              style={{
                fontSize: 18, lineHeight: 1.65, color: '#666',
                maxWidth: '42ch', marginBottom: 36,
              }}
            >
              Offerter med ROT och RUT, jobbstatus och fakturor i ett system.
              Designat för rörmokare, elektriker och alla som lever av sitt hantverk.
            </motion.p>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}
            >
              <button
                onClick={() => navigate('/signup')}
                className="btn-primary"
              >
                Kom igång gratis
                <ArrowRight style={{ width: 16, height: 16 }} />
              </button>
              <a href="#how" className="btn-secondary">
                Se hur det fungerar
              </a>
            </motion.div>
          </div>

          {/* Right: product UI preview */}
          <motion.div
            initial={reduce ? false : { opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.18, ease: EASE }}
            style={{
              flex: '1 1 0',
              minWidth: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              paddingTop: 'clamp(0px, 3vw, 48px)',
            }}
          >
            <ProductPreview />
          </motion.div>
        </div>
      </section>


      {/* ─── Social proof bar ───────────────────────────────────────────────── */}
      <section
        style={{
          background: '#F5F5F5',
          borderTop: '1px solid #E5E5E5',
          borderBottom: '1px solid #E5E5E5',
          padding: '20px 0',
          overflow: 'hidden',
        }}
      >
        <div
          className="flex items-center gap-4 px-6 mb-3"
          style={{ maxWidth: 1280, margin: '0 auto' }}
        >
          <p style={{ fontSize: 12, fontWeight: 600, color: '#AAA', whiteSpace: 'nowrap' }}>
            Används av hantverkare i hela Sverige
          </p>
          <div style={{ flex: 1, height: 1, background: '#E5E5E5' }} />
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div className="marquee-track">
            {[...TRADE_LABELS, ...TRADE_LABELS].map((label, i) => (
              <div
                key={i}
                className="flex items-center gap-2"
                style={{
                  flexShrink: 0,
                  background: '#fff',
                  border: '1px solid #E5E5E5',
                  borderRadius: 99,
                  padding: '7px 14px',
                  margin: '0 6px',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#555',
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{ width: 6, height: 6, background: '#0055FF', borderRadius: '50%', flexShrink: 0 }}
                />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ─── Features bento ─────────────────────────────────────────────────── */}
      <section id="features" style={{ background: '#fff', padding: 'clamp(64px, 8vw, 120px) 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>

          <motion.div {...fadeUp(0)} style={{ marginBottom: 56 }}>
            <h2
              style={{
                fontSize: 'clamp(32px, 4vw, 52px)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
                color: '#111',
                marginBottom: 16,
                textWrap: 'balance',
              }}
            >
              Allt du behöver.{' '}
              <span style={{ color: '#0055FF' }}>Inget du inte behöver.</span>
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: '#666', maxWidth: '44ch' }}>
              Tre kärnfunktioner som tar dig från offert till betald faktura utan onödig administration.
            </p>
          </motion.div>

          {/* Bento grid: 5-col on desktop */}
          <div
            className="grid grid-cols-1 lg:grid-cols-5 gap-4"
          >
            {/* Large card: Offerter */}
            <motion.div
              {...fadeUp(0.05)}
              className="lg:col-span-3 relative overflow-hidden rounded-2xl"
              style={{ background: '#F5F5F5', minHeight: 360, padding: 32 }}
            >
              <div
                className="inline-flex items-center justify-center rounded-xl"
                style={{ width: 44, height: 44, background: '#EEF4FF', marginBottom: 20 }}
              >
                <FileText style={{ width: 20, height: 20, color: '#0055FF' }} strokeWidth={1.5} />
              </div>
              <h3
                style={{
                  fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em',
                  color: '#111', marginBottom: 10, lineHeight: 1.1,
                }}
              >
                Professionella offerter
              </h3>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: '#666', maxWidth: '36ch' }}>
                Skapa och skicka offerter på minuter. ROT och RUT beräknas automatiskt.
                Kunden godkänner med ett klick.
              </p>

              {/* Inset invoice card */}
              <div
                className="absolute bottom-0 right-0 rounded-tl-2xl"
                style={{
                  background: '#fff',
                  border: '1px solid #E5E5E5',
                  borderRight: 'none',
                  borderBottom: 'none',
                  width: 210,
                  padding: 18,
                }}
              >
                <p
                  style={{
                    fontSize: 10, fontWeight: 700, color: '#BBB',
                    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12,
                  }}
                >
                  Offert
                </p>
                {[
                  { label: 'Rörarbete 10 tim', amount: '7 000 kr' },
                  { label: 'Installationsmaterial',   amount: '4 500 kr' },
                ].map(({ label, amount }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between"
                    style={{ marginBottom: 8 }}
                  >
                    <span style={{ fontSize: 11, color: '#888' }}>{label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{amount}</span>
                  </div>
                ))}
                <div
                  className="flex items-center justify-between"
                  style={{
                    background: '#F0FFF4', border: '1px solid #BBF7D0',
                    borderRadius: 8, padding: '6px 10px', marginTop: 10,
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#16A34A' }}>ROT-avdrag</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#16A34A', fontVariantNumeric: 'tabular-nums' }}>-2 100 kr</span>
                </div>
              </div>
            </motion.div>

            {/* Right stack */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {/* Jobbhantering - dark */}
              <motion.div
                {...fadeUp(0.1)}
                className="flex-1 rounded-2xl"
                style={{ background: '#111', padding: 28, minHeight: 170 }}
              >
                <div
                  className="inline-flex items-center justify-center rounded-xl"
                  style={{ width: 44, height: 44, background: 'rgba(0,85,255,0.2)', marginBottom: 18 }}
                >
                  <Briefcase style={{ width: 20, height: 20, color: '#6699FF' }} strokeWidth={1.5} />
                </div>
                <h3
                  style={{
                    fontSize: 20, fontWeight: 800, letterSpacing: '-0.025em',
                    color: '#fff', marginBottom: 10, lineHeight: 1.1,
                  }}
                >
                  Jobbhantering
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: '#888' }}>
                  Alla jobb samlade. Se status i realtid och missa aldrig en deadline.
                </p>
              </motion.div>

              {/* Fakturor - blue tint */}
              <motion.div
                {...fadeUp(0.15)}
                className="flex-1 rounded-2xl"
                style={{ background: '#EEF4FF', padding: 28, minHeight: 170 }}
              >
                <div
                  className="inline-flex items-center justify-center rounded-xl"
                  style={{ width: 44, height: 44, background: '#fff', marginBottom: 18 }}
                >
                  <Receipt style={{ width: 20, height: 20, color: '#0055FF' }} strokeWidth={1.5} />
                </div>
                <h3
                  style={{
                    fontSize: 20, fontWeight: 800, letterSpacing: '-0.025em',
                    color: '#0044CC', marginBottom: 10, lineHeight: 1.1,
                  }}
                >
                  Fakturor
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: '#3366BB' }}>
                  Fakturera direkt när jobbet är klart. PDF, bankgiro och Fortnox-export.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>


      {/* ─── ROT / RUT ──────────────────────────────────────────────────────── */}
      <section
        id="rotrut"
        style={{
          background: '#F5F5F5',
          borderTop: '1px solid #E5E5E5',
          padding: 'clamp(64px, 8vw, 120px) 0',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

            {/* Left */}
            <motion.div {...fadeUp(0)}>
              <p
                style={{
                  fontSize: 11, fontWeight: 800, color: '#0055FF',
                  textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20,
                }}
              >
                ROT &amp; RUT
              </p>
              <h2
                style={{
                  fontSize: 'clamp(30px, 4vw, 48px)',
                  fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05,
                  color: '#111', marginBottom: 20, textWrap: 'balance',
                }}
              >
                Skatteavdraget räknar vi ut åt dig.
              </h2>
              <p style={{ fontSize: 17, lineHeight: 1.65, color: '#666', maxWidth: '40ch', marginBottom: 32 }}>
                Du väljer vilket arbete som är ROT eller RUT. Appen beräknar automatiskt
                kundens 30-procentiga avdrag och sätter rätt belopp på fakturan.
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  'Stöd för ROT och RUT på samma offert',
                  'Rätt belopp beräknas direkt, inga manuella uträkningar',
                  'Fakturan visar exakt vad kunden betalar efter avdrag',
                  'Uppdateras efter Skatteverkets regler',
                ].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div
                      style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: '#F0FFF4', border: '1px solid #BBF7D0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginTop: 1,
                      }}
                    >
                      <Check style={{ width: 10, height: 10, color: '#16A34A' }} strokeWidth={3} />
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 500, color: '#555', lineHeight: 1.5 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Right: Invoice breakdown card */}
            <motion.div {...fadeUp(0.1)}>
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: '#fff',
                  border: '1px solid #E5E5E5',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                }}
              >
                {/* Card header */}
                <div
                  className="flex items-start justify-between"
                  style={{ padding: '20px 24px 18px', borderBottom: '1px solid #F0F0F0' }}
                >
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#BBB', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                      Faktura #2024-047
                    </p>
                    <p style={{ fontSize: 17, fontWeight: 800, color: '#111', letterSpacing: '-0.02em' }}>
                      Lindqvist VVS AB
                    </p>
                  </div>
                  <span
                    className="flex items-center gap-1.5"
                    style={{
                      fontSize: 11, fontWeight: 700,
                      padding: '5px 12px', borderRadius: 99,
                      background: '#F0FFF4', color: '#16A34A',
                      border: '1px solid #BBF7D0',
                    }}
                  >
                    <span style={{ width: 6, height: 6, background: '#16A34A', borderRadius: '50%' }} />
                    ROT
                  </span>
                </div>

                {/* Line items */}
                <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Rörarbete (10 tim x 700 kr)', amount: '7 000 kr', muted: false },
                    { label: 'Installationsmaterial',        amount: '4 500 kr', muted: false },
                    { label: 'Moms 25%',                     amount: '2 875 kr', muted: true  },
                  ].map(({ label, amount, muted }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span style={{ fontSize: 14, fontWeight: 500, color: muted ? '#CCC' : '#666' }}>{label}</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: muted ? '#CCC' : '#333', fontVariantNumeric: 'tabular-nums' }}>{amount}</span>
                    </div>
                  ))}
                </div>

                {/* ROT deduction */}
                <div style={{ margin: '0 20px 16px', borderRadius: 12, background: '#F0FFF4', border: '1px solid #BBF7D0', padding: '12px 14px' }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check style={{ width: 15, height: 15, color: '#16A34A', flexShrink: 0 }} strokeWidth={2.5} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#15803D' }}>ROT-avdrag (30% av arbete)</span>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#15803D', fontVariantNumeric: 'tabular-nums' }}>-2 100 kr</span>
                  </div>
                  <p style={{ fontSize: 11, color: '#22C55E', marginTop: 4, marginLeft: 23 }}>Beräknat automatiskt</p>
                </div>

                {/* Total */}
                <div
                  className="flex items-center justify-between"
                  style={{ margin: '0 20px 20px', borderRadius: 12, background: '#111', padding: '14px 18px' }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Att betala</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em' }}>
                    12 275 kr
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* ─── How it works ───────────────────────────────────────────────────── */}
      <section id="how" style={{ background: '#fff', padding: 'clamp(64px, 8vw, 120px) 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>

          <motion.div {...fadeUp(0)} style={{ marginBottom: 64 }}>
            <h2
              style={{
                fontSize: 'clamp(32px, 4vw, 52px)',
                fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05,
                color: '#111',
              }}
            >
              Tre steg till bättre vardag.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16 relative">
            {/* Connecting line */}
            <div
              aria-hidden="true"
              className="hidden md:block absolute pointer-events-none"
              style={{
                top: 22,
                left: 'calc(33.3% + 24px)',
                right: 'calc(33.3% + 24px)',
                height: 1,
                background: 'linear-gradient(90deg, #E5E5E5, #0055FF55, #E5E5E5)',
              }}
            />

            {[
              {
                icon: FileText,
                label: 'Offert',
                body: 'Välj arbetsmoment och material. ROT och RUT räknas ut automatiskt. Kunden godkänner med ett klick.',
              },
              {
                icon: Briefcase,
                label: 'Jobb',
                body: 'Håll koll på alla pågående och planerade jobb. Se status i realtid direkt från mobilen på arbetsplatsen.',
              },
              {
                icon: Receipt,
                label: 'Faktura',
                body: 'Konvertera godkänd offert till faktura direkt. PDF-export och Fortnox-integration klart ur lådan.',
              },
            ].map(({ icon: Icon, label, body }, i) => (
              <motion.div key={label} {...fadeUp(i * 0.08)}>
                <div
                  className="flex items-center justify-center rounded-2xl"
                  style={{ width: 44, height: 44, background: '#111', marginBottom: 24 }}
                >
                  <Icon style={{ width: 20, height: 20, color: '#fff' }} strokeWidth={1.5} />
                </div>
                <h3
                  style={{
                    fontSize: 20, fontWeight: 800, letterSpacing: '-0.025em',
                    color: '#111', marginBottom: 12, lineHeight: 1.1,
                  }}
                >
                  {label}
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.65, color: '#666', maxWidth: '30ch' }}>
                  {body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ─── Pricing ────────────────────────────────────────────────────────── */}
      <section
        id="pricing"
        style={{
          background: '#F5F5F5',
          borderTop: '1px solid #E5E5E5',
          padding: 'clamp(64px, 8vw, 120px) 0',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>

          <motion.div {...fadeUp(0)} style={{ marginBottom: 56 }}>
            <h2
              style={{
                fontSize: 'clamp(32px, 4vw, 52px)',
                fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05,
                color: '#111', marginBottom: 16,
              }}
            >
              Enkla priser.
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.65, color: '#666', maxWidth: '36ch' }}>
              Börja gratis i 60 dagar. Uppgradera när du är redo.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {PLANS.map((plan, i) => (
              <PricingCard
                key={plan.name}
                {...plan}
                delay={i * 0.07}
                onSignup={() => navigate('/signup')}
              />
            ))}
          </div>

          <motion.p
            {...fadeIn(0.25)}
            style={{ textAlign: 'center', fontSize: 13, color: '#AAA', marginTop: 24 }}
          >
            Alla priser exkl. moms. Avsluta när som helst.
          </motion.p>
        </div>
      </section>


      {/* ─── Final CTA ──────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: '#060A14', padding: 'clamp(80px, 10vw, 140px) 0' }}
      >
        {/* Subtle blue glow */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(ellipse 60% 50% at 50% 110%, rgba(0,85,255,0.14), transparent)',
          }}
        />

        <div
          className="relative text-center px-6"
          style={{ maxWidth: 720, margin: '0 auto' }}
        >
          <motion.h2
            {...fadeUp(0)}
            style={{
              fontSize: 'clamp(40px, 6vw, 72px)',
              fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.0,
              color: '#fff', marginBottom: 20, textWrap: 'balance',
            }}
          >
            Börja spara tid idag.
          </motion.h2>

          <motion.p
            {...fadeUp(0.07)}
            style={{
              fontSize: 18, lineHeight: 1.65,
              color: 'rgba(255,255,255,0.5)',
              maxWidth: '38ch', margin: '0 auto 40px',
            }}
          >
            60 dagar gratis. Inget kreditkort. Avsluta när du vill.
          </motion.p>

          <motion.div
            {...fadeUp(0.13)}
            style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 10 }}
          >
            <button
              onClick={() => navigate('/signup')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#fff', color: '#111',
                fontSize: 15, fontWeight: 700,
                padding: '14px 28px', borderRadius: 12, border: 'none', cursor: 'pointer',
                transition: 'transform 140ms, box-shadow 140ms',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(255,255,255,0.15)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)' }}
              onMouseUp={e => { e.currentTarget.style.transform = '' }}
            >
              Kom igång gratis
              <ArrowRight style={{ width: 16, height: 16 }} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn-ghost"
            >
              Logga in
            </button>
          </motion.div>
        </div>
      </section>


      {/* ─── Footer ─────────────────────────────────────────────────────────── */}
      <footer style={{ background: '#060A14', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div
          style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 24px 48px' }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-12">

            {/* Brand */}
            <div className="col-span-2 sm:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{ width: 30, height: 30, background: '#0055FF', flexShrink: 0 }}
                >
                  <Wrench style={{ width: 14, height: 14, color: '#fff' }} strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                  Hantverksappen
                </span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.35)', maxWidth: '34ch' }}>
                Administration för hantverkare som vill ägna mer tid åt hantverket.
              </p>
            </div>

            {/* Produkt links */}
            <div>
              <p
                style={{
                  fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)',
                  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16,
                }}
              >
                Produkt
              </p>
              {[
                { label: 'Funktioner',       href: '#features' },
                { label: 'ROT och RUT',      href: '#rotrut'   },
                { label: 'Hur det fungerar', href: '#how'      },
                { label: 'Priser',           href: '#pricing'  },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  style={{
                    display: 'block', fontSize: 14,
                    color: 'rgba(255,255,255,0.4)', marginBottom: 10,
                    textDecoration: 'none', transition: 'color 150ms',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
                >
                  {label}
                </a>
              ))}
            </div>

            {/* Konto links */}
            <div>
              <p
                style={{
                  fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)',
                  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16,
                }}
              >
                Konto
              </p>
              {[
                { label: 'Logga in',        onClick: () => navigate('/login')  },
                { label: 'Skapa konto',     onClick: () => navigate('/signup') },
                { label: 'Integritetspolicy', onClick: null },
                { label: 'Kontakt',         onClick: null },
              ].map(({ label, onClick }) => (
                onClick ? (
                  <button
                    key={label}
                    onClick={onClick}
                    style={{
                      display: 'block', fontSize: 14, textAlign: 'left',
                      color: 'rgba(255,255,255,0.4)', marginBottom: 10,
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: 0, transition: 'color 150ms',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
                  >
                    {label}
                  </button>
                ) : (
                  <a
                    key={label}
                    href="#"
                    style={{
                      display: 'block', fontSize: 14,
                      color: 'rgba(255,255,255,0.4)', marginBottom: 10,
                      textDecoration: 'none', transition: 'color 150ms',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
                  >
                    {label}
                  </a>
                )
              ))}
            </div>
          </div>

          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>
              © 2026 Hantverksappen. Alla rättigheter förbehållna.
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>
              Tillverkad med omsorg i Sverige
            </p>
          </div>
        </div>
      </footer>

    </div>
    </MotionConfig>
  )
}
