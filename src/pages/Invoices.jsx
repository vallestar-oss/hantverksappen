import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'

// ── helpers ────────────────────────────────────────────────────────────────

function formatSEK(n) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 2 }).format(n ?? 0) + ' kr'
}

function formatDate(iso) {
  if (!iso) return '–'
  return new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' }).format(new Date(iso))
}

function todayISO() { return new Date().toISOString().slice(0, 10) }

// Compute effective status: if obetald and due_date < today → försenad
function effectiveStatus(invoice) {
  if (invoice.status === 'obetald' && invoice.due_date && invoice.due_date < todayISO()) {
    return 'försenad'
  }
  return invoice.status ?? 'obetald'
}

// ── badge config ───────────────────────────────────────────────────────────

const BADGE = {
  obetald:  { label: 'Obetald',  cls: 'bg-amber-100 text-warning' },
  betald:   { label: 'Betald',   cls: 'bg-green-100 text-success' },
  försenad: { label: 'Försenad', cls: 'bg-red-100 text-danger' },
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
      (s, item) => s + (Number(item.unit_price) || 0) * (Number(item.quantity) || 0),
      0
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 pt-4 pb-0 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-bold text-gray-800 text-lg">Fakturor</h1>
        </div>

        {/* Filter bar */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
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
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 font-medium text-sm">Du har inga fakturor ännu.</p>
            <p className="text-gray-400 text-sm mt-1">Skapa din första faktura!</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-400 text-sm">Inga fakturor med vald status.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {filtered.map((inv, index) => {
              const status = effectiveStatus(inv)
              const badge = BADGE[status] ?? BADGE.obetald
              const total = getTotal(inv)

              return (
                <button
                  key={inv.id}
                  onClick={() => navigate(`/invoices/${inv.id}`)}
                  className={`w-full flex items-center gap-3 px-4 text-left min-h-[64px] hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                    index < filtered.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  {/* Invoice icon */}
                  <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>

                  {/* Number + customer */}
                  <div className="flex-1 min-w-0 py-3">
                    <p className="font-semibold text-gray-800 text-sm truncate">
                      Faktura {inv.invoice_number ?? '–'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {inv.customers?.name ?? '–'}
                    </p>
                  </div>

                  {/* Right: due date + badge + total */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0 py-3">
                    <span className="text-xs text-gray-400">
                      Förfaller {formatDate(inv.due_date)}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>
                      {badge.label}
                    </span>
                    <span className="text-xs font-semibold text-gray-700 tabular-nums">
                      {formatSEK(total)}
                    </span>
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
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary hover:bg-blue-700 active:bg-blue-800 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-10"
        aria-label="Ny faktura"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <BottomNav />
    </div>
  )
}
