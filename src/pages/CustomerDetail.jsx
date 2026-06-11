import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ChevronLeft, Pencil, Phone, Mail, MapPin, StickyNote, Briefcase, ChevronRight, Plus, FileText, Receipt, Trash2 } from 'lucide-react'
import { SkeletonPage } from '../components/Skeleton'
import { useConfirmDialog } from '../hooks/useConfirmDialog'

// ── helpers ───────────────────────────────────────────────────────────────────

function todayISO() { return new Date().toISOString().slice(0, 10) }

function formatDate(iso) {
  if (!iso) return '–'
  return new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
}

function formatSEK(n) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(n ?? 0) + ' kr'
}

function calcTotal(items = [], rotRutEnabled = false) {
  const subtotal = items.reduce((s, r) => s + (r.quantity ?? 0) * (r.unit_price ?? 0), 0)
  const vat = items.reduce((s, r) => s + (r.quantity ?? 0) * (r.unit_price ?? 0) * ((r.vat_rate ?? 25) / 100), 0)
  const labour = items.filter(r => r.type === 'arbete').reduce((s, r) => s + (r.quantity ?? 0) * (r.unit_price ?? 0), 0)
  const deduction = rotRutEnabled ? labour * 0.3 : 0
  return subtotal + vat - deduction
}

function effectiveInvoiceStatus(invoice) {
  if (invoice.status === 'obetald' && invoice.due_date && invoice.due_date < todayISO()) return 'försenad'
  return invoice.status ?? 'obetald'
}

// ── status badge configs ──────────────────────────────────────────────────────

const QUOTE_BADGE = {
  utkast:   'bg-gray-100 text-gray-600',
  skickad:  'bg-blue-100 text-blue-700',
  godkänd:  'bg-green-100 text-green-700',
  avvisad:  'bg-red-100 text-red-600',
}
const QUOTE_LABEL = {
  utkast:  'Utkast',
  skickad: 'Skickad',
  godkänd: 'Godkänd',
  avvisad: 'Avvisad',
}

const JOB_BADGE = {
  planerad: 'bg-gray-100 text-gray-600',
  pågående: 'bg-blue-100 text-blue-700',
  avslutad: 'bg-green-100 text-green-700',
}
const JOB_LABEL = {
  planerad: 'Planerat',
  pågående: 'Pågående',
  avslutad: 'Avslutat',
}

const INVOICE_BADGE = {
  utkast:   'bg-gray-100 text-gray-600',
  obetald:  'bg-amber-100 text-amber-700',
  betald:   'bg-green-100 text-green-700',
  försenad: 'bg-red-100 text-red-600',
}
const INVOICE_LABEL = {
  utkast:   'Utkast',
  obetald:  'Obetald',
  betald:   'Betald',
  försenad: 'Förfallen',
}

// ── skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 last:border-b-0 animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
      <div className="h-5 bg-gray-100 rounded-full w-14" />
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

const TABS = ['Offerter', 'Jobb', 'Fakturor']

