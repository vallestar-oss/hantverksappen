import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import { Receipt, Plus } from 'lucide-react'
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
  betald:   { label: 'Betald',   cls: 'bg-green-100 text-green-700' },
  försenad: { label: 'Försenad', cls: 'bg-red-100 text-red-700' },
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
  const [activeFilter, setActiveFilter] = useState('alla')

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
    <div className="min-h-screen flex flex-col pb-20" style={{ background: '#F8F8F8' }}>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 pt-4 pb-0 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-bold text-gray-900 text-lg">Fakturor</h1>
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

      <div className="px-4 pt-4 flex-1">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonListRow key={i} />)}
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
              <Receipt className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-600 font-semibold text-sm">Du har inga fakturor ännu.</p>
            <p className="text-gray-400 text-sm mt-1">Skapa din första faktura nedan.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-400 text-sm">Inga fakturor med vald status.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(inv => {
              const status = effectiveStatus(inv)
              const badge = BADGE[status] ?? BADGE.obetald
              const total = getTotal(inv)

              return (
                <button
                  key={inv.id}
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                  className="w-full flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3.5 text-left hover:border-gray-300 transition-all active:bg-gray-50"
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ICON_BG[status] ?? 'bg-gray-50'}`}>
                    <Receipt className={`w-5 h-5 ${ICON_COLOR[status] ?? 'text-gray-400'}`} />
                  </div>

                  {/* Number + customer */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">
                      Faktura {inv.invoice_number ?? '–'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {inv.customers?.name ?? '–'}
                    </p>
                  </div>

                  {/* Amount + due date + badge */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="text-sm font-bold text-gray-800 tabular-nums">{formatSEK(total)}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}>
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
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/invoices/new')}
        className="fixed bottom-20 right-4 w-14 h-14 bg-primary hover:bg-primary-dark active:bg-primary-darker text-white rounded-full shadow-lg shadow-gray-900/15 flex items-center justify-center transition-all z-10"
        aria-label="Ny faktura"
      >
        <Plus className="w-6 h-6" />
      </button>

      <BottomNav />
    </div>
  )
}
