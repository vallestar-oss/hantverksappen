import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'

const STATUSES = [
  { key: 'alla',    label: 'Alla' },
  { key: 'utkast',  label: 'Utkast' },
  { key: 'skickad', label: 'Skickad' },
  { key: 'godkänd', label: 'Godkänd' },
  { key: 'avvisad', label: 'Avvisad' },
]

const BADGE = {
  utkast:  'bg-gray-100 text-gray-500',
  skickad: 'bg-blue-100 text-blue-600',
  godkänd: 'bg-green-100 text-success',
  avvisad: 'bg-red-100 text-danger',
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
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 pt-4 pb-0 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-bold text-gray-800 text-lg">Offerter</h1>
        </div>

        {/* Filter bar */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
          {STATUSES.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveFilter(s.key)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
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
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
        ) : quotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 font-medium text-sm">Du har inga offerter ännu.</p>
            <p className="text-gray-400 text-sm mt-1">Skapa din första offert!</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-400 text-sm">Inga offerter med vald status.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {filtered.map((quote, index) => {
              const total = calcTotal(quote.quote_items)
              const status = quote.status ?? 'utkast'
              return (
                <button
                  key={quote.id}
                  onClick={() => navigate(`/quotes/${quote.id}`)}
                  className={`w-full flex items-center gap-3 px-4 text-left min-h-[64px] hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                    index < filtered.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  {/* Left: quote number + customer */}
                  <div className="flex-1 min-w-0 py-3">
                    <p className="font-semibold text-gray-800 text-sm">
                      Offert #{quote.quote_number ?? quote.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {quote.customers?.name ?? '–'}
                    </p>
                  </div>

                  {/* Right: date, amount, status */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0 py-3">
                    <span className="text-xs text-gray-400">{formatDate(quote.created_at)}</span>
                    <span className="text-sm font-semibold text-gray-800">{formatSEK(total)}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${BADGE[status] ?? BADGE.utkast}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
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
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary hover:bg-blue-700 active:bg-blue-800 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-10"
        aria-label="Ny offert"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <BottomNav />
    </div>
  )
}
