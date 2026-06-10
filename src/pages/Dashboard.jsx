import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'

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
  const labourSubtotal = items
    .filter(r => r.type === 'arbete')
    .reduce((s, r) => s + (r.quantity ?? 0) * (r.unit_price ?? 0), 0)
  const vatTotal = items.reduce((s, r) => {
    const net = (r.quantity ?? 0) * (r.unit_price ?? 0)
    return s + net * ((r.vat_rate ?? 25) / 100)
  }, 0)
  const deduction = inv.rot_rut_enabled ? labourSubtotal * 0.3 : 0
  return subtotal + vatTotal - deduction
}

// Effective invoice status (obetald + overdue → försenad)
function invStatus(inv) {
  if (inv.status === 'obetald' && inv.due_date && inv.due_date < todayISO()) return 'försenad'
  return inv.status ?? 'obetald'
}

// ── badge styles ───────────────────────────────────────────────────────────

const JOB_BADGE = {
  planerad: 'bg-blue-100 text-blue-600',
  pågående: 'bg-amber-100 text-warning',
  avslutad: 'bg-green-100 text-success',
}

const INV_BADGE = {
  obetald:  'bg-amber-100 text-warning',
  betald:   'bg-green-100 text-success',
  försenad: 'bg-red-100 text-danger',
}

const JOB_LABEL = { planerad: 'Planerad', pågående: 'Pågående', avslutad: 'Avslutad' }
const INV_LABEL = { obetald: 'Obetald', betald: 'Betald', försenad: 'Försenad' }

