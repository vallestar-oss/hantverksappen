import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ChevronLeft, AlertCircle, Loader2, Trash2 } from 'lucide-react'
import { SkeletonPage } from '../components/Skeleton'
import { useConfirmDialog } from '../hooks/useConfirmDialog'

export default function JobEdit() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [customers, setCustomers] = useState([])
  const [form, setForm] = useState({ title: '', customer_id: '', description: '', scheduled_date: '', scheduled_time: '', notes: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const { confirmDialog, confirm } = useConfirmDialog()

  useEffect(() => {
    async function load() {
      const [{ data: customerData }, { data: jobData, error: jobErr }] = await Promise.all([
        supabase.from('customers').select('id, name').eq('user_id', user.id).order('name'),
        supabase.from('jobs').select('*').eq('id', id).eq('user_id', user.id).single(),
      ])
      setCustomers(customerData ?? [])
      if (jobErr || !jobData) { navigate('/jobs'); return }
      setForm({
        title: jobData.title ?? '', customer_id: jobData.customer_id ?? '',
        description: jobData.description ?? '', scheduled_date: jobData.scheduled_date ?? '',
        scheduled_time: jobData.scheduled_time ?? '', notes: jobData.notes ?? '',
      })
      setLoading(false)
    }
    load()
  }, [id, user.id, navigate])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.title.trim()) { setError('Titel är obligatoriskt.'); return }
    if (!form.customer_id) { setError('Välj en kund.'); return }
    setSaving(true)
    const { error } = await supabase.from('jobs').update({
      title: form.title.trim(), customer_id: form.customer_id,
      description: form.description.trim() || null, scheduled_date: form.scheduled_date || null,
      scheduled_time: form.scheduled_time || null, notes: form.notes.trim() || null,
      updated_at: new Date().toISOString(),
    }).eq('id', id).eq('user_id', user.id)
    if (error) { setError(`Kunde inte spara: ${error.message}`); setSaving(false) }
    else navigate(`/jobs/${id}`)
  }

  async function handleDelete() {
    const ok = await confirm(
      'Radera jobb',
      'Är du säker på att du vill radera detta jobb? Detta går inte att ångra.'
    )
    if (!ok) return
    setDeleting(true)
    const { error } = await supabase.from('jobs').delete().eq('id', id).eq('user_id', user.id)
    if (error) { setError('Kunde inte radera jobbet. Försök igen.'); setDeleting(false) }
    else navigate('/jobs')
  }

  if (loading) return <SkeletonPage />

  return (
    <>
      {confirmDialog}
      <div className="min-h-screen" style={{ background: '#F8F8F8' }}>
      <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(`/jobs/${id}`)} className="text-gray-500 hover:text-gray-800 transition-colors p-1.5 -ml-1 rounded-xl hover:bg-gray-100" aria-label="Tillbaka">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg">Redigera jobb</h1>
      </header>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-5 space-y-4 pb-20">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">

          <Field label="Titel *">
            <input name="title" type="text" value={form.title} onChange={handleChange}
              placeholder="Badrumsrenovering" className={inputClass} />
          </Field>

          <Field label="Kund *">
            <select name="customer_id" value={form.customer_id} onChange={handleChange} className={inputClass}>
              <option value="">Välj kund</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>

          <Field label="Beskrivning">
            <textarea name="description" rows={3} value={form.description} onChange={handleChange}
              placeholder="Beskrivning av jobbet..." className={`${inputClass} resize-none`} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Datum">
              <input name="scheduled_date" type="date" value={form.scheduled_date} onChange={handleChange} className={inputClass} />
            </Field>
            <Field label="Tid">
              <input name="scheduled_time" type="time" value={form.scheduled_time} onChange={handleChange} className={inputClass} />
            </Field>
          </div>

          <Field label="Anteckningar">
            <textarea name="notes" rows={3} value={form.notes} onChange={handleChange}
              placeholder="Interna anteckningar..." className={`${inputClass} resize-none`} />
          </Field>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-danger rounded-xl px-3 py-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <button type="submit" disabled={saving || deleting}
          className="w-full bg-primary hover:bg-primary-dark active:bg-primary-darker disabled:opacity-60 text-white font-semibold h-12 rounded-xl transition-all">
          {saving ? 'Sparar…' : 'Spara ändringar'}
        </button>

        <button type="button" onClick={handleDelete} disabled={saving || deleting}
          className="w-full flex items-center justify-center gap-2 bg-white border border-danger/25 hover:bg-red-50 active:bg-red-100 disabled:opacity-60 text-danger font-semibold h-12 rounded-xl transition-all">
          <Trash2 className="w-4 h-4" />
          {deleting ? 'Raderar…' : 'Radera jobb'}
        </button>
      </form>
    </div>
    </>
  )
}

const inputClass = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all'

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
