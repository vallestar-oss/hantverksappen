import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, Briefcase, Receipt, ArrowRight,
  Check, Wrench, Menu, X,
} from 'lucide-react'

// ─── Motion helpers ────────────────────────────────────────────────────────────

const EASE = [0.22, 1, 0.36, 1]

function up(delay = 0) {
  return {
    initial: { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-48px' },
    transition: { duration: 0.55, delay, ease: EASE },
  }
}

function fade(delay = 0) {
  return {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true, margin: '-48px' },
    transition: { duration: 0.5, delay, ease: EASE },
  }
}

// ─── Divider ───────────────────────────────────────────────────────────────────

function HR() {
  return <hr className="border-slate-100" />
}

// ─── Eyebrow label ─────────────────────────────────────────────────────────────

function Eyebrow({ children }) {
  return (
    <p className="inline-flex items-center gap-2 text-[13px] font-semibold tracking-widest uppercase text-blue-600">
      <span className="inline-block w-3.5 h-px bg-blue-600" />
      {children}
    </p>
  )
}

// ─── Feature card ──────────────────────────────────────────────────────────────

function FeatureCard({ icon: Icon, iconBg, title, description, delay }) {
  return (
    <motion.div {...up(delay)}
      className="group bg-white rounded-xl border border-slate-100 p-8
                 hover:border-slate-300 transition-all duration-300"
    >
      <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl mb-6 ${iconBg}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-[17px] font-semibold text-slate-900 mb-3 leading-snug">{title}</h3>
      <p className="text-[15px] text-slate-500 leading-relaxed">{description}</p>
    </motion.div>
  )
}

// ─── Stat ──────────────────────────────────────────────────────────────────────

function Stat({ value, label, delay }) {
  return (
    <motion.div {...up(delay)} className="text-center">
      <p className="text-4xl sm:text-5xl font-bold text-white tabular-nums tracking-tight">{value}</p>
      <p className="mt-2 text-[14px] text-slate-400 font-medium">{label}</p>
    </motion.div>
  )
}

// ─── Device mockups ────────────────────────────────────────────────────────────

