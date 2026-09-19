import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronRight, BarChart3, ImagePlus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { uploadLogo, storableLogoUrl } from '../lib/logo'
import { useAuth } from '../hooks/useAuth'
import Page from '../components/Premium'
import {
  Card, Field, Toggle, FormHeader, FormError, FormSuccess, SubmitButton, inputClass,
} from '../components/FormField'

const EMPTY_FORM = {
  company_name: '', org_number: '', f_skatt: false, address: '', postal_code: '',
  city: '', phone: '', email: '', bankgiro: '', swish: '', logo_url: '',
}

const SUCCESS_VISIBLE_MS = 4000

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
    let active = true

    async function loadProfile() {
      const { data, error: loadError } = await supabase
        .from('company_profiles')
        .select()
        .eq('user_id', user.id)
        .maybeSingle()
      if (!active) return

      if (loadError) setError('Kunde inte ladda uppgifter.')
      if (data) {
        setForm({
          company_name: data.company_name ?? '', org_number: data.org_number ?? '',
          f_skatt: data.f_skatt ?? false, address: data.address ?? '',
          postal_code: data.postal_code ?? '', city: data.city ?? '',
          phone: data.phone ?? '', email: data.email ?? '',
          bankgiro: data.bankgiro ?? '', swish: data.swish ?? '', logo_url: data.logo_url ?? '',
        })
      }
      setLoading(false)
    }

    loadProfile()
    return () => { active = false }
  }, [user.id])

  // Hide the "saved" notice after a few seconds; the cleanup covers unmounting.
  useEffect(() => {
    if (!success) return
    const timer = setTimeout(() => setSuccess(false), SUCCESS_VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [success])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploading(true)
    setError('')
    const { url, error: uploadError } = await uploadLogo(user.id, file)
    if (uploadError) setError(uploadError)
    else setForm(prev => ({ ...prev, logo_url: url }))
    setUploading(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    const { error: saveError } = await supabase.from('company_profiles').upsert(
      {
        user_id: user.id,
        ...form,
        logo_url: storableLogoUrl(form.logo_url),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )

    if (saveError) setError('Kunde inte spara uppgifter. Försök igen.')
    else setSuccess(true)
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F8F8' }}>
        <p className="text-gray-400 text-sm" role="status">Laddar…</p>
      </div>
    )
  }

  return (
    <Page className="min-h-screen" style={{ background: '#F8F8F8' }}>
      <FormHeader title="Inställningar" onBack={() => navigate('/dashboard')} />

      <form onSubmit={handleSave} className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-20">
        <Card title="Företagsuppgifter" className="space-y-5">
          <Field label="Företagsnamn">
            <input name="company_name" type="text" autoComplete="organization" value={form.company_name}
              onChange={handleChange} placeholder="Mitt AB" className={inputClass} />
          </Field>
          <Field label="Organisationsnummer">
            <input name="org_number" type="text" value={form.org_number}
              onChange={handleChange} placeholder="556123-4567" className={inputClass} />
          </Field>
          <Toggle name="f_skatt" checked={form.f_skatt} onChange={handleChange} label="Innehar F-skattsedel" />
          <Field label="Adress">
            <input name="address" type="text" autoComplete="street-address" value={form.address}
              onChange={handleChange} placeholder="Storgatan 1" className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Postnummer">
              <input name="postal_code" type="text" inputMode="numeric" autoComplete="postal-code" value={form.postal_code}
                onChange={handleChange} placeholder="123 45" className={inputClass} />
            </Field>
            <Field label="Stad">
              <input name="city" type="text" value={form.city}
                onChange={handleChange} placeholder="Stockholm" className={inputClass} />
            </Field>
          </div>
          <Field label="Telefon">
            <input name="phone" type="tel" autoComplete="tel" value={form.phone}
              onChange={handleChange} placeholder="070-123 45 67" className={inputClass} />
          </Field>
          <Field label="E-post">
            <input name="email" type="email" value={form.email}
              onChange={handleChange} placeholder="info@mittab.se" className={inputClass} />
          </Field>
        </Card>

        <Card title="Betalningsuppgifter" subtitle="Visas på fakturor som du skickar till kunder." className="space-y-5">
          <Field label="Bankgiro">
            <input name="bankgiro" type="text" value={form.bankgiro}
              onChange={handleChange} placeholder="123-4567" className={inputClass} />
          </Field>
          <Field label="Swish">
            <input name="swish" type="text" value={form.swish}
              onChange={handleChange} placeholder="070-123 45 67" className={inputClass} />
          </Field>
        </Card>

        <Card title="Logotyp" subtitle="PNG eller JPG, högst 2 MB. Visas på PDF-filer." className="space-y-3">
          {form.logo_url && (
            <img src={form.logo_url} alt="Din logotyp" className="h-20 object-contain rounded-xl border border-gray-200" />
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleLogoUpload}
            className="hidden"
            aria-label="Välj logotyp"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-60"
          >
            <ImagePlus className="w-4 h-4" aria-hidden="true" />
            {uploading ? 'Laddar upp…' : form.logo_url ? 'Byt logotyp' : 'Ladda upp logotyp'}
          </button>
        </Card>

        <FormError>{error}</FormError>
        <FormSuccess>{success && 'Uppgifterna har sparats.'}</FormSuccess>

        <SubmitButton busy={saving} disabled={uploading}>Spara</SubmitButton>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-gray-100">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Export</h2>
          </div>
          <Link
            to="/export"
            className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-4 h-4 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">Fortnox-export</p>
              <p className="text-xs text-gray-400 mt-0.5">Exportera fakturor som CSV</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </form>
    </Page>
  )
}
