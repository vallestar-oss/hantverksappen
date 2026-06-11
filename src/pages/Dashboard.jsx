import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Page, { Noise } from '../components/Premium'
import EmptyState from '../components/EmptyState'
import {
  Settings, LogOut, Briefcase, Receipt, FileText, AlertCircle,
  Plus, ArrowRight,
} from 'lucide-react'

// ── helpers ────────────────────────────────────────────────────────────────

function todayISO() { return new Date().toISOString().slice(0, 10) }

function thisMonthStart() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function formatSEK(n) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(n ?? 0) + ' kr'
}

function formatDateShort(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' }).format(new Date(iso))
}

function calcInvoiceTotal(inv) {
  const items = inv.invoice_items ?? []
  const subtotal = items.reduce((s, r) => s + (r.quantity ?? 0) * (r.unit_price ?? 0), 0)
  const labourSubtotal = items.filter(r => r.type === 'arbete').reduce((s, r) => s + (r.quantity ?? 0) * (r.unit_price ?? 0), 0)
  const vatTotal = items.reduce((s, r) => s + (r.quantity ?? 0) * (r.unit_price ?? 0) * ((r.vat_rate ?? 25) / 100), 0)
  const deduction = inv.rot_rut_enabled ? labourSubtotal * 0.3 : 0
  return subtotal + vatTotal - deduction
}

function invStatus(inv) {
  if (inv.status === 'obetald' && inv.due_date && inv.due_date < todayISO()) return 'försenad'
  return inv.status ?? 'obetald'
}

// ── badge config ───────────────────────────────────────────────────────────

const JOB_BADGE = {
  planerad: 'bg-blue-100 text-blue-700',
  pågående: 'bg-amber-100 text-amber-700',
  avslutad: 'bg-green-100 text-green-700',
}
const INV_BADGE = {
  obetald:  'bg-amber-100 text-amber-700',
  betald:   'bg-green-100 text-green-700 glow-success',
  försenad: 'bg-red-100 text-red-700 glow-danger',
}
const JOB_LABEL = { planerad: 'Planerad', pågående: 'Pågående', avslutad: 'Avslutad' }
const INV_LABEL = { obetald: 'Obetald', betald: 'Betald', försenad: 'Försenad' }

