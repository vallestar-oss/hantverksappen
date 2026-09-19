import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import Page, { Noise } from '../components/Premium'
import EmptyState from '../components/EmptyState'
import Onboarding from '../components/Onboarding'
import { isOnboardingDone } from '../lib/onboarding'
import { formatSEK, pluralize } from '../lib/format'
import { formatDate, todayISO, monthStartISO } from '../lib/date'
import { documentTotal } from '../utils/calc'
import {
  Settings, LogOut, Briefcase, Receipt, FileText,
  ArrowRight, UserPlus, ChevronRight,
} from 'lucide-react'

// ── helpers ────────────────────────────────────────────────────────────────

function invoiceStatus(invoice) {
  if (invoice.status === 'obetald' && invoice.due_date && invoice.due_date < todayISO()) return 'försenad'
  return invoice.status ?? 'obetald'
}

function greetingLabel(date = new Date()) {
  const label = new Intl.DateTimeFormat('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

// ── badge config ───────────────────────────────────────────────────────────

const JOB_BADGE = { planerad: 'badge badge-blue', pågående: 'badge badge-amber', avslutad: 'badge badge-green' }
const INV_BADGE = { obetald: 'badge badge-amber', betald: 'badge badge-green', försenad: 'badge badge-red' }
const JOB_LABEL = { planerad: 'Planerad', pågående: 'Pågående', avslutad: 'Avslutad' }
const INV_LABEL = { obetald: 'Obetald', betald: 'Betald', försenad: 'Försenad' }

const SECTION_LABEL_STYLE = { color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.08em' }

// ── sub-components ─────────────────────────────────────────────────────────

function RevenueHero({ loading, revenue, attention }) {
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ background: '#131313' }}>
      <Noise opacity={0.035} />
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 90% at 100% 0%, rgba(0,85,255,0.18) 0%, transparent 65%), radial-gradient(ellipse 40% 60% at 0% 100%, rgba(0,85,255,0.07) 0%, transparent 60%)',
        }}
      />
      <div className="relative px-5 pt-5 pb-5">
        <p className="text-[11px] font-semibold" style={{ color: '#555555', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Intäkt denna månad
        </p>
        {loading ? (
          <div className="h-11 w-40 rounded-xl mt-2 animate-pulse" style={{ background: '#252525' }} />
        ) : (
          <p
            className="text-gradient-blue font-bold tabular-nums mt-1.5"
            style={{ fontSize: '2.6rem', letterSpacing: '-0.035em', lineHeight: 1.1 }}
          >
            {formatSEK(revenue, { max: 0 })}
          </p>
        )}

        {!loading && attention.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {attention.map(a => (
              <span
                key={a.label}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{
                  background: a.warn ? 'rgba(217,119,6,0.15)' : 'rgba(255,255,255,0.08)',
                  color: a.warn ? '#F59E0B' : 'rgba(255,255,255,0.55)',
                }}
              >
                {a.label}
              </span>
            ))}
          </div>
        )}
        {!loading && attention.length === 0 && (
          <p className="text-[12px] mt-3" style={{ color: '#444444' }}>Allt hanterat.</p>
        )}
      </div>
    </div>
  )
}

function MobileStats({ loading, cards }) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="stat-card-light animate-pulse">
            <div className="h-7 w-8 rounded-lg mb-2" style={{ background: '#EBEBEB' }} />
            <div className="h-3 w-full rounded-full" style={{ background: '#EBEBEB' }} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {cards.map(c => (
        <button key={c.label} onClick={() => navigate(c.path)} className="stat-card-light text-left">
          <p className="font-bold tabular-nums" style={{ fontSize: '1.75rem', letterSpacing: '-0.04em', lineHeight: 1, color: '#111111' }}>
            {c.value}
          </p>
          <p className="text-[11px] mt-1.5 leading-tight" style={{ color: '#999999', fontWeight: 500 }}>
            {c.label}
          </p>
          <div className="mt-3 h-[2px] rounded-full w-8" style={{ background: c.accentColor, opacity: 0.5 }} />
        </button>
      ))}
    </div>
  )
}

