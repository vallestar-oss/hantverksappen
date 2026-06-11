import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import { Calendar, Plus, Briefcase, ChevronRight } from 'lucide-react'
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
  if (!iso) return ''
  return new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short' }).format(new Date(iso))
}

export default function Jobs() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('alla')

  useEffect(() => {
    async function fetchJobs() {
      const { data } = await supabase
        .from('jobs')
        .select('*, customers(name)')
        .eq('user_id', user.id)
        .order('scheduled_date', { ascending: true })
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
    <div className="min-h-screen flex flex-col pb-20" style={{ background: '#F8F8F8' }}>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 pt-4 pb-0 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-bold text-gray-900 text-lg">Jobb</h1>
          <button
            onClick={() => navigate('/jobs/calendar')}
            className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-xl hover:bg-gray-50"
            aria-label="Kalendervy"
          >
            <Calendar className="w-5 h-5" />
          </button>
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
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
              <Briefcase className="w-8 h-8 text-primary/40" />
            </div>
            <p className="text-gray-600 font-semibold text-sm">Du har inga jobb ännu.</p>
            <p className="text-gray-400 text-sm mt-1">Skapa ditt första jobb nedan.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-400 text-sm">Inga jobb med vald status.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(job => {
              const status = job.status ?? 'planerad'
              return (
                <button
                  key={job.id}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className="w-full flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3.5 text-left hover:border-gray-300 transition-all active:bg-gray-50"
                >
                  {/* Status dot */}
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5 ${STATUS_DOT[status] ?? STATUS_DOT.planerad}`} />

                  {/* Title + customer */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">
                      {job.title ?? 'Namnlöst jobb'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {job.customers?.name ?? '–'}
                    </p>
                  </div>

                  {/* Date + badge */}
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
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/jobs/new')}
        className="fixed bottom-20 right-4 w-14 h-14 bg-primary hover:bg-primary-dark active:bg-primary-darker text-white rounded-full shadow-lg shadow-gray-900/15 flex items-center justify-center transition-all z-10"
        aria-label="Nytt jobb"
      >
        <Plus className="w-6 h-6" />
      </button>

      <BottomNav />
    </div>
  )
}
