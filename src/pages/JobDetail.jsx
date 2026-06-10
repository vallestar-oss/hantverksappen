import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ChevronLeft, Pencil, Play, CheckCircle, Receipt, Trash2, Loader2, User, CalendarDays, FileText, StickyNote, Link2 } from 'lucide-react'

const STATUS_CONFIG = {
  planerad: { label: 'Planerad', bg: 'bg-blue-50',  text: 'text-blue-700',  border: 'border-blue-100',  dot: 'bg-blue-400',  badge: 'bg-blue-100 text-blue-700' },
  pågående: { label: 'Pågående', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', dot: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700' },
  avslutad: { label: 'Avslutad', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-100', dot: 'bg-green-500', badge: 'bg-green-100 text-green-700' },
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
    const { error } = await supabase.from('jobs').update(patch).eq('id', id).eq('user_id', user.id)
    if (error) setError('Kunde inte uppdatera status. Försök igen.')
    else setJob(prev => ({ ...prev, ...patch }))
    setUpdating(false)
  }

  async function handleDelete() {
    if (!window.confirm('Är du säker på att du vill radera detta jobb?')) return
    setDeleting(true)
    const { error } = await supabase.from('jobs').delete().eq('id', id).eq('user_id', user.id)
    if (error) { setError('Kunde inte radera jobbet. Försök igen.'); setDeleting(false) }
    else navigate('/jobs')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAFC' }}>
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
    )
  }

  const status = job.status ?? 'planerad'
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.planerad

  return (
    <div className="min-h-screen pb-20" style={{ background: '#F8FAFC' }}>

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate('/jobs')} className="text-gray-500 hover:text-gray-800 transition-colors p-1.5 -ml-1 rounded-xl hover:bg-gray-100" aria-label="Tillbaka">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg flex-1 truncate">{job.title}</h1>
        <button onClick={() => navigate(`/jobs/${id}/edit`)} className="text-gray-400 hover:text-gray-700 transition-colors p-1.5 rounded-xl hover:bg-gray-100" aria-label="Redigera">
          <Pencil className="w-5 h-5" />
        </button>
      </header>

      {/* Status banner */}
      <div className={`${cfg.bg} ${cfg.text} border-b ${cfg.border} px-5 py-3 flex items-center gap-2`}>
        <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
        <span className="font-semibold text-sm">{cfg.label}</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-3">

        {/* Job details card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Jobbdetaljer</p>
          </div>
          <div className="p-5 space-y-4">
            {job.customers && (
              <DetailRow icon={<User className="w-4 h-4 text-gray-400" />} label="Kund">
                <Link to={`/customers/${job.customers.id}`} className="text-sm text-primary font-semibold hover:underline">
                  {job.customers.name}
                </Link>
              </DetailRow>
            )}

            <DetailRow icon={<CalendarDays className="w-4 h-4 text-gray-400" />} label="Datum">
              <span className="text-sm text-gray-800 capitalize">
                {formatDateTime(job.scheduled_date, job.scheduled_time)}
              </span>
            </DetailRow>

            {job.description && (
              <DetailRow icon={<FileText className="w-4 h-4 text-gray-400" />} label="Beskrivning">
                <span className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{job.description}</span>
              </DetailRow>
            )}

            {job.quotes && (
              <DetailRow icon={<Link2 className="w-4 h-4 text-gray-400" />} label="Kopplad offert">
                <Link to={`/quotes/${job.quote_id}`} className="text-sm text-primary font-semibold hover:underline">
                  Offert {job.quotes.quote_number}
                </Link>
              </DetailRow>
            )}

            {job.completed_date && (
              <DetailRow icon={<CheckCircle className="w-4 h-4 text-green-500" />} label="Avslutad">
                <span className="text-sm text-gray-800">
                  {new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(job.completed_date))}
                </span>
              </DetailRow>
            )}

            {job.notes && (
              <DetailRow icon={<StickyNote className="w-4 h-4 text-gray-400" />} label="Anteckningar">
                <span className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{job.notes}</span>
              </DetailRow>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-danger rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {/* Status action buttons */}
        {status === 'planerad' && (
          <button
            onClick={() => updateStatus('pågående')}
            disabled={updating}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-60 text-white font-semibold h-12 rounded-xl transition-all shadow-sm"
          >
            <Play className="w-5 h-5" />
            {updating ? 'Uppdaterar...' : 'Starta jobb'}
          </button>
        )}

        {status === 'pågående' && (
          <button
            onClick={() => updateStatus('avslutad')}
            disabled={updating}
            className="w-full flex items-center justify-center gap-2 bg-success hover:bg-green-700 active:bg-green-800 disabled:opacity-60 text-white font-semibold h-12 rounded-xl transition-all shadow-sm"
          >
            <CheckCircle className="w-5 h-5" />
            {updating ? 'Uppdaterar...' : 'Slutför jobb'}
          </button>
        )}

        {status === 'avslutad' && (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <p className="text-sm font-semibold text-success">Jobbet är avslutat. Dags att fakturera!</p>
            </div>
            <button
              onClick={() => navigate(`/invoices/new?job_id=${id}`)}
              disabled={updating}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-bold h-12 rounded-xl transition-all shadow-sm"
            >
              <Receipt className="w-5 h-5" />
              Skapa faktura
            </button>
          </div>
        )}

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={deleting || updating}
          className="w-full flex items-center justify-center gap-2 bg-white border border-danger/25 hover:bg-red-50 active:bg-red-100 disabled:opacity-60 text-danger font-semibold h-12 rounded-xl transition-all"
        >
          <Trash2 className="w-4 h-4" />
          {deleting ? 'Raderar...' : 'Radera jobb'}
        </button>
      </div>
    </div>
  )
}

function DetailRow({ icon, label, children }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
        {children}
      </div>
    </div>
  )
}
