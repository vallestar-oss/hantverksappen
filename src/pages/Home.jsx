import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import {
  FileText, Briefcase, Receipt, ChevronRight, Check, Star,
  Wrench, Menu, X, ArrowRight, Zap, Shield, Clock
} from 'lucide-react'

// ── Animation variants ─────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
}

function FadeSection({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] } } }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ── App mockup component ───────────────────────────────────────────────────

function AppMockup() {
  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Glow */}
      <div className="absolute inset-0 bg-blue-400/20 blur-3xl rounded-full scale-110" />

      {/* Phone frame */}
      <div className="relative bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl shadow-blue-900/30 border border-gray-700">
        {/* Status bar */}
        <div className="bg-gray-900 rounded-[2rem] px-6 pt-3 pb-1 flex items-center justify-between">
          <span className="text-white text-xs font-medium">9:41</span>
          <div className="w-20 h-5 bg-gray-800 rounded-full" />
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-white/40 rounded-sm" />
            <div className="w-3 h-3 bg-white/40 rounded-sm" />
          </div>
        </div>

        {/* App screen */}
        <div className="bg-[#F8FAFC] rounded-[1.75rem] overflow-hidden" style={{ minHeight: 480 }}>
          {/* App header */}
          <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-primary font-bold text-sm">Hantverksappen</span>
            <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-primary/40" />
            </div>
          </div>

          <div className="px-3 py-3 space-y-2.5">
            {/* Greeting */}
            <div className="pt-1">
              <div className="h-4 w-32 bg-gray-800 rounded-full" />
              <div className="h-3 w-24 bg-gray-300 rounded-full mt-1.5" />
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { bg: 'bg-blue-50', bar: 'bg-blue-200', accent: 'bg-primary', w: 'w-8' },
                { bg: 'bg-amber-50', bar: 'bg-amber-200', accent: 'bg-amber-400', w: 'w-6' },
                { bg: 'bg-gray-100', bar: 'bg-gray-200', accent: 'bg-gray-400', w: 'w-10' },
                { bg: 'bg-green-50', bar: 'bg-green-200', accent: 'bg-green-500', w: 'w-12' },
              ].map((c, i) => (
                <div key={i} className={`${c.bg} rounded-xl p-2.5 border-l-4 ${c.accent.replace('bg-', 'border-')}`}>
                  <div className={`${c.accent} w-3 h-3 rounded-sm mb-2`} />
                  <div className={`${c.bar} ${c.w} h-5 rounded-md mb-1`} />
                  <div className={`${c.bar} w-10 h-2.5 rounded-full`} />
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="flex gap-2">
              <div className="flex-1 bg-primary rounded-xl h-8 flex items-center justify-center">
                <div className="w-10 h-2 bg-white/40 rounded-full" />
              </div>
              <div className="flex-1 bg-white border border-gray-200 rounded-xl h-8" />
            </div>

            {/* Recent list */}
            <div className="space-y-2">
              {[
                { w: 'w-24', sub: 'w-16', badge: 'bg-amber-100', dot: 'bg-amber-400' },
                { w: 'w-32', sub: 'w-20', badge: 'bg-green-100', dot: 'bg-green-500' },
                { w: 'w-20', sub: 'w-14', badge: 'bg-blue-100',  dot: 'bg-primary' },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl px-3 py-2.5 flex items-center gap-2.5 shadow-sm border border-gray-100">
                  <div className={`w-6 h-6 rounded-lg ${item.badge} flex items-center justify-center flex-shrink-0`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${item.dot}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`${item.w} h-2.5 bg-gray-700 rounded-full`} />
                    <div className={`${item.sub} h-2 bg-gray-200 rounded-full mt-1`} />
                  </div>
                  <div className={`${item.badge} rounded-full px-2 py-0.5`}>
                    <div className="w-8 h-2 bg-current opacity-40 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom nav mockup */}
          <div className="absolute bottom-2 left-2 right-2 bg-white rounded-2xl border border-gray-100 shadow-sm flex">
            {['Hem', 'Kunder', 'Jobb', 'Fakturor'].map((label, i) => (
              <div key={label} className={`flex-1 flex flex-col items-center py-2 ${i === 0 ? 'text-primary' : 'text-gray-300'}`}>
                <div className={`w-4 h-4 rounded-sm ${i === 0 ? 'bg-blue-100' : 'bg-gray-100'} mb-1`} />
                <div className={`h-1.5 ${i === 0 ? 'w-6 bg-primary/40' : 'w-5 bg-gray-200'} rounded-full`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Feature cards ──────────────────────────────────────────────────────────

const features = [
  {
    icon: FileText,
    color: 'bg-blue-100 text-primary',
    title: 'Offerter på minuter',
    desc: 'Skapa professionella offerter med ROT/RUT-avdrag. Kunden får ett snyggt PDF direkt.',
    tag: 'Populärt',
  },
  {
    icon: Briefcase,
    color: 'bg-amber-100 text-amber-600',
    title: 'Håll koll på jobben',
    desc: 'Planera och följ upp alla dina jobb i en enkel kalendervy. Aldrig mer dubbelbokning.',
    tag: null,
  },
  {
    icon: Receipt,
    color: 'bg-green-100 text-green-600',
    title: 'Fakturera direkt',
    desc: 'Skapa och exportera fakturor direkt när jobbet är klart. Betalt snabbare.',
    tag: null,
  },
]

// ── Stats ──────────────────────────────────────────────────────────────────

const stats = [
  { value: '500+',    label: 'Aktiva hantverkare' },
  { value: '50 000+', label: 'Fakturor skickade' },
  { value: '4.9/5',   label: 'Betyg från användare' },
]

// ── ROT/RUT steps ──────────────────────────────────────────────────────────

const rotrutSteps = [
  { icon: FileText, label: 'Du skapar offert', desc: 'Markera arbete som ROT eller RUT' },
  { icon: Zap,      label: 'Appen räknar ut',  desc: 'Avdraget beräknas automatiskt' },
  { icon: Receipt,  label: 'Kunden betalar',   desc: 'Bara 70% av arbetskostnaden' },
  { icon: Check,    label: 'Du ansöker',        desc: 'Via Skatteverket som vanligt' },
]

// ── Main component ─────────────────────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const heroRef = useRef(null)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* ── 1. Navbar ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <Wrench className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-gray-900 text-base tracking-tight">Hantverksappen</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">Funktioner</a>
            <a href="#rotrut" className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">ROT/RUT</a>
            <button onClick={() => navigate('/login')} className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">Logga in</button>
            <button
              onClick={() => navigate('/signup')}
              className="bg-primary hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all shadow-sm hover:shadow-md hover:shadow-blue-200"
            >
              Kom igång gratis
            </button>
          </nav>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4 space-y-1">
            <a href="#features" onClick={() => setMenuOpen(false)} className="block py-3 text-sm font-medium text-gray-700 border-b border-gray-50">Funktioner</a>
            <a href="#rotrut" onClick={() => setMenuOpen(false)} className="block py-3 text-sm font-medium text-gray-700 border-b border-gray-50">ROT/RUT</a>
            <button onClick={() => navigate('/login')} className="block w-full text-left py-3 text-sm font-medium text-gray-700 border-b border-gray-50">Logga in</button>
            <button onClick={() => navigate('/signup')} className="mt-2 w-full bg-primary text-white text-sm font-semibold py-3 rounded-full transition-all">
              Kom igång gratis
            </button>
          </div>
        )}
      </header>

      {/* ── 2. Hero ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-16 overflow-hidden">

        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl opacity-60 translate-x-1/3 -translate-y-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-50 rounded-full blur-3xl opacity-50 -translate-x-1/3 translate-y-1/4 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center py-16 lg:py-24">

            {/* Left: copy */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="text-center lg:text-left"
            >
              {/* Badge */}
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-blue-50 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border border-blue-100">
                <Star className="w-3.5 h-3.5 fill-primary" />
                Byggt för svenska hantverkare
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeUp}
                className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-[1.05] tracking-tight mb-6"
              >
                Allt du behöver för att driva ditt{' '}
                <span className="text-primary relative">
                  hantverks&shy;företag
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 8" fill="none" preserveAspectRatio="none">
                    <path d="M0 6 Q75 0 150 4 Q225 8 300 2" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.4"/>
                  </svg>
                </span>
              </motion.h1>

              {/* Subtext */}
              <motion.p variants={fadeUp} className="text-lg sm:text-xl text-gray-500 leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
                Offerter, jobb och fakturor — enkelt och snabbt.
                Byggt för svenska hantverkare som vill ägna mer tid åt jobbet.
              </motion.p>

              {/* CTAs */}
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <button
                  onClick={() => navigate('/signup')}
                  className="group flex items-center justify-center gap-2 bg-primary hover:bg-blue-700 text-white font-bold text-base px-7 py-4 rounded-2xl transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 hover:-translate-y-0.5"
                >
                  Kom igång gratis
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <a
                  href="#features"
                  className="flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 font-semibold text-base px-7 py-4 rounded-2xl transition-all hover:border-gray-400 hover:bg-gray-50"
                >
                  Se hur det fungerar
                </a>
              </motion.div>

              {/* Trust signals */}
              <motion.div variants={fadeUp} className="flex items-center gap-4 mt-8 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {['E', 'J', 'M', 'A'].map((l, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white ${
                      ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500'][i]
                    }`}>{l}</div>
                  ))}
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-800">500+</span> hantverkare använder appen idag
                </div>
              </motion.div>
            </motion.div>

            {/* Right: mockup */}
            <motion.div
              initial={{ opacity: 0, y: 48, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex justify-center lg:justify-end"
            >
              <AppMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 3. Features ── */}
      <section id="features" className="py-24 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <FadeSection className="text-center mb-14">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Funktioner</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">Allt på ett ställe</h2>
            <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
              Sluta jonglera med Excel-filer och papper. En app för hela jobbet.
            </p>
          </FadeSection>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <FadeSection key={f.title} delay={i * 0.1}>
                <div className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                  {f.tag && (
                    <span className="self-start bg-primary text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                      {f.tag}
                    </span>
                  )}
                  <div className={`w-12 h-12 rounded-2xl ${f.color} flex items-center justify-center mb-5`}>
                    <f.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-gray-500 leading-relaxed flex-1">{f.desc}</p>
                  <div className="flex items-center gap-1.5 mt-5 text-primary text-sm font-semibold">
                    Läs mer <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Social proof ── */}
      <section className="py-24 bg-[#0F172A] text-white overflow-hidden relative">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <FadeSection>
            {/* Stars */}
            <div className="flex justify-center gap-1 mb-8">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 text-amber-400 fill-amber-400" />
              ))}
            </div>

            <blockquote className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 text-white">
              "Vi sparar <span className="text-primary">5 timmar</span> i veckan på administration"
            </blockquote>
            <cite className="text-gray-400 text-lg not-italic">— Anders Lindqvist, elektriker i Stockholm</cite>
          </FadeSection>

          {/* Stats */}
          <FadeSection delay={0.2}>
            <div className="grid grid-cols-3 gap-6 mt-16 pt-12 border-t border-white/10">
              {stats.map(s => (
                <div key={s.value} className="text-center">
                  <div className="text-4xl sm:text-5xl font-extrabold text-white tabular-nums">{s.value}</div>
                  <div className="text-gray-400 text-sm mt-2 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ── 5. ROT/RUT ── */}
      <section id="rotrut" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: copy */}
            <FadeSection>
              <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">ROT & RUT</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-5">
                ROT och RUT —<br />
                <span className="text-primary">helt automatiskt</span>
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed mb-8">
                Sluta räkna manuellt. Appen hanterar ROT- och RUT-avdrag automatiskt på dina offerter
                och fakturor. Kunden ser exakt vad de betalar — och du slipper krånglet.
              </p>

              <div className="space-y-4">
                {[
                  '30% avdrag på arbetskostnad beräknas automatiskt',
                  'Stöd för både ROT och RUT på samma faktura',
                  'Korrekt summering på PDF-dokumenten',
                  'Maxbelopp och regler hanteras åt dig',
                ].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-600" strokeWidth={3} />
                    </div>
                    <span className="text-gray-700 font-medium text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </FadeSection>

            {/* Right: flow diagram */}
            <FadeSection delay={0.15}>
              <div className="bg-[#F8FAFC] rounded-3xl p-8 border border-gray-100">
                <div className="space-y-4">
                  {rotrutSteps.map((step, i) => (
                    <div key={step.label}>
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          i === 0 ? 'bg-primary text-white' :
                          i === 1 ? 'bg-amber-100 text-amber-600' :
                          i === 2 ? 'bg-green-100 text-green-600' :
                          'bg-blue-100 text-primary'
                        }`}>
                          <step.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 text-sm">{step.label}</p>
                          <p className="text-gray-400 text-sm">{step.desc}</p>
                        </div>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          i === 3 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>{i + 1}</div>
                      </div>
                      {i < rotrutSteps.length - 1 && (
                        <div className="ml-5 mt-2 mb-0 w-0.5 h-4 bg-gray-200" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Illustrative receipt preview */}
                <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Exempel — faktura</span>
                    <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">ROT</span>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Arbetskostnad</span><span className="font-medium">20 000 kr</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Material</span><span className="font-medium">5 000 kr</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Moms 25%</span><span className="font-medium">6 250 kr</span>
                    </div>
                    <div className="flex justify-between text-green-600 font-semibold">
                      <span>ROT-avdrag (30%)</span><span>− 6 000 kr</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-100 pt-2 font-bold text-gray-900">
                      <span>Att betala</span><span className="text-primary">25 250 kr</span>
                    </div>
                  </div>
                </div>
              </div>
            </FadeSection>
          </div>
        </div>
      </section>

      {/* ── Additional benefits strip ── */}
      <section className="py-16 bg-[#F8FAFC] border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: Zap,    color: 'bg-amber-100 text-amber-600', title: 'Snabb start',     desc: 'Konto klart på 2 minuter. Inga långa onboardingflöden.' },
              { icon: Shield, color: 'bg-green-100 text-green-600', title: 'Säkert och tryggt', desc: 'All data lagras säkert. Vi följer GDPR till punkt och pricka.' },
              { icon: Clock,  color: 'bg-blue-100 text-primary',    title: 'Alltid tillgängligt', desc: 'Mobil och dator. Fungerar offline. Synkar automatiskt.' },
            ].map((b, i) => (
              <FadeSection key={b.title} delay={i * 0.1}>
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-2xl ${b.color} flex items-center justify-center mb-4`}>
                    <b.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{b.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{b.desc}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. CTA ── */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 50%, #EFF6FF 100%)' }}>
        {/* Blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none" />

        <FadeSection className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary shadow-lg shadow-blue-300 mb-8">
            <Wrench className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4 leading-tight">
            Redo att förenkla din vardag?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Kom igång gratis idag. Inget kreditkort krävs.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="group inline-flex items-center gap-2 bg-primary hover:bg-blue-700 text-white font-bold text-lg px-10 py-4 rounded-2xl transition-all shadow-xl shadow-blue-300 hover:shadow-2xl hover:shadow-blue-400 hover:-translate-y-0.5"
          >
            Skapa gratis konto
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-sm text-gray-400 mt-5 flex items-center justify-center gap-4">
            <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-green-500" strokeWidth={3} /> Gratis att börja</span>
            <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-green-500" strokeWidth={3} /> Inget kreditkort</span>
            <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-green-500" strokeWidth={3} /> Avsluta när som helst</span>
          </p>
        </FadeSection>
      </section>

      {/* ── 7. Footer ── */}
      <footer className="bg-[#0F172A] text-white py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-8 mb-10">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                <Wrench className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-white text-base">Hantverksappen</span>
            </div>

            {/* Links */}
            <nav className="flex flex-wrap justify-center sm:justify-end gap-x-6 gap-y-2">
              {['Om oss', 'Priser', 'Kontakt', 'Integritetspolicy'].map(link => (
                <a key={link} href="#" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                  {link}
                </a>
              ))}
              <button onClick={() => navigate('/login')} className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                Logga in
              </button>
            </nav>
          </div>

          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              © 2026 Hantverksappen. Alla rättigheter förbehållna.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
