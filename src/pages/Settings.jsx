import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ChevronLeft, ChevronRight, BarChart3, CheckCircle, AlertCircle, ImagePlus } from 'lucide-react'

const EMPTY_FORM = {
  company_name: '', org_number: '', f_skatt: false, address: '', postal_code: '',
  city: '', phone: '', email: '', bankgiro: '', swish: '', logo_url: '',
}

export default function Settings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProfile() {
      const { data, error } = await supabase.from('company_profiles').select().eq('user_id', user.id).single()
      if (data) {
        setForm({
          company_name: data.company_name ?? '', org_number: data.org_number ?? '',
          f_skatt: data.f_skatt ?? false, address: data.address ?? '',
          postal_code: data.postal_code ?? '', city: data.city ?? '',
          phone: data.phone ?? '', email: data.email ?? '',
          bankgiro: data.bankgiro ?? '', swish: data.swish ?? '', logo_url: data.logo_url ?? '',
        })
      }
      if (error && error.code !== 'PGRST116') setError('Kunde inte ladda uppgifter.')
      setLoading(false)
    }
    loadProfile()
  }, [user.id])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    const ext = file.name.split('.').pop()
    const path = `${user.id}/logo.${ext}`
    const { error: uploadError } = await supabase.storage.from('logos').upload(path, file, { upsert: true })
    if (uploadError) { setError('Kunde inte ladda upp logotyp.'); setUploading(false); return }
    const { data } = supabase.storage.from('logos').getPublicUrl(path)
    setForm(prev => ({ ...prev, logo_url: `${data.publicUrl}?t=${Date.now()}` }))
    setUploading(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    const { error } = await supabase.from('company_profiles').upsert({
      user_id: user.id, ...form,
      logo_url: form.logo_url.split('?')[0] || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    if (error) setError('Kunde inte spara uppgifter. Försök igen.')
    else { setSuccess(true); setTimeout(() => setSuccess(false), 4000) }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAFC' }}>
        <p className="text-gray-400 text-sm">Laddar...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#F8FAFC' }}>
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-800 transition-colors p-1.5 -ml-1 rounded-xl hover:bg-gray-100" aria-label="Tillbaka">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg">Inställningar</h1>
      </header>

      <form onSubmit={handleSave} className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-20">

        {/* Företagsuppgifter */}
        <SectionCard title="Företagsuppgifter">
          <Field label="Företagsnamn">
            <input name="company_name" type="text" value={form.company_name} onChange={handleChange}
              placeholder="Mitt AB" className={inputClass} />
          </Field>
          <Field label="Organisationsnummer">
            <input name="org_number" type="text" value={form.org_number} onChange={handleChange}
              placeholder="556123-4567" className={inputClass} />
          </Field>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative">
              <input name="f_skatt" type="checkbox" checked={form.f_skatt} onChange={handleChange} className="sr-only peer" />
              <div className="w-10 h-6 bg-gray-200 peer-checked:bg-primary rounded-full transition-colors duration-150" />
              <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-150 peer-checked:translate-x-4" />
            </div>
            <span className="text-sm font-medium text-gray-700">Innehar F-skattsedel</span>
          </label>
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
          <Field label="Telefon">
            <input name="phone" type="tel" value={form.phone} onChange={handleChange}
              placeholder="070-123 45 67" className={inputClass} />
          </Field>
          <Field label="E-post">
            <input name="email" type="email" value={form.email} onChange={handleChange}
              placeholder="info@mittab.se" className={inputClass} />
          </Field>
        </SectionCard>

        {/* Betalningsuppgifter */}
        <SectionCard title="Betalningsuppgifter" subtitle="Visas på fakturor som du skickar till kunder.">
          <Field label="Bankgiro">
            <input name="bankgiro" type="text" value={form.bankgiro} onChange={handleChange}
              placeholder="123-4567" className={inputClass} />
          </Field>
          <Field label="Swish">
            <input name="swish" type="text" value={form.swish} onChange={handleChange}
              placeholder="070-123 45 67" className={inputClass} />
          </Field>
        </SectionCard>

        {/* Logotyp */}
        <SectionCard title="Logotyp">
          {form.logo_url && (
            <img src={form.logo_url} alt="Logotyp"
              className="h-20 object-contain rounded-xl border border-gray-100 mb-1" />
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-60">
            <ImagePlus className="w-4 h-4" />
            {uploading ? 'Laddar upp...' : form.logo_url ? 'Byt logotyp' : 'Ladda upp logotyp'}
          </button>
        </SectionCard>

        {/* Feedback */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-danger rounded-xl px-3 py-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-green-50 text-green-700 rounded-xl px-3 py-2.5">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm font-medium">Uppgifterna har sparats.</p>
          </div>
        )}

        <button type="submit" disabled={saving}
          className="w-full bg-primary hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-semibold h-12 rounded-xl transition-all shadow-sm">
          {saving ? 'Sparar...' : 'Spara'}
        </button>

        {/* Export */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Export</p>
          </div>
          <Link to="/export"
            className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">Fortnox-export</p>
              <p className="text-xs text-gray-400 mt-0.5">Exportera fakturor som CSV</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
          </Link>
        </div>
      </form>
    </div>
  )
}

const inputClass = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white'

function SectionCard({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
