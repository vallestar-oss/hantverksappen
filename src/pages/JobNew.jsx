import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function JobNew() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const quoteIdParam = searchParams.get('quote_id')

  const [customers, setCustomers] = useState([])
  const [linkedQuote, setLinkedQuote] = useState(null)

  const [form, setForm] = useState({
    title: '',
    customer_id: '',
    description: '',
    scheduled_date: todayISO(),
    scheduled_time: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Load customers
  useEffect(() => {
    supabase
      .from('customers')
      .select('id, name')
      .eq('user_id', user.id)
      .order('name')
      .then(({ data }) => setCustomers(data ?? []))
  }, [user.id])

  // Pre-fill from quote if quote_id param present
  useEffect(() => {
    if (!quoteIdParam) return
    async function fetchQuote() {
      const { data } = await supabase
        .from('quotes')
        .select('*, customers(id, name)')
        .eq('id', quoteIdParam)
        .eq('user_id', user.id)
        .single()

      if (data) {
        setLinkedQuote(data)
        setForm(prev => ({
          ...prev,
          title: `Jobb från offert ${data.quote_number}`,
          customer_id: data.customer_id ?? '',
        }))
      }
    }
    fetchQuote()
  }, [quoteIdParam, user.id])

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

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        customer_id: form.customer_id,
        quote_id: quoteIdParam || null,
        title: form.title.trim(),
        description: form.description.trim() || null,
        scheduled_date: form.scheduled_date || null,
        scheduled_time: form.scheduled_time || null,
        notes: form.notes.trim() || null,
        status: 'planerad',
      })
      .select()
      .single()

    if (error) {
      console.error('Job insert error:', error)
      setError(`Kunde inte spara jobbet: ${error.message}`)
      setSaving(false)
    } else {
      navigate(`/jobs/${data.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
        <h1 className="font-bold text-gray-800 text-lg">Nytt jobb</h1>
      </header>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-5 space-y-4 pb-20">

        {/* Quote info banner */}
        {linkedQuote && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-700">
              Skapad från offert <span className="font-semibold">{linkedQuote.quote_number}</span>
            </p>
          </div>
        )}

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
          disabled={saving}
          className="w-full bg-primary hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors duration-150 shadow-sm"
        >
          {saving ? 'Sparar...' : 'Spara jobb'}
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