// ── component ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [companyName, setCompanyName] = useState('')
  const [stats, setStats] = useState({
    activeJobs: 0,
    unpaidInvoices: 0,
    pendingQuotes: 0,
    monthlyRevenue: 0,
  })
  const [recentItems, setRecentItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      const [
        { data: profile },
        { data: jobs },
        { data: invoices },
        { data: quotes },
      ] = await Promise.all([
        supabase
          .from('company_profiles')
          .select('company_name')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('jobs')
          .select('id, title, status, scheduled_date, updated_at, customers(name)')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false }),
        supabase
          .from('invoices')
          .select('id, invoice_number, status, due_date, paid_date, rot_rut_enabled, updated_at, customers(name), invoice_items(quantity, unit_price, type, vat_rate)')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false }),
        supabase
          .from('quotes')
          .select('id, status, updated_at')
          .eq('user_id', user.id),
      ])

      // Company name
      setCompanyName(profile?.company_name ?? '')

      const jobList     = jobs     ?? []
      const invoiceList = invoices ?? []
      const quoteList   = quotes   ?? []

      // ── Stats ──
      const activeJobs = jobList.filter(j => j.status === 'planerad' || j.status === 'pågående').length

      const unpaidInvoices = invoiceList.filter(inv => inv.status === 'obetald').length

      const pendingQuotes = quoteList.filter(q => q.status === 'utkast' || q.status === 'skickad').length

      const monthStart = thisMonthStart()
      const monthlyRevenue = invoiceList
        .filter(inv => inv.status === 'betald' && inv.paid_date && inv.paid_date >= monthStart)
        .reduce((sum, inv) => sum + calcInvoiceTotal(inv), 0)

      setStats({ activeJobs, unpaidInvoices, pendingQuotes, monthlyRevenue })

      // ── Recent activity: merge jobs + invoices, sort by updated_at, take 5 ──
      const jobItems = jobList.map(j => ({
        type: 'job',
        id: j.id,
        title: j.title ?? 'Namnlöst jobb',
        customer: j.customers?.name ?? '',
        status: j.status ?? 'planerad',
        date: j.scheduled_date ?? j.updated_at,
        updated_at: j.updated_at,
        path: `/jobs/${j.id}`,
      }))

      const invoiceItems = invoiceList.map(inv => ({
        type: 'invoice',
        id: inv.id,
        title: `Faktura ${inv.invoice_number ?? '–'}`,
        customer: inv.customers?.name ?? '',
        status: invStatus(inv),
        date: inv.due_date ?? inv.updated_at,
        updated_at: inv.updated_at,
        path: `/invoices/${inv.id}`,
      }))

      const combined = [...jobItems, ...invoiceItems]
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 5)

      setRecentItems(combined)
      setLoading(false)
    }

    fetchAll()
  }, [user.id])

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const greeting = companyName ? `Hej, ${companyName}!` : 'Hej!'

  // ── render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <span className="font-bold text-primary text-lg">Hantverksappen</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/settings')}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-lg"
            aria-label="Inställningar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-danger font-medium transition-colors"
          >
            Logga ut
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto w-full px-4 py-5 space-y-5 flex-1">

        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{greeting}</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Intl.DateTimeFormat('sv-SE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
        ) : (
          <>
            {/* ── Summary cards 2×2 ── */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Aktiva jobb"
                value={stats.activeJobs}
                accent="text-primary"
                bg="bg-blue-50"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
                onClick={() => navigate('/jobs')}
              />
              <StatCard
                label="Utestående fakturor"
                value={stats.unpaidInvoices}
                accent="text-warning"
                bg="bg-amber-50"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                onClick={() => navigate('/invoices')}
              />
              <StatCard
                label="Offerter att hantera"
                value={stats.pendingQuotes}
                accent="text-gray-600"
                bg="bg-gray-100"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h6m-6 4h4M5 4h14a2 2 0 012 2v13a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
                  </svg>
                }
                onClick={() => navigate('/quotes')}
              />
              <StatCard
                label="Månadsintäkt"
                value={formatSEK(stats.monthlyRevenue)}
                accent="text-success"
                bg="bg-green-50"
                isText
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                onClick={() => navigate('/invoices')}
              />
            </div>

            {/* ── Quick actions ── */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/jobs/new')}
                className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Nytt jobb
              </button>
              <button
                onClick={() => navigate('/quotes/new')}
                className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Ny offert
              </button>
            </div>

            {/* ── Recent activity ── */}
            {recentItems.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-0.5">
                  Senaste aktivitet
                </h2>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {recentItems.map((item, index) => {
                    const badgeCls = item.type === 'job'
                      ? (JOB_BADGE[item.status] ?? JOB_BADGE.planerad)
                      : (INV_BADGE[item.status] ?? INV_BADGE.obetald)
                    const badgeLabel = item.type === 'job'
                      ? (JOB_LABEL[item.status] ?? item.status)
                      : (INV_LABEL[item.status] ?? item.status)
                    const typeIcon = item.type === 'job' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )

                    return (
                      <Link
                        key={`${item.type}-${item.id}`}
                        to={item.path}
                        className={`flex items-center gap-3 px-4 min-h-[60px] hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                          index < recentItems.length - 1 ? 'border-b border-gray-100' : ''
                        }`}
                      >
                        {/* type icon */}
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                          {typeIcon}
                        </div>

                        {/* title + customer */}
                        <div className="flex-1 min-w-0 py-3">
                          <p className="font-semibold text-gray-800 text-sm truncate">{item.title}</p>
                          {item.customer && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{item.customer}</p>
                          )}
                        </div>

                        {/* date + badge */}
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0 py-3">
                          {item.date && (
                            <span className="text-xs text-gray-400">{formatDateShort(item.date)}</span>
                          )}
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeCls}`}>
                            {badgeLabel}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Empty state when nothing at all */}
            {recentItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="text-4xl mb-3">🔨</div>
                <p className="text-gray-500 font-semibold text-sm">Välkommen till Hantverksappen!</p>
                <p className="text-gray-400 text-sm mt-1">Skapa ett jobb eller en offert för att komma igång.</p>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

// ── StatCard ───────────────────────────────────────────────────────────────

function StatCard({ label, value, accent, bg, icon, isText = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`${bg} rounded-2xl p-4 text-left border border-transparent hover:border-gray-200 active:brightness-95 transition-all w-full`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="w-8 h-8 rounded-lg bg-white/70 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <p className={`${isText ? 'text-xl' : 'text-3xl'} font-bold ${accent} tabular-nums leading-none`}>
        {value}
      </p>
      <p className="text-xs text-gray-500 font-medium mt-1 leading-tight">{label}</p>
    </button>
  )
}