function QuickActions() {
  const navigate = useNavigate()
  const secondaryClass = 'btn-lift flex items-center justify-center gap-2 bg-white border font-semibold rounded-xl text-[13px] transition-colors'
  const secondaryStyle = { height: 44, borderColor: '#E8E8E6', color: '#444444' }

  return (
    <div className="space-y-2.5 md:hidden">
      <button
        onClick={() => navigate('/jobs/new')}
        className="btn-lift w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark active:bg-primary-darker text-white font-semibold rounded-xl text-[13.5px]"
        style={{ height: 48 }}
      >
        <Briefcase className="w-4 h-4" />
        Nytt jobb
      </button>
      <div className="grid grid-cols-3 gap-2.5">
        <button onClick={() => navigate('/quotes/new')} className={secondaryClass} style={secondaryStyle}>
          <FileText className="w-[15px] h-[15px]" style={{ color: '#BBBBBB' }} />
          Offert
        </button>
        <button onClick={() => navigate('/invoices/new')} className={secondaryClass} style={secondaryStyle}>
          <Receipt className="w-[15px] h-[15px]" style={{ color: '#BBBBBB' }} />
          Faktura
        </button>
        <button onClick={() => navigate('/customers/new')} className={secondaryClass} style={secondaryStyle}>
          <UserPlus className="w-[15px] h-[15px]" style={{ color: '#BBBBBB' }} />
          Kund
        </button>
      </div>
    </div>
  )
}

function DesktopQuickActions() {
  const navigate = useNavigate()
  const base = 'btn-lift flex items-center justify-center gap-2 font-semibold rounded-xl text-[13px] h-10'
  const secondary = `${base} bg-white border text-[#444444]`

  return (
    <div className="hidden md:grid grid-cols-4 gap-3">
      <button onClick={() => navigate('/jobs/new')} className={`${base} bg-primary hover:bg-primary-dark text-white`}>
        <Briefcase className="w-4 h-4" />
        Nytt jobb
      </button>
      <button onClick={() => navigate('/quotes/new')} className={secondary} style={{ borderColor: '#E8E8E6' }}>
        <FileText className="w-4 h-4" style={{ color: '#BBBBBB' }} />
        Ny offert
      </button>
      <button onClick={() => navigate('/invoices/new')} className={secondary} style={{ borderColor: '#E8E8E6' }}>
        <Receipt className="w-4 h-4" style={{ color: '#BBBBBB' }} />
        Ny faktura
      </button>
      <button onClick={() => navigate('/customers/new')} className={secondary} style={{ borderColor: '#E8E8E6' }}>
        <UserPlus className="w-4 h-4" style={{ color: '#BBBBBB' }} />
        Ny kund
      </button>
    </div>
  )
}

