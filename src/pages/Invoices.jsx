import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Page from '../components/Premium'
import EmptyState from '../components/EmptyState'
import { Plus, Check } from 'lucide-react'
import { SkeletonListRow } from '../components/Skeleton'

// ── helpers ────────────────────────────────────────────────────────────────

function formatSEK(n) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(n ?? 0) + ' kr'
}

function formatDate(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' }).format(new Date(iso))
}

function todayISO() { return new Date().toISOString().slice(0, 10) }

function effectiveStatus(invoice) {
  if (invoice.status === 'obetald' && invoice.due_date && invoice.due_date < todayISO()) return 'försenad'
  return invoice.status ?? 'obetald'
}

// ── badge config ───────────────────────────────────────────────────────────

const BADGE = {
  obetald:  { label: 'Obetald',  cls: 'badge badge-amber' },
  betald:   { label: 'Betald',   cls: 'badge badge-green' },
  försenad: { label: 'Försenad', cls: 'badge badge-red' },
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
      <div className="flex flex-col flex-1" style={{ background: '#F4F3F1' }}>

        {/* Header with filter tabs */}
        <header
          className="sticky top-0 z-10"
          style={{
            background: 'rgba(244,243,241,0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}
        >
          <div className="px-4 md:px-10 h-[58px] flex items-center justify-between">
            <h1 className="font-bold text-[18px]" style={{ color: '#111111', letterSpacing: '-0.025em' }}>
              Fakturor
            </h1>
            <button
              onClick={() => navigate('/invoices/new')}
              className="hidden md:flex items-center gap-1.5 text-white font-semibold px-4 h-8 rounded-lg text-[13px] btn-lift"
              style={{ background: '#0055FF' }}
            >
              <Plus className="w-3.5 h-3.5" />
              Ny faktura
            </button>
          </div>

          {/* Filter tabs */}
          <div
            className="px-4 md:px-10 flex gap-5 overflow-x-auto scrollbar-hide"
            style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}
          >
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`filter-tab ${activeFilter === f.key ? 'is-active' : ''}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </header>

        <div className="px-4 md:px-10 pt-4 flex-1">
          {loading ? (
            <div className="row-list">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={i > 0 ? 'border-t border-[#F1F0EE]' : ''}>
                  <SkeletonListRow />
                </div>
              ))}
            </div>
          ) : invoices.length === 0 ? (
            <EmptyState
              illustration="invoices"
              title="Du har inga fakturor ännu"
              text="Skapa en faktura direkt när jobbet är klart - med ROT/RUT och PDF-export."
              ctaLabel="Skapa din första faktura"
              onCta={() => navigate('/invoices/new')}
            />
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-[13.5px]" style={{ color: '#AAAAAA' }}>Inga fakturor med vald status.</p>
            </div>
          ) : (
            <>
              {/* Mobile list */}
              <div className="md:hidden row-list">
                {filtered.map((inv, idx) => {
                  const status = effectiveStatus(inv)
                  const badge = BADGE[status] ?? BADGE.obetald
                  const total = getTotal(inv)
                  return (
                    <button
                      key={inv.id}
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                      className="row-item stagger-item px-4 py-[15px] gap-3"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[13.5px] truncate" style={{ color: '#111111' }}>
                          Faktura {inv.invoice_number ? `#${inv.invoice_number}` : ''}
                        </p>
                        <p className="text-[12px] mt-0.5 truncate" style={{ color: '#999999' }}>
                          {inv.customers?.name ?? ''}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className="font-bold text-[13.5px] tabular-nums" style={{ color: '#111111' }}>
                          {formatSEK(total)}
                        </span>
                        <span className={badge.cls}>
                          {status === 'betald' && <Check style={{ width: 9, height: 9 }} strokeWidth={3} />}
                          {badge.label}
                        </span>
                        {inv.due_date && (
                          <span className="text-[11px]" style={{ color: '#BBBBBB' }}>
                            {formatDate(inv.due_date)}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Desktop table */}
              <div
                className="hidden md:block bg-white overflow-hidden"
                style={{ borderRadius: 14, border: '1px solid #E8E8E6' }}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #F1F0EE' }}>
                      <th className="text-left px-5 py-3 text-[11px] font-semibold" style={{ color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Nr</th>
                      <th className="text-left px-5 py-3 text-[11px] font-semibold" style={{ color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Kund</th>
                      <th className="text-left px-5 py-3 text-[11px] font-semibold" style={{ color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Förfall</th>
                      <th className="text-right px-5 py-3 text-[11px] font-semibold" style={{ color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Belopp</th>
                      <th className="text-left px-5 py-3 text-[11px] font-semibold" style={{ color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status</th>
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
                          className="cursor-pointer transition-colors"
                          style={{ borderTop: i > 0 ? '1px solid #F1F0EE' : 'none' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}
                        >
                          <td className="px-5 py-4 font-medium" style={{ color: '#111111' }}>
                            #{inv.invoice_number ?? ''}
                          </td>
                          <td className="px-5 py-4" style={{ color: '#777777' }}>{inv.customers?.name ?? ''}</td>
                          <td className="px-5 py-4" style={{ color: '#999999' }}>{formatDate(inv.due_date)}</td>
                          <td className="px-5 py-4 text-right font-semibold tabular-nums" style={{ color: '#111111' }}>
                            {formatSEK(total)}
                          </td>
                          <td className="px-5 py-4">
                            <span className={badge.cls}>
                              {status === 'betald' && <Check style={{ width: 9, height: 9 }} strokeWidth={3} />}
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
          className="md:hidden btn-lift fixed bottom-[74px] right-4 w-[52px] h-[52px] text-white rounded-full flex items-center justify-center z-10"
          style={{ background: '#0055FF', boxShadow: '0 4px 16px rgba(0,85,255,0.35)' }}
          aria-label="Ny faktura"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </Page>
  )
}
