import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ChevronLeft, AlertCircle, Loader2, Trash2 } from 'lucide-react'
import { SkeletonPage } from '../components/Skeleton'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import { Fx } from '../components/Premium'

export default function CustomerEdit() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', postal_code: '', city: '', notes: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const { confirmDialog, confirm } = useConfirmDialog()

  useEffect(() => {
    async function loadCustomer() {
      const { data, error } = await supabase
        .from('customers').select('*').eq('id', id).eq('user_id', user.id).single()
      if (error || !data) { navigate('/customers'); return }
      setForm({
        name: data.name ?? '', phone: data.phone ?? '', email: data.email ?? '',
        address: data.address ?? '', postal_code: data.postal_code ?? '',
        city: data.city ?? '', notes: data.notes ?? '',
      })
      setLoading(false)
    }
    loadCustomer()
  }, [id, user.id, navigate])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('Namn är obligatoriskt.'); return }
    setSaving(true)
    const { error } = await supabase.from('customers').update({
      name: form.name.trim(), phone: form.phone.trim() || null, email: form.email.trim() || null,
      address: form.address.trim() || null, postal_code: form.postal_code.trim() || null,
      city: form.city.trim() || null, notes: form.notes.trim() || null,
    }).eq('id', id).eq('user_id', user.id)
    if (error) { setError('Kunde inte spara ändringarna. Försök igen.'); setSaving(false) }
    else navigate(`/customers/${id}`)
  }

  async function handleDelete() {
    const ok = await confirm(
      'Radera kund',
      'Är du säker på att du vill radera denna kund? All kopplad data raderas också.'
    )
    if (!ok) return
    setDeleting(true)
    const { error } = await supabase.from('customers').delete().eq('id', id).eq('user_id', user.id)
    if (error) { setError('Kunde inte radera kunden. Försök igen.'); setDeleting(false) }
    else navigate('/customers')
  }

  if (loading) return <SkeletonPage />

  return (
    <>
      {confirmDialog}
      <div className="page-fade min-h-screen" style={{ background: '#F8F8F8' }}>
      <Fx />
      <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(`/customers/${id}`)} className="text-gray-500 hover:text-gray-800 transition-colors p-1.5 -ml-1 rounded-xl hover:bg-gray-100" aria-label="Tillbaka">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg">Redigera kund</h1>
      </header>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-20">
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">

          <Field label="Namn *">
            <input name="name" type="text" value={form.name} onChange={handleChange}
              placeholder="Anna Andersson" className={inputClass} />
          </Field>

          <Field label="Telefon">
            <input name="phone" type="tel" value={form.phone} onChange={handleChange}
              placeholder="070-123 45 67" className={inputClass} />
          </Field>

          <Field label="E-post">
            <input name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="anna@exempel.se" className={inputClass} />
          </Field>

          <Field label="Adress">
            <input name="address" type="text" value={form.address} onChange={handleChange}
              placeholder="Storgatan 1" className={inputClass} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Postnummer">
              <input name="postal_code" type="text" value={form.postal_code} onChange={handleChange}
                placeholder="123 45" className={inputClass} />
            </Field>
            <Field label="Stad">
              <input name="city" type="text" value={form.city} onChange={handleChange}
                placeholder="Stockholm" className={inputClass} />
            </Field>
          </div>

          <Field label="Anteckningar">
            <textarea name="notes" rows={3} value={form.notes} onChange={handleChange}
              placeholder="Övriga anteckningar..." className={`${inputClass} resize-none`} />
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
          {deleting ? 'Raderar…' : 'Radera kund'}
        </button>
      </form>
    </div>
    </>
  )
}

const inputClass = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white'

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