// ── component ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [companyName, setCompanyName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [stats, setStats] = useState({ activeJobs: 0, unpaidInvoices: 0, pendingQuotes: 0, monthlyRevenue: 0 })
  const [recentItems, setRecentItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      const [{ data: profile }, { data: jobs }, { data: invoices }, { data: quotes }] =
        await Promise.all([
          supabase.from('company_profiles').select('company_name, logo_url').eq('user_id', user.id).single(),
          supabase.from('jobs').select('id, title, status, scheduled_date, updated_at, customers(name)').eq('user_id', user.id).order('updated_at', { ascending: false }),
          supabase.from('invoices').select('id, invoice_number, status, due_date, paid_date, rot_rut_enabled, updated_at, customers(name), invoice_items(quantity, unit_price, type, vat_rate)').eq('user_id', user.id).order('updated_at', { ascending: false }),
          supabase.from('quotes').select('id, status, updated_at').eq('user_id', user.id),
        ])

      setCompanyName(profile?.company_name ?? '')
      setLogoUrl(profile?.logo_url ?? '')

      const jobList     = jobs     ?? []
      const invoiceList = invoices ?? []
      const quoteList   = quotes   ?? []

      const activeJobs      = jobList.filter(j => j.status === 'planerad' || j.status === 'pågående').length
      const unpaidInvoices  = invoiceList.filter(inv => inv.status === 'obetald').length
      const pendingQuotes   = quoteList.filter(q => q.status === 'utkast' || q.status === 'skickad').length
      const monthlyRevenue  = invoiceList
        .filter(inv => inv.status === 'betald' && inv.paid_date && inv.paid_date >= thisMonthStart())
        .reduce((sum, inv) => sum + calcInvoiceTotal(inv), 0)

      setStats({ activeJobs, unpaidInvoices, pendingQuotes, monthlyRevenue })

      const combined = [
        ...jobList.map(j => ({
          type: 'job', id: j.id,
          title: j.title ?? 'Namnlöst jobb',
          customer: j.customers?.name ?? '',
          status: j.status ?? 'planerad',
          date: j.scheduled_date ?? j.updated_at,
          updated_at: j.updated_at,
          path: `/jobs/${j.id}`,
        })),
        ...invoiceList.map(inv => ({
          type: 'invoice', id: inv.id,
          title: `Faktura ${inv.invoice_number ?? '–'}`,
          customer: inv.customers?.name ?? '',
          status: invStatus(inv),
          date: inv.due_date ?? inv.updated_at,
          updated_at: inv.updated_at,
          path: `/invoices/${inv.id}`,
        })),
      ].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 5)

      setRecentItems(combined)
      setLoading(false)
    }
    fetchAll()
  }, [user.id])

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  // Attention summary — what needs the user's eyes today
  const attention = [
    stats.unpaidInvoices > 0 && `${stats.unpaidInvoices} ${stats.unpaidInvoices === 1 ? 'obetald faktura' : 'obetalda fakturor'}`,
    stats.pendingQuotes > 0 && `${stats.pendingQuotes} ${stats.pendingQuotes === 1 ? 'offert att hantera' : 'offerter att hantera'}`,
    stats.activeJobs > 0 && `${stats.activeJobs} ${stats.activeJobs === 1 ? 'aktivt jobb' : 'aktiva jobb'}`,
  ].filter(Boolean)

  const todayRaw = new Intl.DateTimeFormat('sv-SE', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date())
  const todayLabel = todayRaw.charAt(0).toUpperCase() + todayRaw.slice(1)

  // ── Shared sub-components ────────────────────────────────────────────────

  function HeroSection() {
    return (
      <section className="relative overflow-hidden" style={{ background: '#111111' }}>
        <Noise />
        <div
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{
            top: '-120px', right: '-80px', width: '320px', height: '320px',
            background: 'radial-gradient(circle, rgba(0,85,255,0.28) 0%, transparent 70%)',
          }}
        />
        <div className="relative px-4 md:px-8 pt-8 pb-9">
          {!loading && logoUrl && (
            <div className="inline-flex items-center rounded-lg px-3 py-2 mb-4" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <img
                src={logoUrl}
                alt="Företagslogotyp"
                className="object-contain"
                style={{ maxHeight: '48px' }}
              />
            </div>
          )}
          <p className="text-sm text-gray-400">{todayLabel}</p>
          <h1 className="text-[2rem] font-extrabold text-white leading-tight mt-1" style={{ letterSpacing: '-0.02em' }}>
            {loading ? 'Hej' : (companyName ? `Hej, ${companyName}` : 'Hej')}
          </h1>
          <div className="mt-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">
              Intäkt denna månad
            </p>
            {loading ? (
              <div className="h-12 w-44 rounded-xl animate-pulse mt-2" style={{ background: '#222222' }} />
            ) : (
              <p className="text-gradient-blue text-5xl font-extrabold tabular-nums mt-1.5" style={{ letterSpacing: '-0.02em' }}>
                {formatSEK(stats.monthlyRevenue)}
              </p>
            )}
          </div>
          {!loading && attention.length > 0 && (
            <p className="text-sm text-gray-400 mt-5 leading-relaxed">
              Att hantera: <span className="text-white font-medium">{attention.join(' · ')}</span>
            </p>
          )}
          {!loading && attention.length === 0 && (
            <p className="text-sm text-gray-400 mt-5">Allt är hanterat. Snyggt jobbat.</p>
          )}
        </div>
        {/* Fade to content background */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-10 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #F8F8F8)' }}
        />
      </section>
    )
  }

  function QuickActions() {
    return (
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/jobs/new')}
          className="btn-lift flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark active:bg-primary-darker text-white font-semibold h-11 rounded-xl text-sm"
        >
          <Plus className="w-4 h-4" />
          Nytt jobb
        </button>
        <button
          onClick={() => navigate('/quotes/new')}
          className="btn-lift flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-semibold h-11 rounded-xl text-sm"
        >
          <Plus className="w-4 h-4" />
          Ny offert
        </button>
      </div>
    )
  }

  function RecentActivity() {
    if (recentItems.length === 0) {
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
      <div className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Senaste aktivitet
          </h2>
          <Link to="/jobs" className="text-xs font-semibold text-primary inline-flex items-center gap-1 hover:text-primary-dark transition-colors">
            Visa alla
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {recentItems.map(item => {
            const badgeCls = item.type === 'job'
              ? (JOB_BADGE[item.status] ?? JOB_BADGE.planerad)
              : (INV_BADGE[item.status] ?? INV_BADGE.obetald)
            const badgeLabel = item.type === 'job'
              ? (JOB_LABEL[item.status] ?? item.status)
              : (INV_LABEL[item.status] ?? item.status)
            const TypeIcon = item.type === 'job' ? Briefcase : Receipt
            return (
              <Link
                key={`${item.type}-${item.id}`}
                to={item.path}
                className="card-lift flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-gray-300 active:bg-gray-50"
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  item.type === 'job' ? 'bg-blue-50' : 'bg-amber-50'
                }`}>
                  <TypeIcon className={`w-4 h-4 ${item.type === 'job' ? 'text-primary' : 'text-amber-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{item.title}</p>
                  {item.customer && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{item.customer}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  {item.date && (
                    <span className="text-xs text-gray-400">{formatDateShort(item.date)}</span>
                  )}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeCls}`}>
                    {badgeLabel}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  function StatCards({ vertical = false }) {
    if (loading) {
      return (
        <div className={vertical ? 'space-y-3' : 'grid grid-cols-3 gap-3'}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl p-5 animate-pulse space-y-3" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
              <div className="h-8 w-10 rounded-xl" style={{ background: '#2A2A2A' }} />
              <div className="h-3 w-full rounded-xl" style={{ background: '#2A2A2A' }} />
            </div>
          ))}
        </div>
      )
    }
    const cards = [
      {
        label: 'Aktiva jobb',
        value: stats.activeJobs,
        Icon: Briefcase,
        iconColor: '#4D8EFF',
        iconBg: 'rgba(0, 85, 255, 0.15)',
        accentColor: '#0055FF',
        valueColor: 'white',
        path: '/jobs',
      },
      {
        label: 'Obetalda fakturor',
        value: stats.unpaidInvoices,
        Icon: AlertCircle,
        iconColor: '#F59E0B',
        iconBg: 'rgba(217, 119, 6, 0.15)',
        accentColor: '#D97706',
        valueColor: stats.unpaidInvoices > 0 ? '#F59E0B' : 'white',
        path: '/invoices',
      },
      {
        label: 'Offerter väntar',
        value: stats.pendingQuotes,
        Icon: FileText,
        iconColor: '#A78BFA',
        iconBg: 'rgba(124, 58, 237, 0.15)',
        accentColor: '#7C3AED',
        valueColor: 'white',
        path: '/quotes',
      },
    ]
    return (
      <div className={vertical ? 'space-y-3' : 'grid grid-cols-3 gap-3'}>
        {cards.map(c => (
          <StatCard key={c.label} {...c} onClick={() => navigate(c.path)} />
        ))}
      </div>
    )
  }

  return (
    <Page className="min-h-screen flex flex-col">

      {/* Mobile header — hidden on desktop (sidebar handles navigation) */}
      <header className="md:hidden bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <span className="font-extrabold text-primary text-lg tracking-tight">Hantverksappen</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('/settings')}
            className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-xl hover:bg-gray-50"
            aria-label="Inställningar"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={handleSignOut}
            className="text-gray-400 hover:text-danger transition-colors p-2 rounded-xl hover:bg-gray-50"
            aria-label="Logga ut"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── Mobile layout (single column) ─────────────────────────── */}
      <div className="md:hidden flex flex-col flex-1" style={{ background: '#F8F8F8' }}>
        <HeroSection />
        <div className="max-w-lg mx-auto w-full px-4 py-5 space-y-5 flex-1">
          {loading ? <StatCards /> : (
            <>
              <StatCards />
              <QuickActions />
              <RecentActivity />
            </>
          )}
        </div>
      </div>

      {/* ── Desktop layout (two columns) ──────────────────────────── */}
      <div className="hidden md:flex flex-1 gap-8 px-12 py-8" style={{ background: '#F8F8F8' }}>
        {/* Left column */}
        <div className="flex-1 min-w-0 space-y-6">
          <div className="rounded-2xl overflow-hidden">
            <HeroSection />
          </div>
          <div className="space-y-4">
            <QuickActions />
            <RecentActivity />
          </div>
        </div>

        {/* Right column — stat summary */}
        <div className="w-72 flex-shrink-0">
          <StatCards vertical />
        </div>
      </div>

    </Page>
  )
}

function StatCard({ label, value, Icon, iconColor, iconBg, accentColor, valueColor, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl p-5 text-left w-full cursor-pointer transition-colors duration-200"
      style={{
        background: '#1A1A1A',
        border: '1px solid #2A2A2A',
        borderBottom: `2px solid ${accentColor}`,
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#222222'}
      onMouseLeave={e => e.currentTarget.style.background = '#1A1A1A'}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: 36, height: 36, borderRadius: '50%', background: iconBg }}
        >
          <Icon style={{ color: iconColor, width: 18, height: 18 }} strokeWidth={2} />
        </div>
        <span
          className="text-3xl font-bold tabular-nums leading-none"
          style={{ color: valueColor, letterSpacing: '-0.02em' }}
        >
          {value}
        </span>
      </div>
      <p className="text-sm" style={{ color: '#888888' }}>{label}</p>
    </button>
  )
}
