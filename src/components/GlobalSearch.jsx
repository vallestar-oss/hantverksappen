import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Search, Users, FileText, Receipt, Briefcase, X, Loader2 } from 'lucide-react'

// Global search — full-screen modal over everything. Loads all data once per
// open session, then filters instantly client-side. Ctrl+K / Cmd+K to open.

function formatSEK(n) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(n ?? 0) + ' kr'
}

function calcTotal(items = []) {
  return items.reduce((s, r) => s + (r.quantity ?? 0) * (r.unit_price ?? 0), 0)
}

const QUOTE_LABEL = { utkast: 'Utkast', skickad: 'Skickad', godkänd: 'Godkänd', avvisad: 'Avvisad' }
const INVOICE_LABEL = { obetald: 'Obetald', betald: 'Betald', försenad: 'Försenad' }
const JOB_LABEL = { planerad: 'Planerad', pågående: 'Pågående', avslutad: 'Avslutad' }

const QUOTE_BADGE = {
  utkast: 'bg-gray-100 text-gray-600', skickad: 'bg-blue-100 text-blue-700',
  godkänd: 'bg-green-100 text-green-700', avvisad: 'bg-red-100 text-red-600',
}
const INVOICE_BADGE = {
  obetald: 'bg-amber-100 text-amber-700', betald: 'bg-green-100 text-green-700',
  försenad: 'bg-red-100 text-red-600',
}
const JOB_BADGE = {
  planerad: 'bg-blue-100 text-blue-700', pågående: 'bg-amber-100 text-amber-700',
  avslutad: 'bg-green-100 text-green-700',
}

const GROUPS = [
  { key: 'customers', label: 'Kunder',   Icon: Users },
  { key: 'quotes',    label: 'Offerter', Icon: FileText },
  { key: 'invoices',  label: 'Fakturor', Icon: Receipt },
  { key: 'jobs',      label: 'Jobb',     Icon: Briefcase },
]

const SEARCH_CSS = `
@keyframes search-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes search-slide-in {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.search-backdrop { animation: search-fade-in 150ms ease both; }
.search-panel    { animation: search-slide-in 200ms ease both; }
`

// Wrapper — mounting the modal fresh on each open gives clean state (query,
// data) without effect-driven resets.
export default function GlobalSearch({ open, onClose }) {
  if (!open) return null
  return <SearchModal onClose={onClose} />
}

