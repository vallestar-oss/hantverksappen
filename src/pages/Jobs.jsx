import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Page from '../components/Premium'
import EmptyState from '../components/EmptyState'
import { Calendar, Plus, ChevronRight } from 'lucide-react'
import { SkeletonRow } from '../components/Skeleton'

const STATUSES = [
  { key: 'alla',     label: 'Alla' },
  { key: 'pågående', label: 'Pågående' },
  { key: 'planerad', label: 'Planerad' },
  { key: 'avslutad', label: 'Avslutad' },
]

const BADGE_CLS = {
  planerad: 'badge badge-blue',
  pågående: 'badge badge-amber',
  avslutad: 'badge badge-green',
}

const STATUS_LABEL = {
  planerad: 'Planerad',
  pågående: 'Pågående',
  avslutad: 'Avslutad',
}

function formatDate(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' }).format(new Date(iso))
}

export default function Jobs() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('pågående')

  useEffect(() => {
    async function fetchJobs() {
      const { data } = await supabase
        .from('jobs')
        .select('*, customers(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setJobs(data ?? [])
      setLoading(false)
    }
    fetchJobs()
  }, [user.id])

  const filtered = useMemo(() => {
    if (activeFilter === 'alla') return jobs
    return jobs.filter(j => j.status === activeFilter)
  }, [jobs, activeFilter])

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
          <div
            className="px-4 md:px-10 h-[58px] flex items-center justify-between"
          >
            <h1 className="font-bold text-[18px]" style={{ color: '#111111', letterSpacing: '-0.025em' }}>
              Jobb
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/jobs/calendar')}
                className="p-2 rounded-xl transition-colors"
                style={{ color: '#AAAAAA' }}
                aria-label="Kalendervy"
              >
                <Calendar className="w-[19px] h-[19px]" />
              </button>
              <button
                onClick={() => navigate('/jobs/new')}
                className="hidden md:flex items-center gap-1.5 text-white font-semibold px-4 h-8 rounded-lg text-[13px] btn-lift"
                style={{ background: '#0055FF' }}
              >
                <Plus className="w-3.5 h-3.5" />
                Nytt jobb
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          <div
            className="px-4 md:px-10 flex gap-5 overflow-x-auto scrollbar-hide"
            style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}
          >
            {STATUSES.map(s => (
              <button
                key={s.key}
                onClick={() => setActiveFilter(s.key)}
                className={`filter-tab ${activeFilter === s.key ? 'is-active' : ''}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </header>

        <div className="px-4 md:px-10 pt-4 flex-1">
          {loading ? (
            <div className="row-list">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={i > 0 ? 'border-t border-[#F1F0EE]' : ''}>
                  <SkeletonRow />
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState
              illustration="jobs"
              title="Du har inga jobb ännu"
              text="Planera, följ och avsluta dina jobb - från första kontakt till skickad faktura."
              ctaLabel="Skapa ditt första jobb"
              onCta={() => navigate('/jobs/new')}
            />
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-[13.5px]" style={{ color: '#AAAAAA' }}>Inga jobb med vald status.</p>
            </div>
          ) : (
            <>
              {/* Mobile + Desktop: unified flat list */}
              <div className="md:hidden row-list">
                {filtered.map((job, idx) => {
                  const status = job.status ?? 'planerad'
                  return (
                    <button
                      key={job.id}
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      className="row-item stagger-item px-4 py-[15px] gap-3"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[13.5px] truncate" style={{ color: '#111111' }}>
                          {job.title ?? 'Namnlöst jobb'}
                        </p>
                        <p className="text-[12px] mt-0.5 truncate" style={{ color: '#999999' }}>
                          {job.customers?.name ?? ''}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        {job.scheduled_date && (
                          <span className="text-[11.5px]" style={{ color: '#AAAAAA' }}>
                            {formatDate(job.scheduled_date)}
                          </span>
                        )}
                        <span className={BADGE_CLS[status] ?? BADGE_CLS.planerad}>
                          {STATUS_LABEL[status] ?? status}
                        </span>
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
                      <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wider" style={{ color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Titel</th>
                      <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wider" style={{ color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Kund</th>
                      <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wider" style={{ color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Datum</th>
                      <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wider" style={{ color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((job, i) => {
                      const status = job.status ?? 'planerad'
                      return (
                        <tr
                          key={job.id}
                          onClick={() => navigate(`/jobs/${job.id}`)}
                          className="cursor-pointer transition-colors"
                          style={{ borderTop: i > 0 ? '1px solid #F1F0EE' : 'none' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}
                        >
                          <td className="px-5 py-4 font-medium" style={{ color: '#111111' }}>
                            {job.title ?? 'Namnlöst jobb'}
                          </td>
                          <td className="px-5 py-4" style={{ color: '#777777' }}>{job.customers?.name ?? ''}</td>
                          <td className="px-5 py-4" style={{ color: '#999999' }}>{formatDate(job.scheduled_date)}</td>
                          <td className="px-5 py-4">
                            <span className={BADGE_CLS[status] ?? BADGE_CLS.planerad}>
                              {STATUS_LABEL[status] ?? status}
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
          onClick={() => navigate('/jobs/new')}
          className="md:hidden btn-lift fixed bottom-[74px] right-4 w-[52px] h-[52px] text-white rounded-full flex items-center justify-center z-10"
          style={{ background: '#0055FF', boxShadow: '0 4px 16px rgba(0,85,255,0.35)' }}
          aria-label="Nytt jobb"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </Page>
  )
}
