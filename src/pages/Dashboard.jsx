import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import { SkeletonCard } from '../components/Skeleton'
import {
  Settings, LogOut, Briefcase, Receipt, FileText, TrendingUp,
  Plus, ChevronRight
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
  betald:   'bg-green-100 text-green-700',
  försenad: 'bg-red-100 text-red-700',
}
const JOB_LABEL = { planerad: 'Planerad', pågående: 'Pågående', avslutad: 'Avslutad' }
const INV_LABEL = { obetald: 'Obetald', betald: 'Betald', försenad: 'Försenad' }

// ── component ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [companyName, setCompanyName] = useState('')
  const [stats, setStats] = useState({ activeJobs: 0, unpaidInvoices: 0, pendingQuotes: 0, monthlyRevenue: 0 })
  const [recentItems, setRecentItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      const [{ data: profile }, { data: jobs }, { data: invoices }, { data: quotes }] =
        await Promise.all([
          supabase.from('company_profiles').select('company_name').eq('user_id', user.id).single(),
          supabase.from('jobs').select('id, title, status, scheduled_date, updated_at, customers(name)').eq('user_id', user.id).order('updated_at', { ascending: false }),
          supabase.from('invoices').select('id, invoice_number, status, due_date, paid_date, rot_rut_enabled, updated_at, customers(name), invoice_items(quantity, unit_price, type, vat_rate)').eq('user_id', user.id).order('updated_at', { ascending: false }),
          supabase.from('quotes').select('id, status, updated_at').eq('user_id', user.id),
        ])

      setCompanyName(profile?.company_name ?? '')

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

  const greeting = companyName ? `Hej, ${companyName}` : 'Hej'

  return (
    <div className="min-h-screen flex flex-col pb-20" style={{ background: '#F8F8F8' }}>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <span className="font-bold text-primary text-lg tracking-tight">Hantverksappen</span>
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

      <div className="max-w-lg mx-auto w-full px-4 py-5 space-y-5 flex-1">

        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}</h1>
          <p className="text-sm text-gray-400 mt-0.5 capitalize">
            {new Intl.DateTimeFormat('sv-SE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date()).toLowerCase()}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <>
            {/* ── Stat cards 2×2 ── */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Aktiva jobb"
                value={stats.activeJobs}
                Icon={Briefcase}
                chipCls="bg-blue-50 text-primary"
                onClick={() => navigate('/jobs')}
              />
              <StatCard
                label="Utestående fakturor"
                value={stats.unpaidInvoices}
                Icon={Receipt}
                chipCls="bg-amber-50 text-warning"
                onClick={() => navigate('/invoices')}
              />
              <StatCard
                label="Offerter att hantera"
                value={stats.pendingQuotes}
                Icon={FileText}
                chipCls="bg-gray-100 text-gray-600"
                onClick={() => navigate('/quotes')}
              />
              <StatCard
                label="Månadsintäkt"
                value={formatSEK(stats.monthlyRevenue)}
                Icon={TrendingUp}
                chipCls="bg-green-50 text-success"
                isText
                onClick={() => navigate('/invoices')}
              />
            </div>

            {/* ── Quick actions ── */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/jobs/new')}
                className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark active:bg-primary-darker text-white font-semibold h-11 rounded-xl transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                Nytt jobb
              </button>
              <button
                onClick={() => navigate('/quotes/new')}
                className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-semibold h-11 rounded-xl transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                Ny offert
              </button>
            </div>

            {/* ── Recent activity ── */}
            {recentItems.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-0.5">
                  Senaste aktivitet
                </h2>
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
                        className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-gray-300 transition-all active:bg-gray-50"
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
            )}

            {/* Empty state */}
            {recentItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                  <Briefcase className="w-8 h-8 text-primary" />
                </div>
                <p className="text-gray-700 font-semibold">Välkommen till Hantverksappen</p>
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

function StatCard({ label, value, Icon, chipCls, isText = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-gray-300 active:bg-gray-50 transition-all duration-200 w-full"
    >
      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg mb-3 ${chipCls}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className={`${isText ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 tabular-nums leading-none`}>
        {value}
      </p>
      <p className="text-xs text-gray-600 font-medium mt-1.5 leading-tight">{label}</p>
    </button>
  )
}
