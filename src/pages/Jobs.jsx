import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'

const STATUSES = [
  { key: 'alla',     label: 'Alla' },
  { key: 'planerad', label: 'Planerad' },
  { key: 'pågående', label: 'Pågående' },
  { key: 'avslutad', label: 'Avslutad' },
]

const BADGE = {
  planerad: 'bg-blue-100 text-blue-600',
  pågående: 'bg-amber-100 text-warning',
  avslutad: 'bg-green-100 text-success',
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
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 pt-4 pb-0 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-bold text-gray-800 text-lg">Jobb</h1>
          <button
            onClick={() => navigate('/jobs/calendar')}
            className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-lg"
            aria-label="Kalendervy"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
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
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 font-medium text-sm">Du har inga jobb ännu.</p>
            <p className="text-gray-400 text-sm mt-1">Skapa ditt första jobb!</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-400 text-sm">Inga jobb med vald status.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {filtered.map((job, index) => {
              const status = job.status ?? 'planerad'
              return (
                <button
                  key={job.id}
                  onClick={() => navigate(`/jobs/${job.id}`)}
                  className={`w-full flex items-center gap-3 px-4 text-left min-h-[64px] hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                    index < filtered.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  {/* Status dot */}
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    status === 'avslutad' ? 'bg-success' :
                    status === 'pågående' ? 'bg-warning' : 'bg-blue-400'
                  }`} />

                  {/* Title + customer */}
                  <div className="flex-1 min-w-0 py-3">
                    <p className="font-semibold text-gray-800 text-sm truncate">
                      {job.title ?? 'Namnlöst jobb'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {job.customers?.name ?? '–'}
                    </p>
                  </div>

                  {/* Date + badge */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0 py-3">
                    {job.scheduled_date && (
                      <span className="text-xs text-gray-400">{formatDate(job.scheduled_date)}</span>
                    )}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${BADGE[status] ?? BADGE.planerad}`}>
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
        onClick={() => navigate('/jobs/new')}
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary hover:bg-blue-700 active:bg-blue-800 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-10"
        aria-label="Nytt jobb"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <BottomNav />
    </div>
  )
}