export default function CustomerDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)

  const [quotes, setQuotes] = useState([])
  const [jobs, setJobs] = useState([])
  const [invoices, setInvoices] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const { confirmDialog, confirm } = useConfirmDialog()

  // Load customer
  useEffect(() => {
    async function loadCustomer() {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error || !data) { navigate('/customers'); return }
      setCustomer(data)
      setLoading(false)
    }
    loadCustomer()
  }, [id, user.id, navigate])

  // Load history
  useEffect(() => {
    async function loadHistory() {
      const [{ data: q }, { data: j }, { data: inv }] = await Promise.all([
        supabase
          .from('quotes')
          .select('id, quote_number, created_at, status, rot_rut_enabled, quote_items(quantity, unit_price, vat_rate, type)')
          .eq('customer_id', id)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('jobs')
          .select('id, title, scheduled_date, status')
          .eq('customer_id', id)
          .eq('user_id', user.id)
          .order('scheduled_date', { ascending: false }),
        supabase
          .from('invoices')
          .select('id, invoice_number, invoice_date, due_date, status, rot_rut_enabled, invoice_items(quantity, unit_price, vat_rate, type)')
          .eq('customer_id', id)
          .eq('user_id', user.id)
          .order('invoice_date', { ascending: false }),
      ])
      setQuotes(q ?? [])
      setJobs(j ?? [])
      setInvoices(inv ?? [])
      setHistoryLoading(false)
    }
    loadHistory()
  }, [id, user.id])

  async function handleDeleteCustomer() {
    const linkedCount = quotes.length + jobs.length + invoices.length
    const warningText = linkedCount > 0
      ? ` Kunden har ${linkedCount} kopplad${linkedCount === 1 ? '' : 'e'} post${linkedCount === 1 ? '' : 'er'} (offerter, jobb, fakturor) som också raderas.`
      : ''
    const ok = await confirm(
      'Radera kund',
      `Är du säker? Kunden och all kopplad data raderas permanent.${warningText}`
    )
    if (!ok) return
    setDeleting(true)
    setDeleteError('')
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) {
      setDeleteError('Kunde inte radera kunden. Försök igen.')
      setDeleting(false)
    } else {
      navigate('/customers')
    }
  }

  if (loading) return <SkeletonPage />

  const addressParts = [
    customer.address,
    [customer.postal_code, customer.city].filter(Boolean).join(' '),
  ].filter(Boolean)
  const fullAddress = addressParts.join(', ')

  return (
    <>
      {confirmDialog}
    <div className="min-h-screen pb-20" style={{ background: '#F8F8F8' }}>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate('/customers')}
          className="text-gray-500 hover:text-gray-800 transition-colors p-1.5 -ml-1 rounded-xl hover:bg-gray-100"
          aria-label="Tillbaka"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg flex-1 truncate">{customer.name}</h1>
        <button
          onClick={() => navigate(`/customers/${id}/edit`)}
          className="text-gray-400 hover:text-gray-700 transition-colors p-1.5 rounded-xl hover:bg-gray-100"
          aria-label="Redigera kund"
        >
          <Pencil className="w-5 h-5" />
        </button>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-3">

        {/* Avatar + name banner */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-primary">{customer.name[0].toUpperCase()}</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-base">{customer.name}</p>
            {customer.city && <p className="text-sm text-gray-400 mt-0.5">{customer.city}</p>}
          </div>
        </div>

        {/* Contact details */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Kontaktuppgifter</p>
          </div>

          {customer.phone && (
            <a
              href={`tel:${customer.phone}`}
              className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Telefon</p>
                <p className="text-sm text-gray-800 font-medium mt-0.5">{customer.phone}</p>
              </div>
            </a>
          )}

          {customer.email && (
            <a
              href={`mailto:${customer.email}`}
              className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">E-post</p>
                <p className="text-sm text-gray-800 font-medium mt-0.5">{customer.email}</p>
              </div>
            </a>
          )}

          {fullAddress && (
            <div className="flex items-start gap-4 px-5 py-4 border-b border-gray-100">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Adress</p>
                <p className="text-sm text-gray-800 font-medium mt-0.5 leading-relaxed">{fullAddress}</p>
              </div>
            </div>
          )}

          {customer.notes && (
            <div className="flex items-start gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <StickyNote className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Anteckningar</p>
                <p className="text-sm text-gray-800 mt-0.5 leading-relaxed whitespace-pre-wrap">{customer.notes}</p>
              </div>
            </div>
          )}

          {!customer.phone && !customer.email && !fullAddress && !customer.notes && (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-gray-400">Inga kontaktuppgifter sparade.</p>
            </div>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate(`/jobs/new?customer_id=${id}`)}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark active:bg-primary-darker text-white font-semibold h-12 rounded-xl transition-all"
        >
          <Briefcase className="w-4 h-4" />
          Skapa jobb
        </button>

        {/* ── History tabs ── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-gray-200">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                onClick={() => setActiveTab(i)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                  activeTab === i
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 0 && (
            <QuotesTab
              quotes={quotes}
              loading={historyLoading}
              onRow={qid => navigate(`/quotes/${qid}`)}
              onNew={() => navigate(`/quotes/new?customer_id=${id}`)}
            />
          )}
          {activeTab === 1 && (
            <JobsTab
              jobs={jobs}
              loading={historyLoading}
              onRow={jid => navigate(`/jobs/${jid}`)}
            />
          )}
          {activeTab === 2 && (
            <InvoicesTab
              invoices={invoices}
              loading={historyLoading}
              onRow={iid => navigate(`/invoices/${iid}`)}
              onNew={() => navigate(`/invoices/new?customer_id=${id}`)}
            />
          )}
        </div>

        {deleteError && (
          <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm">{deleteError}</div>
        )}

        {/* Delete customer */}
        <button
          onClick={handleDeleteCustomer}
          disabled={deleting || historyLoading}
          className="w-full flex items-center justify-center gap-2 bg-white border border-red-200 hover:bg-red-50 active:bg-red-100 disabled:opacity-60 text-red-600 font-semibold h-12 rounded-xl transition-all"
        >
          <Trash2 className="w-4 h-4" />
          {deleting ? 'Raderar…' : 'Radera kund'}
        </button>
      </div>
    </div>
    </>
  )
}

// ── Quotes tab ────────────────────────────────────────────────────────────────

function QuotesTab({ quotes, loading, onRow, onNew }) {
  if (loading) return <SkeletonRows />

  if (quotes.length === 0) {
    return (
      <div className="px-5 py-10 flex flex-col items-center gap-3 text-center">
        <FileText className="w-8 h-8 text-gray-200" />
        <p className="text-sm font-semibold text-gray-500">Inga offerter än</p>
        <button
          onClick={onNew}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Skapa offert
        </button>
      </div>
    )
  }

  return (
    <ul>
      {quotes.map(q => {
        const total = calcTotal(q.quote_items, q.rot_rut_enabled)
        const status = q.status ?? 'utkast'
        return (
          <li key={q.id}>
            <button
              onClick={() => onRow(q.id)}
              className="w-full flex items-center gap-3 px-5 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {q.quote_number ?? '–'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(q.created_at)} · {formatSEK(total)}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${QUOTE_BADGE[status] ?? QUOTE_BADGE.utkast}`}>
                {QUOTE_LABEL[status] ?? status}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}

// ── Jobs tab ──────────────────────────────────────────────────────────────────

function JobsTab({ jobs, loading, onRow }) {
  if (loading) return <SkeletonRows />

  if (jobs.length === 0) {
    return (
      <div className="px-5 py-10 flex flex-col items-center gap-3 text-center">
        <Briefcase className="w-8 h-8 text-gray-200" />
        <p className="text-sm font-semibold text-gray-500">Inga jobb än</p>
      </div>
    )
  }

  return (
    <ul>
      {jobs.map(j => {
        const status = j.status ?? 'planerad'
        return (
          <li key={j.id}>
            <button
              onClick={() => onRow(j.id)}
              className="w-full flex items-center gap-3 px-5 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{j.title ?? '–'}</p>
                {j.scheduled_date && (
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(j.scheduled_date)}</p>
                )}
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${JOB_BADGE[status] ?? JOB_BADGE.planerad}`}>
                {JOB_LABEL[status] ?? status}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}

// ── Invoices tab ──────────────────────────────────────────────────────────────

function InvoicesTab({ invoices, loading, onRow, onNew }) {
  if (loading) return <SkeletonRows />

  if (invoices.length === 0) {
    return (
      <div className="px-5 py-10 flex flex-col items-center gap-3 text-center">
        <Receipt className="w-8 h-8 text-gray-200" />
        <p className="text-sm font-semibold text-gray-500">Inga fakturor än</p>
        <button
          onClick={onNew}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Skapa faktura
        </button>
      </div>
    )
  }

  return (
    <ul>
      {invoices.map(inv => {
        const total = calcTotal(inv.invoice_items, inv.rot_rut_enabled)
        const status = effectiveInvoiceStatus(inv)
        return (
          <li key={inv.id}>
            <button
              onClick={() => onRow(inv.id)}
              className="w-full flex items-center gap-3 px-5 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {inv.invoice_number ?? '–'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(inv.invoice_date)}
                  {inv.due_date ? ` · Förfaller ${formatDate(inv.due_date)}` : ''}
                  {' · '}{formatSEK(total)}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${INVOICE_BADGE[status] ?? INVOICE_BADGE.obetald}`}>
                {INVOICE_LABEL[status] ?? status}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <div>
      {[1, 2, 3].map(i => <SkeletonRow key={i} />)}
    </div>
  )
}
