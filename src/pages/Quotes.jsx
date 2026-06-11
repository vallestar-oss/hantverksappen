import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import Page from '../components/Premium'
import EmptyState from '../components/EmptyState'
import { FileText, Plus, Check } from 'lucide-react'
import { SkeletonListRow } from '../components/Skeleton'

const STATUSES = [
  { key: 'alla',    label: 'Alla' },
  { key: 'utkast',  label: 'Utkast' },
  { key: 'skickad', label: 'Skickad' },
  { key: 'godkänd', label: 'Godkänd' },
  { key: 'avvisad', label: 'Avvisad' },
]

const BADGE = {
  utkast:  'bg-gray-100 text-gray-600',
  skickad: 'bg-blue-100 text-blue-700',
  godkänd: 'bg-green-100 text-green-700 glow-success',
  avvisad: 'bg-red-100 text-red-700',
}

const STATUS_LABEL = {
  utkast:  'Utkast',
  skickad: 'Skickad',
  godkänd: 'Godkänd',
  avvisad: 'Avvisad',
}

const STATUS_DOT = {
  utkast:  'bg-gray-300',
  skickad: 'bg-blue-400',
  godkänd: 'bg-green-500',
  avvisad: 'bg-red-400',
}

function formatSEK(amount) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(amount) + ' kr'
}

function formatDate(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
}

function calcTotal(items = []) {
  return items.reduce((sum, item) => sum + (item.quantity ?? 0) * (item.unit_price ?? 0), 0)
}

export default function Quotes() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('alla')

  useEffect(() => {
    async function fetchQuotes() {
      const { data } = await supabase
        .from('quotes')
        .select('*, customers(name), quote_items(unit_price, quantity)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setQuotes(data ?? [])
      setLoading(false)
    }
    fetchQuotes()
  }, [user.id])

  const filtered = useMemo(() => {
    if (activeFilter === 'alla') return quotes
    return quotes.filter(q => q.status === activeFilter)
  }, [quotes, activeFilter])

  return (
    <Page className="min-h-screen flex flex-col pb-20" >
      <div className="flex flex-col flex-1" style={{ background: '#F8F8F8' }}>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 pt-4 pb-0 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-extrabold text-gray-900 text-xl tracking-tight">Offerter</h1>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
          {STATUSES.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveFilter(s.key)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all ${
                activeFilter === s.key
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 pt-4 flex-1">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonListRow key={i} />)}
          </div>
        ) : quotes.length === 0 ? (
          <EmptyState
            illustration="quotes"
            title="Du har inga offerter ännu"
            text="Skapa en professionell offert med ROT/RUT-avdrag på några minuter."
            ctaLabel="Skapa din första offert"
            onCta={() => navigate('/quotes/new')}
          />
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-400 text-sm">Inga offerter med vald status.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(quote => {
              const total = calcTotal(quote.quote_items)
              const status = quote.status ?? 'utkast'
              return (
                <button
                  key={quote.id}
                  onClick={() => navigate(`/quotes/${quote.id}`)}
                  className="card-lift w-full flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3.5 text-left hover:border-gray-300 active:bg-gray-50"
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>

                  {/* Number + customer */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">
                      Offert #{quote.quote_number ?? quote.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {quote.customers?.name ?? '–'}
                    </p>
                  </div>

                  {/* Amount + badge */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="text-sm font-bold text-gray-800 tabular-nums">{formatSEK(total)}</span>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${BADGE[status] ?? BADGE.utkast}`}>
                      {status === 'godkänd' && <Check className="w-3 h-3" strokeWidth={3} />}
                      {STATUS_LABEL[status] ?? status}
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
        onClick={() => navigate('/quotes/new')}
        className="btn-lift fixed bottom-20 right-4 w-14 h-14 bg-primary hover:bg-primary-dark active:bg-primary-darker text-white rounded-full shadow-lg shadow-gray-900/15 flex items-center justify-center z-10"
        aria-label="Ny offert"
      >
        <Plus className="w-6 h-6" />
      </button>

      <BottomNav />
      </div>
    </Page>
  )
}