function RecentActivity({ items }) {
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <EmptyState
        illustration="start"
        title="Välkommen till Hantverksappen"
        text="Skapa ett jobb eller en offert för att komma igång."
        ctaLabel="Skapa ditt första jobb"
        onCta={() => navigate('/jobs/new')}
      />
    )
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-0.5">
        <h2 className="text-[11.5px] font-semibold" style={SECTION_LABEL_STYLE}>
          Senaste aktivitet
        </h2>
        <Link
          to="/jobs"
          className="text-[12.5px] font-medium inline-flex items-center gap-1 transition-colors"
          style={{ color: '#0055FF' }}
        >
          Visa alla
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="row-list">
        {items.map((item, idx) => {
          const isJob = item.type === 'job'
          const badgeClass = isJob
            ? (JOB_BADGE[item.status] ?? JOB_BADGE.planerad)
            : (INV_BADGE[item.status] ?? INV_BADGE.obetald)
          const badgeLabel = isJob
            ? (JOB_LABEL[item.status] ?? item.status)
            : (INV_LABEL[item.status] ?? item.status)
          return (
            <Link
              key={`${item.type}-${item.id}`}
              to={item.path}
              className="row-item stagger-item px-4 py-[14px] gap-3"
              style={{ animationDelay: `${idx * 35}ms` }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[13.5px] truncate" style={{ color: '#111111' }}>{item.title}</p>
                {item.customer && (
                  <p className="text-[12px] mt-0.5 truncate" style={{ color: '#999999' }}>{item.customer}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                {item.date && (
                  <span className="text-[11.5px]" style={{ color: '#AAAAAA' }}>{formatDate(item.date, { style: 'short', fallback: '' })}</span>
                )}
                <span className={badgeClass}>{badgeLabel}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function DesktopStatCards({ loading, cards }) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ background: '#1A1A1A', border: '1px solid #252525' }}>
            <div className="h-8 w-10 rounded-xl mb-3" style={{ background: '#2A2A2A' }} />
            <div className="h-3 w-full rounded-full" style={{ background: '#2A2A2A' }} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {cards.map(c => (
        <button
          key={c.label}
          onClick={() => navigate(c.path)}
          className="card-lift w-full rounded-2xl p-5 text-left"
          style={{ background: '#151515', border: '1px solid #222222' }}
        >
          <div className="flex items-start justify-between mb-4">
            <p className="text-[11.5px] font-medium" style={{ color: '#555555', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {c.label}
            </p>
            <ChevronRight className="w-3.5 h-3.5 mt-0.5" style={{ color: '#333333' }} />
          </div>
          <p className="font-bold tabular-nums text-white" style={{ fontSize: '2.25rem', letterSpacing: '-0.04em', lineHeight: 1 }}>
            {c.value}
          </p>
          <div className="mt-4 h-[2px] rounded-full" style={{ background: c.accentColor, opacity: 0.4, width: '100%' }} />
        </button>
      ))}
    </div>
  )
}

// ── page ───────────────────────────────────────────────────────────────────

const EMPTY_STATS = { activeJobs: 0, unpaidInvoices: 0, pendingQuotes: 0, monthlyRevenue: 0 }
const RECENT_LIMIT = 6

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const showToast = useToast()

  const [companyName, setCompanyName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [stats, setStats] = useState(EMPTY_STATS)
  const [recentItems, setRecentItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    let active = true

    async function fetchAll() {
      const [profileRes, jobsRes, invoicesRes, quotesRes] = await Promise.all([
        supabase.from('company_profiles').select('company_name, logo_url').eq('user_id', user.id).maybeSingle(),
        supabase.from('jobs').select('id, title, status, scheduled_date, updated_at, customers(name)').eq('user_id', user.id).order('updated_at', { ascending: false }),
        supabase.from('invoices').select('id, invoice_number, status, due_date, paid_date, rot_rut_enabled, updated_at, customers(name), invoice_items(quantity, unit_price, type, vat_rate)').eq('user_id', user.id).order('updated_at', { ascending: false }),
        supabase.from('quotes').select('id, status, updated_at').eq('user_id', user.id),
      ])
      if (!active) return

      if (profileRes.error || jobsRes.error || invoicesRes.error || quotesRes.error) {
        showToast('Kunde inte hämta all data. Ladda om sidan.', 'error')
      }

      const profile = profileRes.data
      setCompanyName(profile?.company_name ?? '')
      setLogoUrl(profile?.logo_url ?? '')
      if (!profile?.company_name && !isOnboardingDone(user.id)) setShowOnboarding(true)

      const jobs = jobsRes.data ?? []
      const invoices = invoicesRes.data ?? []
      const quotes = quotesRes.data ?? []
      const monthStart = monthStartISO()

      setStats({
        activeJobs: jobs.filter(j => j.status === 'planerad' || j.status === 'pågående').length,
        unpaidInvoices: invoices.filter(inv => inv.status === 'obetald').length,
        pendingQuotes: quotes.filter(q => q.status === 'utkast' || q.status === 'skickad').length,
        monthlyRevenue: invoices
          .filter(inv => inv.status === 'betald' && inv.paid_date && inv.paid_date >= monthStart)
          .reduce((sum, inv) => sum + documentTotal(inv.invoice_items, inv.rot_rut_enabled), 0),
      })

      setRecentItems([
        ...jobs.map(j => ({
          type: 'job', id: j.id,
          title: j.title ?? 'Namnlöst jobb',
          customer: j.customers?.name ?? '',
          status: j.status ?? 'planerad',
          date: j.scheduled_date ?? j.updated_at,
          updated_at: j.updated_at,
          path: `/jobs/${j.id}`,
        })),
        ...invoices.map(inv => ({
          type: 'invoice', id: inv.id,
          title: `Faktura ${inv.invoice_number ?? ''}`,
          customer: inv.customers?.name ?? '',
          status: invoiceStatus(inv),
          date: inv.due_date ?? inv.updated_at,
          updated_at: inv.updated_at,
          path: `/invoices/${inv.id}`,
        })),
      ]
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, RECENT_LIMIT))

      setLoading(false)
    }

    fetchAll()
    return () => { active = false }
  }, [user.id, showToast])

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const attention = [
    stats.unpaidInvoices > 0 && { label: pluralize(stats.unpaidInvoices, 'faktura obetald', 'fakturor obetalda'), warn: true },
    stats.pendingQuotes > 0 && { label: pluralize(stats.pendingQuotes, 'offert väntar', 'offerter väntar') },
    stats.activeJobs > 0 && { label: pluralize(stats.activeJobs, 'jobb aktivt', 'jobb aktiva') },
  ].filter(Boolean)

  const statCards = [
    { label: 'Aktiva jobb',       value: stats.activeJobs,     path: '/jobs',     accentColor: '#0055FF' },
    { label: 'Obetalda fakturor', value: stats.unpaidInvoices, path: '/invoices', accentColor: '#D97706' },
    { label: 'Offerter väntar',   value: stats.pendingQuotes,  path: '/quotes',   accentColor: '#0055FF' },
  ]

  const today = greetingLabel()
  const heading = loading ? 'Hej' : (companyName ? `Hej, ${companyName}` : 'God dag')

  return (
    <Page className="min-h-screen flex flex-col">
      {showOnboarding && !loading && (
        <Onboarding
          onComplete={({ company_name, logo_url }) => {
            if (company_name) setCompanyName(company_name)
            if (logo_url) setLogoUrl(logo_url)
            setShowOnboarding(false)
          }}
        />
      )}

      {/* Mobile header */}
      <header
        className="md:hidden sticky top-0 z-10 px-4 h-[56px] flex items-center justify-between"
        style={{ background: 'rgba(244,243,241,0.9)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt="Logotyp" className="object-contain" style={{ maxHeight: 28 }} />
        ) : (
          <span className="font-bold text-[15px]" style={{ color: '#111111', letterSpacing: '-0.02em' }}>
            {loading ? 'Hantverksappen' : (companyName || 'Hantverksappen')}
          </span>
        )}
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 rounded-xl transition-colors"
            style={{ color: '#AAAAAA' }}
            aria-label="Inställningar"
          >
            <Settings className="w-[19px] h-[19px]" />
          </button>
          <button
            onClick={handleSignOut}
            className="p-2 rounded-xl transition-colors"
            style={{ color: '#AAAAAA' }}
            aria-label="Logga ut"
          >
            <LogOut className="w-[19px] h-[19px]" />
          </button>
        </div>
      </header>

      {/* Mobile layout */}
      <div className="md:hidden flex flex-col flex-1 px-4 py-4 space-y-4">
        <div>
          <p className="text-[12px] font-medium" style={{ color: '#AAAAAA' }}>{today}</p>
          <h1 className="font-bold text-[1.6rem] mt-0.5" style={{ color: '#111111', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
            {heading}
          </h1>
        </div>

        <RevenueHero loading={loading} revenue={stats.monthlyRevenue} attention={attention} />
        <MobileStats loading={loading} cards={statCards} />
        <QuickActions />
        <RecentActivity items={recentItems} />
      </div>

      {/* Desktop layout */}
      <div className="hidden md:flex flex-1 gap-7 px-10 py-8 max-w-[1400px] w-full">
        <div className="flex-1 min-w-0 space-y-6">
          <div>
            <p className="text-[12px] font-medium" style={{ color: '#AAAAAA' }}>{today}</p>
            <h1 className="font-bold mt-0.5" style={{ color: '#111111', fontSize: '1.75rem', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
              {heading}
            </h1>
          </div>

          <RevenueHero loading={loading} revenue={stats.monthlyRevenue} attention={attention} />
          <DesktopQuickActions />
          <RecentActivity items={recentItems} />
        </div>

        <div className="w-[260px] flex-shrink-0 space-y-4">
          <p className="text-[11.5px] font-semibold" style={SECTION_LABEL_STYLE}>Översikt</p>
          <DesktopStatCards loading={loading} cards={statCards} />
        </div>
      </div>
    </Page>
  )
}
