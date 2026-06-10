import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const STATUS_CONFIG = {
  planerad: { label: 'Planerad', bg: 'bg-blue-50',  text: 'text-blue-600',  border: 'border-blue-100',  dot: 'bg-blue-400' },
  pågående: { label: 'Pågående', bg: 'bg-amber-50', text: 'text-warning',   border: 'border-amber-100', dot: 'bg-warning' },
  avslutad: { label: 'Avslutad', bg: 'bg-green-50', text: 'text-success',   border: 'border-green-100', dot: 'bg-success' },
}

function formatDateTime(date, time) {
  if (!date) return '–'
  const d = new Intl.DateTimeFormat('sv-SE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(date))
  return time ? `${d} kl. ${time.slice(0, 5)}` : d
}

export default function JobDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('jobs')
        .select('*, customers(*), quotes(id, quote_number)')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error || !data) { navigate('/jobs'); return }
      setJob(data)
      setLoading(false)
    }
    load()
  }, [id, user.id, navigate])

  async function updateStatus(status) {
    setUpdating(true)
    setError('')

    const patch = {
      status,
      updated_at: new Date().toISOString(),
      ...(status === 'avslutad' ? { completed_date: new Date().toISOString().slice(0, 10) } : {}),
    }

    const { error } = await supabase
      .from('jobs')
      .update(patch)
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      setError('Kunde inte uppdatera status. Försök igen.')
    } else {
      setJob(prev => ({ ...prev, ...patch }))
    }
    setUpdating(false)
  }

  async function handleDelete() {
    if (!window.confirm('Är du säker på att du vill radera detta jobb?')) return
    setDeleting(true)
    const { error } = await supabase
      .from('jobs').delete().eq('id', id).eq('user_id', user.id)
    if (error) {
      setError('Kunde inte radera jobbet. Försök igen.')
      setDeleting(false)
    } else {
      navigate('/jobs')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <svg className="animate-spin w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    )
  }

  const status = job.status ?? 'planerad'
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.planerad

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate('/jobs')}
          className="text-gray-500 hover:text-gray-800 transition-colors p-1 -ml-1 rounded-lg"
          aria-label="Tillbaka"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-bold text-gray-800 text-lg flex-1 truncate">{job.title}</h1>
        <button
          onClick={() => navigate(`/jobs/${id}/edit`)}
          className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-lg"
          aria-label="Redigera jobb"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
          </svg>
        </button>
      </header>

      {/* Status banner — updates instantly */}
      <div className={`${cfg.bg} ${cfg.text} border-b ${cfg.border} px-5 py-3 flex items-center gap-2`}>
        <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
        <span className="font-semibold text-sm">{cfg.label}</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Job details card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-gray-50">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Jobbdetaljer</h2>
          </div>
          <div className="p-5 space-y-4">
            {job.customers && (
              <DetailRow label="Kund">
                <Link to={`/customers/${job.customers.id}`} className="text-sm text-primary font-medium hover:underline">
                  {job.customers.name}
                </Link>
              </DetailRow>
            )}

            <DetailRow label="Datum">
              <span className="text-sm text-gray-800 capitalize">
                {formatDateTime(job.scheduled_date, job.scheduled_time)}
              </span>
            </DetailRow>

            {job.description && (
              <DetailRow label="Beskrivning">
                <span className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{job.description}</span>
              </DetailRow>
            )}

            {job.quotes && (
              <DetailRow label="Kopplad offert">
                <Link to={`/quotes/${job.quote_id}`} className="text-sm text-primary font-medium hover:underline">
                  Offert {job.quotes.quote_number}
                </Link>
              </DetailRow>
            )}

            {job.completed_date && (
              <DetailRow label="Avslutad">
                <span className="text-sm text-gray-800">
                  {new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(job.completed_date))}
                </span>
              </DetailRow>
            )}

            {job.notes && (
              <DetailRow label="Anteckningar">
                <span className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{job.notes}</span>
              </DetailRow>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-danger px-1">{error}</p>}

        {/* ── Status action buttons — driven by current status ── */}

        {status === 'planerad' && (
          <button
            onClick={() => updateStatus('pågående')}
            disabled={updating}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {updating ? 'Uppdaterar...' : 'Starta jobb'}
          </button>
        )}

        {status === 'pågående' && (
          <button
            onClick={() => updateStatus('avslutad')}
            disabled={updating}
            className="w-full flex items-center justify-center gap-2 bg-success hover:bg-green-700 active:bg-green-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {updating ? 'Uppdaterar...' : 'Slutför jobb'}
          </button>
        )}

        {status === 'avslutad' && (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-semibold text-success">Jobbet är avslutat. Dags att fakturera!</p>
            </div>
            <button
              onClick={() => navigate(`/invoices/new?job_id=${id}`)}
              disabled={updating}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-colors shadow-sm text-base"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Skapa faktura
            </button>
          </div>
        )}

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={deleting || updating}
          className="w-full bg-white border border-danger/30 hover:bg-red-50 active:bg-red-100 disabled:opacity-60 text-danger font-semibold py-3 rounded-xl transition-colors"
        >
          {deleting ? 'Raderar...' : 'Radera jobb'}
        </button>
      </div>
    </div>
  )
}

function DetailRow({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
      {children}
    </div>
  )
}
