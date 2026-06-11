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
          <motion.div {...up(0.18)} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
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
          </motion.div>

          {/* Trust strip */}
          <motion.div {...fade(0.28)}
            className="inline-flex items-center gap-6 text-[13px] text-slate-400 font-medium"
          >
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-blue-600" strokeWidth={3} />
              Ingen bindningstid
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
              Kom igång gratis idag.
            </h2>

            <p className="text-[18px] text-slate-500 leading-relaxed mb-10">
              Testa alla funktioner utan kostnad. Uppgradera när du är redo —
              eller fortsätt gratis. Inga överraskningar.
            </p>

            <button
              onClick={() => navigate('/signup')}
              className="group inline-flex items-center gap-2 bg-blue-600 hover:bg-primary-dark active:bg-primary-darker text-white font-semibold text-[17px] px-10 py-4 rounded-xl transition-all hover:-translate-y-px"
            >
              Skapa gratis konto
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <div className="flex items-center justify-center gap-6 mt-8 text-[13px] text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-blue-600" strokeWidth={3} />
                Gratis att börja
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
