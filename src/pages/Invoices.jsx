import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Page from '../components/Premium'
import EmptyState from '../components/EmptyState'
import { Receipt, Plus, Check } from 'lucide-react'
import { SkeletonListRow } from '../components/Skeleton'

// ── helpers ────────────────────────────────────────────────────────────────

function formatSEK(n) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 2 }).format(n ?? 0) + ' kr'
}

function formatDate(iso) {
  if (!iso) return '–'
  return new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' }).format(new Date(iso))
}

function todayISO() { return new Date().toISOString().slice(0, 10) }

function effectiveStatus(invoice) {
  if (invoice.status === 'obetald' && invoice.due_date && invoice.due_date < todayISO()) return 'försenad'
  return invoice.status ?? 'obetald'
}

// ── badge config ───────────────────────────────────────────────────────────

const BADGE = {
  obetald:  { label: 'Obetald',  cls: 'bg-amber-100 text-amber-700' },
  betald:   { label: 'Betald',   cls: 'bg-green-100 text-green-700 glow-success' },
  försenad: { label: 'Försenad', cls: 'bg-red-100 text-red-700 glow-danger' },
}

const ICON_BG = {
  obetald:  'bg-amber-50',
  betald:   'bg-green-50',
  försenad: 'bg-red-50',
}

const ICON_COLOR = {
  obetald:  'text-amber-600',
  betald:   'text-green-600',
  försenad: 'text-red-500',
}

const FILTERS = [
  { key: 'alla',     label: 'Alla' },
  { key: 'obetald',  label: 'Obetald' },
  { key: 'betald',   label: 'Betald' },
  { key: 'försenad', label: 'Försenad' },
]

// ── component ──────────────────────────────────────────────────────────────

export default function Invoices() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('obetald')

  useEffect(() => {
    async function fetchInvoices() {
      const { data } = await supabase
        .from('invoices')
        .select('*, customers(name), invoice_items(unit_price, quantity)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setInvoices(data ?? [])
      setLoading(false)
    }
    fetchInvoices()
  }, [user.id])

  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      if (activeFilter === 'alla') return true
      return effectiveStatus(inv) === activeFilter
    })
  }, [invoices, activeFilter])

  function getTotal(inv) {
    return (inv.invoice_items ?? []).reduce(
      (s, item) => s + (Number(item.unit_price) || 0) * (Number(item.quantity) || 0), 0
    )
  }

  return (
    <Page className="min-h-screen flex flex-col pb-20 md:pb-0">
      <div className="flex flex-col flex-1" style={{ background: '#F8F8F8' }}>

        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-12 pt-4 pb-0 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-extrabold text-gray-900 text-xl tracking-tight">Fakturor</h1>
            <button
              onClick={() => navigate('/invoices/new')}
              className="hidden md:flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-4 h-9 rounded-lg text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ny faktura
            </button>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  activeFilter === f.key
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </header>

        <div className="px-4 md:px-12 pt-4 flex-1">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonListRow key={i} />)}
            </div>
          ) : invoices.length === 0 ? (
            <EmptyState
              illustration="invoices"
              title="Du har inga fakturor ännu"
              text="Skapa en faktura direkt när jobbet är klart — med ROT/RUT och PDF-export."
              ctaLabel="Skapa din första faktura"
              onCta={() => navigate('/invoices/new')}
            />
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-gray-400 text-sm">Inga fakturor med vald status.</p>
            </div>
          ) : (
            <>
              {/* Mobile: card list */}
              <div className="md:hidden space-y-2">
                {filtered.map(inv => {
                  const status = effectiveStatus(inv)
                  const badge = BADGE[status] ?? BADGE.obetald
                  const total = getTotal(inv)
                  return (
                    <button
                      key={inv.id}
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                      className="card-lift w-full flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3.5 text-left hover:border-gray-300 active:bg-gray-50"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ICON_BG[status] ?? 'bg-gray-50'}`}>
                        <Receipt className={`w-5 h-5 ${ICON_COLOR[status] ?? 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">
                          Faktura #{inv.invoice_number ?? '–'}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {inv.customers?.name ?? '–'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className="text-sm font-bold text-gray-800 tabular-nums">{formatSEK(total)}</span>
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>
                          {status === 'betald' && <Check className="w-3 h-3" strokeWidth={3} />}
                          {badge.label}
                        </span>
                        {inv.due_date && (
                          <span className="text-xs text-gray-400">Förfaller {formatDate(inv.due_date)}</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Desktop: table */}
              <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Nr</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Kund</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Förfallodatum</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Belopp</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((inv, i) => {
                      const status = effectiveStatus(inv)
                      const badge = BADGE[status] ?? BADGE.obetald
                      const total = getTotal(inv)
                      return (
                        <tr
                          key={inv.id}
                          onClick={() => navigate(`/invoices/${inv.id}`)}
                          className={`cursor-pointer hover:bg-[#F8F8F8] transition-colors ${i < filtered.length - 1 ? 'border-b border-gray-100' : ''}`}
                        >
                          <td className="px-5 py-4 font-medium text-gray-700">
                            #{inv.invoice_number ?? '–'}
                          </td>
                          <td className="px-5 py-4 text-gray-700">{inv.customers?.name ?? '–'}</td>
                          <td className="px-5 py-4 text-gray-500">{formatDate(inv.due_date)}</td>
                          <td className="px-5 py-4 text-right font-semibold text-gray-800 tabular-nums">{formatSEK(total)}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>
                              {status === 'betald' && <Check className="w-3 h-3" strokeWidth={3} />}
                              {badge.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* FAB — mobile only */}
        <button
          onClick={() => navigate('/invoices/new')}
          className="md:hidden btn-lift fixed bottom-20 right-4 w-14 h-14 bg-primary hover:bg-primary-dark active:bg-primary-darker text-white rounded-full shadow-lg shadow-gray-900/15 flex items-center justify-center z-10"
          aria-label="Ny faktura"
        >
          <Plus className="w-6 h-6" />
        </button>

      </div>
    </Page>
  )
}
