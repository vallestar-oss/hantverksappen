import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Page from '../components/Premium'
import EmptyState from '../components/EmptyState'
import { Search, Plus, ChevronRight } from 'lucide-react'
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

  function getInitials(name) {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase()
  }

  const AVATAR_COLORS = [
    '#EFF6FF:#1D4ED8', '#F0FDF4:#15803D', '#FFF7ED:#C2410C',
    '#FDF4FF:#7E22CE', '#FFF1F2:#BE123C', '#F0F9FF:#0369A1',
  ]

  function avatarStyle(name) {
    const idx = (name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length
    const [bg, color] = AVATAR_COLORS[idx].split(':')
    return { background: bg, color }
  }

  return (
    <Page className="min-h-screen flex flex-col pb-20 md:pb-0">
      <div className="flex flex-col flex-1" style={{ background: '#F4F3F1' }}>

        {/* Header */}
        <header
          className="sticky top-0 z-10 px-4 md:px-10 h-[58px] flex items-center justify-between"
          style={{
            background: 'rgba(244,243,241,0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          <h1
            className="font-bold text-[18px]"
            style={{ color: '#111111', letterSpacing: '-0.025em' }}
          >
            Kunder
          </h1>
          <button
            onClick={() => navigate('/customers/new')}
            className="hidden md:flex items-center gap-1.5 text-white font-semibold px-4 h-8 rounded-lg text-[13px] btn-lift"
            style={{ background: '#0055FF' }}
          >
            <Plus className="w-3.5 h-3.5" />
            Ny kund
          </button>
        </header>

        {/* Search */}
        <div className="px-4 md:px-10 pt-4 pb-3">
          <div className="relative max-w-lg">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ width: 15, height: 15, color: '#BBBBBB' }}
            />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Sök namn, telefon eller e-post"
              className="w-full pl-10 pr-4 py-2.5 text-[13.5px] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0055FF]/30 transition-all"
              style={{
                background: 'white',
                border: '1px solid #E8E8E6',
                color: '#111111',
              }}
            />
          </div>
        </div>

        <div className="px-4 md:px-10 flex-1">
          {loading ? (
            <div className="row-list mt-0.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={i > 0 ? 'border-t border-[#F1F0EE]' : ''}>
                  <SkeletonRow />
                </div>
              ))}
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
            <div className="flex items-center justify-center py-20">
              <p className="text-[13.5px]" style={{ color: '#AAAAAA' }}>Ingen kund matchar din sökning.</p>
            </div>
          ) : (
            <div className="row-list">
              {filtered.map((c, idx) => {
                const style = avatarStyle(c.name)
                return (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/customers/${c.id}`)}
                    className="row-item stagger-item px-4 py-[14px] gap-3"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-[12px] font-bold"
                      style={style}
                    >
                      {getInitials(c.name)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[13.5px] truncate" style={{ color: '#111111' }}>
                        {c.name}
                      </p>
                      {(c.phone || c.email) && (
                        <p className="text-[12px] mt-0.5 truncate" style={{ color: '#999999' }}>
                          {c.phone || c.email}
                        </p>
                      )}
                    </div>

                    <ChevronRight style={{ width: 15, height: 15, color: '#DDDDDD', flexShrink: 0 }} />
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* FAB — mobile only */}
        <button
          onClick={() => navigate('/customers/new')}
          className="md:hidden btn-lift fixed bottom-[74px] right-4 w-[52px] h-[52px] text-white rounded-full flex items-center justify-center z-10"
          style={{ background: '#0055FF', boxShadow: '0 4px 16px rgba(0,85,255,0.35)' }}
          aria-label="Ny kund"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </Page>
  )
}
