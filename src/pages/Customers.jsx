import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import Page from '../components/Premium'
import EmptyState from '../components/EmptyState'
import { Settings, Search, Plus, ChevronRight } from 'lucide-react'
import { SkeletonRow } from '../components/Skeleton'

export default function Customers() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    async function fetchCustomers() {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })
      setCustomers(data ?? [])
      setLoading(false)
    }
    fetchCustomers()
  }, [user.id])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    )
  }, [customers, query])

  return (
    <Page className="min-h-screen flex flex-col pb-20" >
      <div className="flex flex-col flex-1" style={{ background: '#F8F8F8' }}>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="font-extrabold text-gray-900 text-xl tracking-tight">Kunder</h1>
        <button
          onClick={() => navigate('/settings')}
          className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-xl hover:bg-gray-50"
          aria-label="Inställningar"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Search */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Sök namn, telefon eller e-post..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="px-4 flex-1">
        {loading ? (
          <div className="space-y-2 mt-2">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            illustration="customers"
            title="Du har inga kunder ännu"
            text="Kunderna du lägger till samlas här, med historik över deras offerter, jobb och fakturor."
            ctaLabel="Lägg till din första kund"
            onCta={() => navigate('/customers/new')}
          />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-gray-400 text-sm">Ingen kund matchade sökningen.</p>
          </div>
        ) : (
          <div className="space-y-2 mt-2">
            {filtered.map(customer => (
              <button
                key={customer.id}
                onClick={() => navigate(`/customers/${customer.id}`)}
                className="card-lift w-full flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3.5 text-left hover:border-gray-300 active:bg-gray-50"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {(customer.name ?? '?')[0].toUpperCase()}
                  </span>
                </div>

                {/* Name + contact */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{customer.name}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {[customer.phone, customer.email].filter(Boolean).join(' · ') || customer.city || '–'}
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/customers/new')}
        className="btn-lift fixed bottom-20 right-4 w-14 h-14 bg-primary hover:bg-primary-dark active:bg-primary-darker text-white rounded-full shadow-lg shadow-gray-900/15 flex items-center justify-center z-10"
        aria-label="Lägg till kund"
      >
        <Plus className="w-6 h-6" />
      </button>

      <BottomNav />
      </div>
    </Page>
  )
}