function SearchModal({ onClose }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load all searchable data once per open
  useEffect(() => {
    if (!user) return
    let cancelled = false
    async function loadAll() {
      const [{ data: customers }, { data: quotes }, { data: invoices }, { data: jobs }] =
        await Promise.all([
          supabase.from('customers').select('id, name, phone, email, city').eq('user_id', user.id),
          supabase.from('quotes').select('id, quote_number, status, customers(name), quote_items(quantity, unit_price)').eq('user_id', user.id),
          supabase.from('invoices').select('id, invoice_number, status, due_date, customers(name), invoice_items(quantity, unit_price)').eq('user_id', user.id),
          supabase.from('jobs').select('id, title, status, customers(name)').eq('user_id', user.id),
        ])
      if (cancelled) return
      setData({
        customers: customers ?? [],
        quotes: quotes ?? [],
        invoices: invoices ?? [],
        jobs: jobs ?? [],
      })
      setLoading(false)
    }
    loadAll()
    return () => { cancelled = true }
  }, [user])

  // Autofocus the input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Escape closes
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || !data) return null

    function todayISO() { return new Date().toISOString().slice(0, 10) }

    const customers = data.customers
      .filter(c =>
        c.name?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q))
      .map(c => ({
        id: c.id, path: `/customers/${c.id}`,
        title: c.name, sub: [c.phone, c.city].filter(Boolean).join(' · '),
      }))

    const quotes = data.quotes
      .filter(qu =>
        qu.quote_number?.toLowerCase().includes(q) ||
        qu.customers?.name?.toLowerCase().includes(q))
      .map(qu => ({
        id: qu.id, path: `/quotes/${qu.id}`,
        title: `Offert ${qu.quote_number ?? '–'}`, sub: qu.customers?.name ?? '',
        amount: formatSEK(calcTotal(qu.quote_items)),
        badge: QUOTE_LABEL[qu.status] ?? qu.status,
        badgeCls: QUOTE_BADGE[qu.status] ?? QUOTE_BADGE.utkast,
      }))

    const invoices = data.invoices
      .filter(inv =>
        inv.invoice_number?.toLowerCase().includes(q) ||
        inv.customers?.name?.toLowerCase().includes(q))
      .map(inv => {
        const status = inv.status === 'obetald' && inv.due_date && inv.due_date < todayISO()
          ? 'försenad' : (inv.status ?? 'obetald')
        return {
          id: inv.id, path: `/invoices/${inv.id}`,
          title: `Faktura ${inv.invoice_number ?? '–'}`, sub: inv.customers?.name ?? '',
          amount: formatSEK(calcTotal(inv.invoice_items)),
          badge: INVOICE_LABEL[status] ?? status,
          badgeCls: INVOICE_BADGE[status] ?? INVOICE_BADGE.obetald,
        }
      })

    const jobs = data.jobs
      .filter(j =>
        j.title?.toLowerCase().includes(q) ||
        j.customers?.name?.toLowerCase().includes(q))
      .map(j => ({
        id: j.id, path: `/jobs/${j.id}`,
        title: j.title ?? 'Namnlöst jobb', sub: j.customers?.name ?? '',
        badge: JOB_LABEL[j.status] ?? j.status,
        badgeCls: JOB_BADGE[j.status] ?? JOB_BADGE.planerad,
      }))

    return { customers, quotes, invoices, jobs }
  }, [query, data])

  const totalHits = results
    ? GROUPS.reduce((s, g) => s + results[g.key].length, 0)
    : 0

  const goTo = useCallback(path => {
    onClose()
    navigate(path)
  }, [navigate, onClose])

  return (
    <div
      className="search-backdrop fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh] pb-8"
      style={{ background: 'rgba(17,17,17,0.55)', backdropFilter: 'blur(2px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <style>{SEARCH_CSS}</style>
      <div className="search-panel w-full max-w-xl bg-white rounded-xl overflow-hidden flex flex-col max-h-[70vh]"
        style={{ boxShadow: '0 16px 48px rgba(17,17,17,0.25)' }}>

        {/* Input row */}
        <div className="flex items-center gap-3 px-4 border-b border-gray-200 flex-shrink-0">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Sök kunder, offerter, fakturor, jobb…"
            className="flex-1 h-14 text-base text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
          />
          <kbd className="hidden md:inline-flex items-center text-[11px] font-semibold text-gray-400 border border-gray-200 rounded-md px-1.5 py-0.5 flex-shrink-0">
            Esc
          </kbd>
          <button
            onClick={onClose}
            className="md:hidden text-gray-400 hover:text-gray-700 transition-colors p-1 -mr-1 rounded-lg flex-shrink-0"
            aria-label="Stäng sökning"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Laddar…</span>
            </div>
          )}

          {!loading && !query.trim() && (
            <div className="py-12 px-6 text-center">
              <p className="text-sm text-gray-400">
                Skriv för att söka bland kunder, offerter, fakturor och jobb.
              </p>
              <p className="text-xs text-gray-300 mt-2 hidden md:block">
                Tips: öppna sökningen var som helst med <kbd className="border border-gray-200 rounded px-1 font-semibold">Ctrl</kbd>+<kbd className="border border-gray-200 rounded px-1 font-semibold">K</kbd>
              </p>
            </div>
          )}

          {!loading && results && totalHits === 0 && (
            <div className="py-12 px-6 text-center">
              <p className="text-sm font-semibold text-gray-600">Inga resultat för ”{query.trim()}”</p>
              <p className="text-xs text-gray-400 mt-1.5">Prova att söka på namn, nummer eller ort.</p>
            </div>
          )}

          {!loading && results && totalHits > 0 && GROUPS.map(({ key, label, Icon }) => {
            const hits = results[key]
            if (hits.length === 0) return null
            return (
              <div key={key} className="py-2">
                <div className="flex items-center gap-2 px-4 py-1.5">
                  <Icon className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
                </div>
                {hits.slice(0, 5).map(hit => (
                  <button
                    key={hit.id}
                    onClick={() => goTo(hit.path)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{hit.title}</p>
                      {hit.sub && <p className="text-xs text-gray-400 truncate mt-0.5">{hit.sub}</p>}
                    </div>
                    {hit.amount && (
                      <span className="text-sm font-semibold text-gray-700 tabular-nums flex-shrink-0">{hit.amount}</span>
                    )}
                    {hit.badge && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${hit.badgeCls}`}>
                        {hit.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
