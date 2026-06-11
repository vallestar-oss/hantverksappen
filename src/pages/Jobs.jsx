import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Page from '../components/Premium'
import EmptyState from '../components/EmptyState'
import { Calendar, Plus } from 'lucide-react'
import { SkeletonRow } from '../components/Skeleton'

const STATUSES = [
  { key: 'alla',     label: 'Alla' },
  { key: 'planerad', label: 'Planerad' },
  { key: 'pågående', label: 'Pågående' },
  { key: 'avslutad', label: 'Avslutad' },
]

const BADGE = {
  planerad: 'bg-blue-100 text-blue-700',
  pågående: 'bg-amber-100 text-amber-700',
  avslutad: 'bg-green-100 text-green-700',
}

const STATUS_LABEL = {
  planerad: 'Planerad',
  pågående: 'Pågående',
  avslutad: 'Avslutad',
}

const STATUS_DOT = {
  planerad: 'bg-blue-400',
  pågående: 'bg-amber-400',
  avslutad: 'bg-green-500',
}

function formatDate(iso) {
  if (!iso) return '–'
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
      <div className="flex flex-col flex-1" style={{ background: '#F8F8F8' }}>

        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-12 pt-4 pb-0 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-extrabold text-gray-900 text-xl tracking-tight">Jobb</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/jobs/calendar')}
                className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-xl hover:bg-gray-50"
                aria-label="Kalendervy"
              >
                <Calendar className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/jobs/new')}
                className="hidden md:flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-4 h-9 rounded-lg text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nytt jobb
              </button>
            </div>
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

        <div className="px-4 md:px-12 pt-4 flex-1">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState
              illustration="jobs"
              title="Du har inga jobb ännu"
              text="Planera, följ och avsluta dina jobb — från första kontakt till skickad faktura."
              ctaLabel="Skapa ditt första jobb"
              onCta={() => navigate('/jobs/new')}
            />
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-gray-400 text-sm">Inga jobb med vald status.</p>
            </div>
          ) : (
            <>
              {/* Mobile: card list */}
              <div className="md:hidden space-y-2">
                {filtered.map(job => {
                  const status = job.status ?? 'planerad'
                  return (
                    <button
                      key={job.id}
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      className="card-lift w-full flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3.5 text-left hover:border-gray-300 active:bg-gray-50"
                    >
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5 ${STATUS_DOT[status] ?? STATUS_DOT.planerad}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">
                          {job.title ?? 'Namnlöst jobb'}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {job.customers?.name ?? '–'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        {job.scheduled_date && (
                          <span className="text-xs text-gray-400">{formatDate(job.scheduled_date)}</span>
                        )}
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BADGE[status] ?? BADGE.planerad}`}>
                          {STATUS_LABEL[status] ?? status}
                        </span>
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
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Titel</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Kund</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Datum</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((job, i) => {
                      const status = job.status ?? 'planerad'
                      return (
                        <tr
                          key={job.id}
                          onClick={() => navigate(`/jobs/${job.id}`)}
                          className={`cursor-pointer hover:bg-[#F8F8F8] transition-colors ${i < filtered.length - 1 ? 'border-b border-gray-100' : ''}`}
                        >
                          <td className="px-5 py-4">
                            <span className="font-medium text-gray-800">{job.title ?? 'Namnlöst jobb'}</span>
                          </td>
                          <td className="px-5 py-4 text-gray-500">{job.customers?.name ?? '–'}</td>
                          <td className="px-5 py-4 text-gray-500">{formatDate(job.scheduled_date)}</td>
                          <td className="px-5 py-4">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${BADGE[status] ?? BADGE.planerad}`}>
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
          className="md:hidden btn-lift fixed bottom-20 right-4 w-14 h-14 bg-primary hover:bg-primary-dark active:bg-primary-darker text-white rounded-full shadow-lg shadow-gray-900/15 flex items-center justify-center z-10"
          aria-label="Nytt jobb"
        >
          <Plus className="w-6 h-6" />
        </button>

      </div>
    </Page>
  )
}