function LaptopMockup() {
  return (
    <div className="relative inline-block" style={{ width: 540, maxWidth: '100%' }}>
      {/* Outer frame */}
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #d0d0d0 0%, #b8b8b8 50%, #c8c8c8 100%)',
          padding: '10px 10px 0 10px',
          boxShadow: '0 32px 64px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.12)',
        }}
      >
        {/* Screen bezel */}
        <div
          className="rounded-t-lg overflow-hidden"
          style={{ background: '#1a1a1a', padding: '6px 6px 0 6px' }}
        >
          {/* Camera dot */}
          <div className="flex justify-center mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
          </div>

          {/* Screen content */}
          <div
            className="rounded-t-sm overflow-hidden"
            style={{ background: '#111111', aspectRatio: '16/10' }}
          >
            <div className="flex h-full">
              {/* Sidebar */}
              <div className="flex-shrink-0 flex flex-col gap-1 p-3" style={{ width: '18%', background: '#1a1a1a' }}>
                {/* Logo area */}
                <div className="flex items-center gap-1.5 mb-3 px-1">
                  <div className="w-4 h-4 rounded bg-blue-600 flex-shrink-0" />
                  <div className="h-2 rounded-full flex-1 bg-gray-700" />
                </div>
                {/* Nav items */}
                {[true, false, false, false, false].map((active, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-2 py-1.5 rounded"
                    style={{ background: active ? '#0055FF22' : 'transparent' }}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                      style={{ background: active ? '#0055FF' : '#444' }}
                    />
                    <div
                      className="h-1.5 rounded-full flex-1"
                      style={{ background: active ? '#0055FF88' : '#333' }}
                    />
                  </div>
                ))}
              </div>

              {/* Content area */}
              <div className="flex-1 p-3 overflow-hidden" style={{ background: '#F8F8F8' }}>
                {/* Top bar */}
                <div className="flex items-center justify-between mb-3">
                  <div className="h-3 w-20 rounded-full bg-gray-800 opacity-80" />
                  <div className="h-5 w-16 rounded-md" style={{ background: '#0055FF' }} />
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {[
                    { bg: '#EEF4FF', accent: '#0055FF' },
                    { bg: '#FFF8EE', accent: '#F59E0B' },
                    { bg: '#F0FFF4', accent: '#22C55E' },
                    { bg: '#F5F5F5', accent: '#94A3B8' },
                  ].map((c, i) => (
                    <div key={i} className="rounded-lg p-2" style={{ background: c.bg }}>
                      <div className="w-3 h-3 rounded-sm mb-1.5" style={{ background: c.accent, opacity: 0.8 }} />
                      <div className="h-2.5 w-8 rounded-full mb-1" style={{ background: c.accent, opacity: 0.7 }} />
                      <div className="h-1.5 w-12 rounded-full" style={{ background: c.accent, opacity: 0.25 }} />
                    </div>
                  ))}
                </div>

                {/* List rows */}
                <div className="space-y-1.5">
                  {[
                    { dot: '#0055FF', w1: 32, w2: 24 },
                    { dot: '#22C55E', w1: 44, w2: 32 },
                    { dot: '#F59E0B', w1: 28, w2: 20 },
                    { dot: '#94A3B8', w1: 38, w2: 28 },
                  ].map((row, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                      style={{ background: 'white', border: '1px solid #E5E7EB' }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: row.dot }} />
                      <div className="flex-1 flex gap-2">
                        <div className="h-2 rounded-full" style={{ width: row.w1, background: '#374151' }} />
                        <div className="h-2 rounded-full" style={{ width: row.w2, background: '#D1D5DB' }} />
                      </div>
                      <div className="h-2 w-10 rounded-full" style={{ background: '#E5E7EB' }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard hint bar */}
        <div
          className="h-4 rounded-b-sm"
          style={{ background: 'linear-gradient(to bottom, #c0c0c0, #a8a8a8)' }}
        />
      </div>

      {/* Base / hinge */}
      <div
        className="mx-auto rounded-b-xl"
        style={{
          height: 8,
          width: '90%',
          background: 'linear-gradient(to bottom, #b0b0b0, #989898)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      />
    </div>
  )
}

function PhoneMockup({ size = 'lg' }) {
  const isSmall = size === 'sm'
  const w = isSmall ? 120 : 200
  const h = isSmall ? 216 : 360

  return (
    <div
      className="relative inline-block rounded-3xl overflow-hidden flex-shrink-0"
      style={{
        width: w,
        height: h,
        background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%)',
        border: '2px solid #333',
        boxShadow: isSmall
          ? '0 12px 32px rgba(0,0,0,0.25)'
          : '0 24px 56px rgba(0,0,0,0.30), 0 8px 24px rgba(0,0,0,0.18)',
        padding: isSmall ? 4 : 6,
      }}
    >
      {/* Notch */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl z-10"
        style={{
          width: isSmall ? 36 : 60,
          height: isSmall ? 10 : 16,
          background: '#1a1a1a',
        }}
      />

      {/* Screen */}
      <div
        className="relative w-full h-full rounded-2xl overflow-hidden flex flex-col"
        style={{ background: '#F8F8F8' }}
      >
        {/* Status bar space */}
        <div style={{ height: isSmall ? 12 : 20 }} />

        {/* Content */}
        <div className="flex-1 p-2 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div
              className="rounded-full"
              style={{ height: isSmall ? 6 : 10, width: isSmall ? 28 : 48, background: '#111' }}
            />
            <div
              className="rounded-md"
              style={{
                height: isSmall ? 10 : 18,
                width: isSmall ? 20 : 32,
                background: '#0055FF',
              }}
            />
          </div>

          {/* Job cards */}
          {[
            { dot: '#0055FF', badge: '#EEF4FF' },
            { dot: '#22C55E', badge: '#F0FFF4' },
            { dot: '#F59E0B', badge: '#FFF8EE' },
          ].slice(0, isSmall ? 2 : 3).map((card, i) => (
            <div
              key={i}
              className="rounded-xl mb-1.5 p-2"
              style={{
                background: 'white',
                border: '1px solid #E5E7EB',
                padding: isSmall ? '4px 6px' : '8px 10px',
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div
                  className="rounded-full flex-shrink-0"
                  style={{ width: isSmall ? 4 : 6, height: isSmall ? 4 : 6, background: card.dot }}
                />
                <div
                  className="rounded-full flex-1"
                  style={{ height: isSmall ? 4 : 7, background: '#374151' }}
                />
              </div>
              <div className="flex items-center gap-1">
                <div
                  className="rounded-full"
                  style={{ height: isSmall ? 3 : 5, width: isSmall ? 28 : 48, background: '#D1D5DB' }}
                />
                <div
                  className="rounded-full ml-auto"
                  style={{
                    height: isSmall ? 8 : 14,
                    width: isSmall ? 16 : 28,
                    background: card.badge,
                    border: `1px solid ${card.dot}33`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom nav */}
        <div
          className="flex items-center justify-around"
          style={{
            height: isSmall ? 24 : 40,
            background: 'white',
            borderTop: '1px solid #E5E7EB',
          }}
        >
          {[true, false, false, false].map((active, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div
                className="rounded-sm"
                style={{
                  width: isSmall ? 10 : 16,
                  height: isSmall ? 10 : 16,
                  background: active ? '#0055FF' : '#D1D5DB',
                  borderRadius: isSmall ? 2 : 3,
                }}
              />
              {!isSmall && (
                <div className="rounded-full" style={{ width: 20, height: 3, background: active ? '#0055FF55' : '#E5E7EB' }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function QuoteSnippet({ size = 'sm' }) {
  const w = 120, h = 216
  return (
    <div
      className="relative inline-block rounded-3xl overflow-hidden flex-shrink-0"
      style={{
        width: w, height: h,
        background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
        border: '2px solid #333',
        boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
        padding: 4,
      }}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl z-10"
        style={{ width: 36, height: 10, background: '#1a1a1a' }} />
      <div className="w-full h-full rounded-2xl overflow-hidden flex flex-col"
        style={{ background: '#F8F8F8' }}>
        <div style={{ height: 12 }} />
        <div className="flex-1 p-2 overflow-hidden">
          <div className="h-1.5 w-16 rounded-full bg-gray-800 mb-2 opacity-80" />
          {[
            { label: 60, amount: 28 },
            { label: 44, amount: 24 },
            { label: 52, amount: 20 },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between mb-1.5 px-1.5 py-1 rounded-lg bg-white"
              style={{ border: '1px solid #E5E7EB' }}>
              <div className="h-1.5 rounded-full bg-gray-400" style={{ width: row.label }} />
              <div className="h-1.5 rounded-full bg-gray-700" style={{ width: row.amount }} />
            </div>
          ))}
          {/* ROT badge */}
          <div className="mt-2 rounded-lg p-1.5" style={{ background: '#F0FFF4', border: '1px solid #BBF7D0' }}>
            <div className="h-1.5 w-20 rounded-full" style={{ background: '#22C55E', opacity: 0.7 }} />
            <div className="h-1.5 w-14 rounded-full mt-1" style={{ background: '#22C55E', opacity: 0.4 }} />
          </div>
          {/* Total */}
          <div className="mt-2 rounded-lg p-1.5" style={{ background: '#111' }}>
            <div className="flex justify-between">
              <div className="h-2 w-12 rounded-full bg-gray-500" />
              <div className="h-2 w-16 rounded-full bg-white opacity-80" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-around" style={{ height: 24, background: 'white', borderTop: '1px solid #E5E7EB' }}>
          {[true, false, false, false].map((active, i) => (
            <div key={i} className="rounded-sm w-2.5 h-2.5"
              style={{ background: active ? '#0055FF' : '#D1D5DB', borderRadius: 2 }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function InvoiceSnippet() {
  return (
    <div
      className="relative inline-block rounded-3xl overflow-hidden flex-shrink-0"
      style={{
        width: 120, height: 216,
        background: 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
        border: '2px solid #333',
        boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
        padding: 4,
      }}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl z-10"
        style={{ width: 36, height: 10, background: '#1a1a1a' }} />
      <div className="w-full h-full rounded-2xl overflow-hidden flex flex-col"
        style={{ background: '#F8F8F8' }}>
        <div style={{ height: 12 }} />
        <div className="flex-1 p-2 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="h-1.5 w-14 rounded-full bg-gray-800 opacity-80" />
            <div className="h-4 w-10 rounded-full" style={{ background: '#EEF4FF', border: '1px solid #BFDBFE' }}>
              <div className="h-1.5 w-6 mx-auto mt-1 rounded-full" style={{ background: '#0055FF', opacity: 0.6 }} />
            </div>
          </div>
          {[40, 52, 36].map((w, i) => (
            <div key={i} className="flex items-center justify-between mb-1 px-1.5 py-1 rounded-lg bg-white"
              style={{ border: '1px solid #E5E7EB' }}>
              <div className="h-1.5 rounded-full bg-gray-400" style={{ width: w }} />
              <div className="h-1.5 rounded-full bg-gray-600" style={{ width: 22 }} />
            </div>
          ))}
          <div className="mt-2 rounded-lg p-1.5" style={{ background: '#F0FFF4', border: '1px solid #BBF7D0' }}>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#22C55E' }} />
              <div className="h-1.5 w-16 rounded-full" style={{ background: '#22C55E', opacity: 0.6 }} />
            </div>
          </div>
          <div className="mt-1.5 rounded-lg p-1.5" style={{ background: '#111' }}>
            <div className="flex justify-between">
              <div className="h-2 w-10 rounded-full bg-gray-500" />
              <div className="h-2 w-14 rounded-full bg-white opacity-80" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-around" style={{ height: 24, background: 'white', borderTop: '1px solid #E5E7EB' }}>
          {[false, false, true, false].map((active, i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-sm"
              style={{ background: active ? '#0055FF' : '#D1D5DB', borderRadius: 2 }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-xl border-b border-slate-100'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-[15px] text-slate-900 tracking-tight">
              Hantverksappen
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features"
              className="text-[14px] text-slate-500 hover:text-slate-900 transition-colors font-medium">
              Funktioner
            </a>
            <a href="#rotrut"
              className="text-[14px] text-slate-500 hover:text-slate-900 transition-colors font-medium">
              ROT & RUT
            </a>
            <a href="#pricing"
              className="text-[14px] text-slate-500 hover:text-slate-900 transition-colors font-medium">
              Priser
            </a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-[14px] font-medium text-slate-600 hover:text-slate-900 transition-colors px-4 py-2 rounded-lg hover:bg-slate-50"
            >
              Logga in
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-primary-dark active:bg-primary-darker text-white text-[14px] font-semibold px-5 py-2.5 rounded-xl transition-all "
            >
              Kom igång gratis
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label={menuOpen ? 'Stäng meny' : 'Öppna meny'}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 divide-y divide-slate-50">
            {[
              { label: 'Funktioner', href: '#features' },
              { label: 'ROT & RUT', href: '#rotrut' },
              { label: 'Priser', href: '#pricing' },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="block px-6 py-4 text-[15px] font-medium text-slate-700"
              >
                {label}
              </a>
            ))}
            <div className="p-4 space-y-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full text-[14px] font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 py-3 rounded-xl transition-colors"
              >
                Logga in
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="w-full text-[14px] font-semibold text-white bg-blue-600 hover:bg-primary-dark py-3 rounded-xl transition-colors"
              >
                Kom igång gratis
              </button>
              <p className="text-center text-[12px] font-medium" style={{ color: '#666666' }}>
                ✓ 60 dagar gratis — inget kreditkort krävs
              </p>
            </div>
          </div>
        )}
      </header>


      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-40 pb-28 sm:pt-48 sm:pb-36 overflow-hidden">

        {/* Subtle dot grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #E5E5E5 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            opacity: 0.55,
          }}
        />
        <div className="relative max-w-4xl mx-auto px-6 text-center">

          {/* Eyebrow */}
          <motion.div {...up(0)} className="flex justify-center mb-8">
            <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-4 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Byggt för svenska hantverkare
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1 {...up(0.07)}
            className="text-5xl sm:text-6xl lg:text-[72px] font-bold text-slate-900 leading-[1.06] tracking-[-0.03em] mb-7"
          >
            Mer tid på jobbet.
            <br />
            <span className="text-blue-600">Mindre tid på pappren.</span>
          </motion.h1>

          {/* Sub */}
          <motion.p {...up(0.13)}
            className="text-xl sm:text-[21px] text-slate-500 leading-relaxed max-w-2xl mx-auto mb-10 font-normal"
          >
            Offerter med ROT&nbsp;/&nbsp;RUT, jobbstatus och fakturor — allt på ett ställe.
            Designat för hantverkaren som vill fokusera på hantverket.
          </motion.p>

          {/* CTA row */}
          <motion.div {...up(0.18)} className="flex flex-col items-center mb-12">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
              <button
                onClick={() => navigate('/signup')}
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-primary-dark active:bg-primary-darker text-white font-semibold text-[16px] px-8 py-4 rounded-xl transition-all hover:-translate-y-px"
              >
                Kom igång gratis
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <a
                href="#features"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-slate-700 font-semibold text-[16px] px-8 py-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                Se hur det fungerar
              </a>
            </div>
            <p className="mt-3 text-[13px] font-medium" style={{ color: '#666666' }}>
              ✓ 60 dagar gratis — inget kreditkort krävs
            </p>
          </motion.div>

          {/* Trust strip */}
          <motion.div {...fade(0.28)}
            className="inline-flex items-center gap-6 text-[13px] text-slate-400 font-medium"
          >
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-blue-600" strokeWidth={3} />
              60 dagar gratis
            </span>
            <span className="w-px h-3.5 bg-slate-200" />
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-blue-600" strokeWidth={3} />
              Inget kreditkort
            </span>
            <span className="w-px h-3.5 bg-slate-200" />
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-blue-600" strokeWidth={3} />
              GDPR-säkert
            </span>
          </motion.div>
        </div>

        {/* Dashboard preview card */}
        <motion.div {...up(0.24)} className="relative max-w-3xl mx-auto mt-20 px-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

            {/* Window bar */}
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-3.5 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
              <div className="flex-1 mx-4">
                <div className="w-44 h-4 bg-slate-100 rounded-md mx-auto" />
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {/* Header row */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="w-28 h-5 bg-slate-900 rounded-md opacity-90" />
                  <div className="w-36 h-3.5 bg-slate-200 rounded-md mt-2" />
                </div>
                <div className="w-28 h-9 bg-blue-600 rounded-lg opacity-90" />
              </div>

              {/* Stat row */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                  { bg: 'bg-blue-50', bar1: 'bg-blue-600', bar2: 'bg-blue-200', w1: 'w-8', w2: 'w-14' },
                  { bg: 'bg-amber-50', bar1: 'bg-amber-500', bar2: 'bg-amber-200', w1: 'w-6', w2: 'w-10' },
                  { bg: 'bg-slate-50', bar1: 'bg-slate-400', bar2: 'bg-slate-200', w1: 'w-10', w2: 'w-16' },
                  { bg: 'bg-green-50', bar1: 'bg-green-500', bar2: 'bg-green-200', w1: 'w-12', w2: 'w-20' },
                ].map((c, i) => (
                  <div key={i} className={`${c.bg} rounded-xl p-3.5 border border-white`}>
                    <div className={`${c.bar1} w-3 h-3 rounded-sm mb-3 opacity-80`} />
                    <div className={`${c.bar1} ${c.w1} h-5 rounded-md mb-1.5 opacity-80`} />
                    <div className={`${c.bar2} ${c.w2} h-2.5 rounded-full`} />
                  </div>
                ))}
              </div>

              {/* Table rows */}
              <div className="space-y-2.5">
                {[
                  { dot: 'bg-blue-500', w: 'w-36', sub: 'w-24', badge: 'bg-blue-50 w-14', amount: 'w-16' },
                  { dot: 'bg-green-500', w: 'w-48', sub: 'w-28', badge: 'bg-green-50 w-12', amount: 'w-20' },
                  { dot: 'bg-amber-500', w: 'w-32', sub: 'w-20', badge: 'bg-amber-50 w-16', amount: 'w-14' },
                ].map((row, i) => (
                  <div key={i}
                    className="flex items-center gap-4 bg-slate-50/70 rounded-xl px-4 py-3.5 border border-slate-100"
                  >
                    <span className={`w-2 h-2 rounded-full ${row.dot} flex-shrink-0`} />
                    <div className="flex-1 flex items-center gap-4">
                      <div>
                        <div className={`${row.w} h-3 bg-slate-700 rounded-full`} />
                        <div className={`${row.sub} h-2.5 bg-slate-200 rounded-full mt-1.5`} />
                      </div>
                    </div>
                    <div className={`${row.badge} h-5 rounded-full`} />
                    <div className={`${row.amount} h-3.5 bg-slate-300 rounded-full`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating badge */}
          <div className="absolute -bottom-4 -right-2 sm:right-4 bg-white border border-slate-100 rounded-xl px-5 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-success" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-slate-800 leading-tight">Faktura skickad</p>
              <p className="text-[12px] text-slate-400 mt-0.5">Lindqvist VVS · 23&nbsp;450&nbsp;kr</p>
            </div>
          </div>
        </motion.div>
      </section>


      {/* ── Device showcase ────────────────────────────────────────────────── */}
      <section className="py-24 sm:py-36 overflow-hidden" style={{ background: '#F5F5F5' }}>
        <div className="max-w-6xl mx-auto px-6">

          {/* Heading */}
          <motion.div {...up(0)} className="text-center mb-16">
            <Eyebrow>Se appen i action</Eyebrow>
            <h2 className="mt-5 text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1]">
              Allt du behöver,
              <br />alltid tillgängligt
            </h2>
            <p className="mt-5 text-[17px] text-slate-500 leading-relaxed">
              Fungerar på dator, surfplatta och mobil
            </p>
          </motion.div>

          {/* Mockup composition */}
          <motion.div {...up(0.1)}>
            {/* Desktop: laptop + phone overlapping */}
            <div className="hidden md:flex items-end justify-center gap-0 relative">
              <div className="relative z-10">
                <LaptopMockup />
              </div>
              <div
                className="relative z-20 -ml-8 mb-6"
                style={{ transform: 'rotate(-6deg)', transformOrigin: 'bottom center' }}
              >
                <PhoneMockup size="lg" />
              </div>
            </div>

            {/* Mobile: phone only */}
            <div className="flex md:hidden justify-center">
              <PhoneMockup size="lg" />
            </div>
          </motion.div>
        </div>
      </section>


      {/* ── Feature highlights ─────────────────────────────────────────────── */}
      <section className="py-28 sm:py-36 bg-white">
        <div className="max-w-5xl mx-auto px-6">

          <motion.div {...up(0)} className="text-center mb-20">
            <Eyebrow>Hur det fungerar</Eyebrow>
            <h2 className="mt-5 text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1]">
              Tre steg till en bättre arbetsdag
            </h2>
          </motion.div>

          <div className="space-y-24">

            {/* 1 — Offert */}
            <motion.div {...up(0)} className="grid md:grid-cols-2 gap-12 items-center">
              <div className="flex justify-center md:justify-start">
                <div style={{ transform: 'rotate(3deg)' }}>
                  <QuoteSnippet />
                </div>
              </div>
              <div>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-[13px] font-bold mb-5">1</span>
                <h3 className="text-3xl font-bold text-slate-900 tracking-tight leading-snug mb-4">
                  Skapa offert på minuter
                </h3>
                <p className="text-[16px] text-slate-500 leading-relaxed mb-5">
                  Välj arbetsmoment, lägg till material och markera vad som gäller
                  ROT eller RUT. Appen räknar ut avdraget automatiskt och sätter
                  rätt belopp på kundens offert.
                </p>
                <ul className="space-y-2.5">
                  {['ROT och RUT beräknas automatiskt', 'Kunden godkänner med ett klick', 'Skickas direkt via e-post'].map(item => (
                    <li key={item} className="flex items-center gap-2.5 text-[14px] text-slate-600 font-medium">
                      <Check className="w-4 h-4 text-blue-600 flex-shrink-0" strokeWidth={2.5} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            <div className="border-t border-slate-100" />

            {/* 2 — Faktura */}
            <motion.div {...up(0)} className="grid md:grid-cols-2 gap-12 items-center">
              <div className="md:order-2 flex justify-center md:justify-end">
                <div style={{ transform: 'rotate(-3deg)' }}>
                  <InvoiceSnippet />
                </div>
              </div>
              <div className="md:order-1">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-[13px] font-bold mb-5">2</span>
                <h3 className="text-3xl font-bold text-slate-900 tracking-tight leading-snug mb-4">
                  Fakturera direkt från jobbet
                </h3>
                <p className="text-[16px] text-slate-500 leading-relaxed mb-5">
                  När jobbet är klart skapar du fakturan med ett tryck. PDF-export,
                  bankgiro och Swish är klart ur lådan — utan extra inställningar.
                </p>
                <ul className="space-y-2.5">
                  {['PDF-export på sekunder', 'Bankgiro och Swish inbyggt', 'Faktura direkt från godkänd offert'].map(item => (
                    <li key={item} className="flex items-center gap-2.5 text-[14px] text-slate-600 font-medium">
                      <Check className="w-4 h-4 text-blue-600 flex-shrink-0" strokeWidth={2.5} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            <div className="border-t border-slate-100" />

            {/* 3 — Jobb */}
            <motion.div {...up(0)} className="grid md:grid-cols-2 gap-12 items-center">
              <div className="flex justify-center md:justify-start">
                <div style={{ transform: 'rotate(3deg)' }}>
                  <PhoneMockup size="sm" />
                </div>
              </div>
              <div>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-[13px] font-bold mb-5">3</span>
                <h3 className="text-3xl font-bold text-slate-900 tracking-tight leading-snug mb-4">
                  Håll koll på alla jobb
                </h3>
                <p className="text-[16px] text-slate-500 leading-relaxed mb-5">
                  Se status på alla pågående och planerade jobb i en vy.
                  Aldrig mer glömda jobb eller missad deadline.
                </p>
                <ul className="space-y-2.5">
                  {['Alla jobb samlade på ett ställe', 'Status uppdateras i realtid', 'Fungerar lika bra på mobilen'].map(item => (
                    <li key={item} className="flex items-center gap-2.5 text-[14px] text-slate-600 font-medium">
                      <Check className="w-4 h-4 text-blue-600 flex-shrink-0" strokeWidth={2.5} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

          </div>
        </div>
      </section>


      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section id="features" className="py-28 sm:py-36 bg-slate-50/60">
        <div className="max-w-6xl mx-auto px-6">

          <motion.div {...up(0)} className="max-w-xl mb-16">
            <Eyebrow>Funktioner</Eyebrow>
            <h2 className="mt-5 text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1]">
              Allt på ett ställe
            </h2>
            <p className="mt-5 text-[17px] text-slate-500 leading-relaxed">
              Sluta jonglera med papper, Excel och separata system.
              Hantverksappen håller ihop hela din affär.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            <FeatureCard
              delay={0}
              icon={FileText}
              iconBg="bg-blue-50 text-blue-600"
              title="Professionella offerter"
              description="Skapa och skicka offerter på minuter. Med ROT och RUT inbyggt. Kunden godkänner med ett klick."
            />
            <FeatureCard
              delay={0.08}
              icon={Briefcase}
              iconBg="bg-blue-50 text-blue-600"
              title="Håll koll på jobben"
              description="Från planerat till avslutat — se statusen på alla dina jobb i realtid. Aldrig mer missad deadline."
            />
            <FeatureCard
              delay={0.16}
              icon={Receipt}
              iconBg="bg-blue-50 text-blue-600"
              title="Fakturera direkt"
              description="Skapa en faktura direkt när jobbet är klart. PDF-export, bankgiro och Swish klart ur lådan."
            />
          </div>
        </div>
      </section>


      {/* ── Social proof ───────────────────────────────────────────────────── */}
      <section className="py-28 sm:py-36 bg-slate-900">
        <div className="max-w-4xl mx-auto px-6">

          {/* Quote */}
          <motion.div {...up(0)} className="text-center mb-20">
            <blockquote className="text-2xl sm:text-3xl lg:text-[36px] font-semibold text-white leading-snug tracking-tight max-w-3xl mx-auto">
              "Vi sparar minst fem timmar i veckan på administration.
              ROT-avdraget räknas ut automatiskt — det är guld värt."
            </blockquote>

            <div className="mt-8 flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-[14px] font-bold text-white">AL</span>
              </div>
              <div className="text-left">
                <p className="text-[15px] font-semibold text-white leading-tight">Anders Lindqvist</p>
                <p className="text-[13px] text-slate-400 mt-0.5">Elektriker, Stockholm</p>
              </div>
            </div>
          </motion.div>

          {/* Divider */}
          <div className="border-t border-slate-800 mb-16" />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8">
            <Stat value="500+"   label="Aktiva hantverkare"   delay={0} />
            <Stat value="50 000+" label="Fakturor skickade"   delay={0.08} />
            <Stat value="4.9 / 5" label="Genomsnittligt betyg" delay={0.16} />
          </div>
        </div>
      </section>


      {/* ── ROT / RUT ──────────────────────────────────────────────────────── */}
      <section id="rotrut" className="py-28 sm:py-36 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">

            {/* Left: copy */}
            <motion.div {...up(0)}>
              <Eyebrow>ROT &amp; RUT</Eyebrow>
              <h2 className="mt-5 text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1]">
                Skatteavdraget
                <br />räknar vi ut åt dig.
              </h2>
              <p className="mt-6 text-[17px] text-slate-500 leading-relaxed">
                Du markerar vilket arbete som är ROT eller RUT —
                appen beräknar automatiskt kundens avdrag på 30&nbsp;% och sätter
                rätt belopp på fakturan.
              </p>

              <ul className="mt-8 space-y-4">
                {[
                  'Stöd för både ROT och RUT på samma offert',
                  'Rätt belopp beräknas direkt — inga manuella uträkningar',
                  'Fakturan visar exakt vad kunden betalar efter avdrag',
                  'Håller sig uppdaterad med Skatteverkets regler',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-success" strokeWidth={3} />
                    </span>
                    <span className="text-[15px] text-slate-600 leading-snug font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Right: invoice card */}
            <motion.div {...up(0.1)}>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

                {/* Card header */}
                <div className="px-6 pt-6 pb-5 border-b border-slate-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Faktura</p>
                      <p className="text-[18px] font-bold text-slate-900">#2024-047</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-[12px] font-semibold px-3 py-1.5 rounded-full border border-green-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      ROT
                    </span>
                  </div>
                  <p className="text-[14px] text-slate-400 mt-1.5">Lindqvist VVS AB</p>
                </div>

                {/* Line items */}
                <div className="px-6 py-5 space-y-3">
                  {[
                    { label: 'Rörarbete (10 tim × 700 kr)', amount: '7 000 kr', muted: false },
                    { label: 'Installationsmaterial', amount: '4 500 kr', muted: false },
                    { label: 'Moms 25 %', amount: '2 875 kr', muted: true },
                  ].map(({ label, amount, muted }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className={`text-[14px] ${muted ? 'text-slate-400' : 'text-slate-600'} font-medium`}>
                        {label}
                      </span>
                      <span className={`text-[14px] font-semibold tabular-nums ${muted ? 'text-slate-400' : 'text-slate-800'}`}>
                        {amount}
                      </span>
                    </div>
                  ))}
                </div>

                {/* ROT deduction */}
                <div className="mx-6 rounded-xl bg-green-50 border border-green-100 px-4 py-3.5 mb-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success flex-shrink-0" strokeWidth={2.5} />
                      <span className="text-[14px] font-semibold text-green-800">
                        ROT-avdrag (30&nbsp;% av arbete)
                      </span>
                    </div>
                    <span className="text-[15px] font-bold text-green-700 tabular-nums">−2 100 kr</span>
                  </div>
                  <p className="text-[12px] text-success mt-1 ml-6">Beräknat automatiskt</p>
                </div>

                {/* Total */}
                <div className="mx-6 mb-6 bg-slate-900 rounded-xl px-5 py-4 flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-white">Att betala</span>
                  <span className="text-[22px] font-bold text-white tabular-nums tracking-tight">12 275 kr</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-28 sm:py-36 bg-slate-50">
        <div className="max-w-2xl mx-auto px-6 text-center">

          <motion.div {...up(0)}>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-600 shadow-lg shadow-gray-900/15 mb-8">
              <Wrench className="w-6 h-6 text-white" strokeWidth={2} />
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-5">
              60 dagar helt gratis.
            </h2>

            <p className="text-[18px] text-slate-500 leading-relaxed mb-10">
              Testa alla funktioner utan kostnad i 60 dagar — inget kreditkort krävs.
              Uppgradera när du är redo, eller avsluta utan kostnad.
            </p>

            <button
              onClick={() => navigate('/signup')}
              className="group inline-flex items-center gap-2 bg-blue-600 hover:bg-primary-dark active:bg-primary-darker text-white font-semibold text-[17px] px-10 py-4 rounded-xl transition-all hover:-translate-y-px"
            >
              Kom igång gratis
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <p className="mt-3 text-[13px] font-medium" style={{ color: '#666666' }}>
              ✓ 60 dagar gratis — inget kreditkort krävs
            </p>

            <div className="flex items-center justify-center gap-6 mt-6 text-[13px] text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-blue-600" strokeWidth={3} />
                Första 60 dagarna gratis
              </span>
              <span className="w-px h-3.5 bg-slate-200" />
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-blue-600" strokeWidth={3} />
                Inget kreditkort
              </span>
              <span className="w-px h-3.5 bg-slate-200" />
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-blue-600" strokeWidth={3} />
                Avsluta när som helst
              </span>
            </div>
          </motion.div>
        </div>
      </section>


      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-10">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Wrench className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                </div>
                <span className="font-semibold text-[15px] text-slate-900">Hantverksappen</span>
              </div>
              <p className="text-[13px] text-slate-400 max-w-xs leading-relaxed">
                Administration för hantverkare som vill ägna mer tid åt hantverket.
              </p>
            </div>

            {/* Links */}
            <nav className="grid grid-cols-2 sm:flex sm:flex-row gap-x-8 gap-y-3">
              {[
                { label: 'Funktioner', href: '#features' },
                { label: 'ROT & RUT', href: '#rotrut' },
                { label: 'Logga in', href: '/login', nav: true },
                { label: 'Integritetspolicy', href: '#' },
                { label: 'Kontakt', href: '#' },
              ].map(({ label, href, nav: isNav }) => (
                isNav ? (
                  <button
                    key={label}
                    onClick={() => navigate(href)}
                    className="text-[14px] text-slate-500 hover:text-slate-900 transition-colors font-medium text-left"
                  >
                    {label}
                  </button>
                ) : (
                  <a
                    key={label}
                    href={href}
                    className="text-[14px] text-slate-500 hover:text-slate-900 transition-colors font-medium"
                  >
                    {label}
                  </a>
                )
              ))}
            </nav>
          </div>

          <HR />
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[13px] text-slate-400">
              © 2026 Hantverksappen. Alla rättigheter förbehållna.
            </p>
            <p className="text-[13px] text-slate-400">
              Tillverkad med omsorg i Sverige
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}
