import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function JobEdit() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [customers, setCustomers] = useState([])
  const [form, setForm] = useState({
    title: '',
    customer_id: '',
    description: '',
    scheduled_date: '',
    scheduled_time: '',
    notes: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  // Load customers and job in parallel
  useEffect(() => {
    async function load() {
      const [{ data: customerData }, { data: jobData, error: jobErr }] = await Promise.all([
        supabase.from('customers').select('id, name').eq('user_id', user.id).order('name'),
        supabase.from('jobs').select('*').eq('id', id).eq('user_id', user.id).single(),
      ])

      setCustomers(customerData ?? [])

      if (jobErr || !jobData) {
        navigate('/jobs')
        return
      }

      setForm({
        title: jobData.title ?? '',
        customer_id: jobData.customer_id ?? '',
        description: jobData.description ?? '',
        scheduled_date: jobData.scheduled_date ?? '',
        scheduled_time: jobData.scheduled_time ?? '',
        notes: jobData.notes ?? '',
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

    const { error } = await supabase
      .from('jobs')
      .update({
        title: form.title.trim(),
        customer_id: form.customer_id,
        description: form.description.trim() || null,
        scheduled_date: form.scheduled_date || null,
        scheduled_time: form.scheduled_time || null,
        notes: form.notes.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Job update error:', error)
      setError(`Kunde inte spara: ${error.message}`)
      setSaving(false)
    } else {
      navigate(`/jobs/${id}`)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Är du säker på att du vill radera detta jobb?')) return
    setDeleting(true)

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate(`/jobs/${id}`)}
          className="text-gray-500 hover:text-gray-800 transition-colors p-1 -ml-1 rounded-lg"
          aria-label="Tillbaka"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-bold text-gray-800 text-lg">Redigera jobb</h1>
      </header>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-5 space-y-4 pb-20">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">

          <Field label="Titel *">
            <input
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              placeholder="Badrumsrenovering"
              className={inputClass}
            />
          </Field>

          <Field label="Kund *">
            <select
              name="customer_id"
              value={form.customer_id}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Välj kund</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Beskrivning">
            <textarea
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              placeholder="Beskrivning av jobbet..."
              className={`${inputClass} resize-none`}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Datum">
              <input
                name="scheduled_date"
                type="date"
                value={form.scheduled_date}
                onChange={handleChange}
                className={inputClass}
              />
            </Field>
            <Field label="Tid">
              <input
                name="scheduled_time"
                type="time"
                value={form.scheduled_time}
                onChange={handleChange}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Anteckningar">
            <textarea
              name="notes"
              rows={3}
              value={form.notes}
              onChange={handleChange}
              placeholder="Interna anteckningar..."
              className={`${inputClass} resize-none`}
            />
          </Field>
        </div>

        {error && <p className="text-sm text-danger px-1">{error}</p>}

        <button
          type="submit"
          disabled={saving || deleting}
          className="w-full bg-primary hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors duration-150 shadow-sm"
        >
          {saving ? 'Sparar...' : 'Spara ändringar'}
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={saving || deleting}
          className="w-full bg-white border border-danger/30 hover:bg-red-50 active:bg-red-100 disabled:opacity-60 text-danger font-semibold py-3 rounded-xl transition-colors duration-150"
        >
          {deleting ? 'Raderar...' : 'Radera jobb'}
        </button>
      </form>
    </div>
  )
}

const inputClass =
  'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}
