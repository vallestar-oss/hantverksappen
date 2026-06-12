import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Noise } from './Premium'
import {
  Wrench, ArrowRight, UserPlus, FileText, Compass, ChevronRight,
  ImagePlus, Loader2, CheckCircle,
} from 'lucide-react'

// First-login onboarding — shown when no company profile exists yet.
// Three steps: welcome → company info → done. Never shown again afterwards.

const ONBOARDING_CSS = `
@keyframes onboarding-step {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.onboarding-step { animation: onboarding-step 250ms ease both; }
`

export function onboardingDoneKey(userId) {
  return `hv_onboarded_${userId}`
}

export default function Onboarding({ onComplete }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ company_name: '', org_number: '', phone: '', email: '', logo_url: '' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    const ext = file.name.split('.').pop()
    const path = `${user.id}/logo.${ext}`
    const { error: uploadError } = await supabase.storage.from('logos').upload(path, file, { upsert: true })
    if (uploadError) { setError('Kunde inte ladda upp logotypen. Du kan göra det senare under Inställningar.'); setUploading(false); return }
    const { data } = supabase.storage.from('logos').getPublicUrl(path)
    setForm(prev => ({ ...prev, logo_url: `${data.publicUrl}?t=${Date.now()}` }))
    setUploading(false)
  }

  async function handleSaveCompany(e) {
    e.preventDefault()
    setError('')
    if (!form.company_name.trim()) { setError('Ange ditt företagsnamn för att fortsätta.'); return }
    setSaving(true)
    const profile = {
      user_id: user.id,
      company_name: form.company_name.trim(),
      org_number: form.org_number.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      logo_url: form.logo_url.split('?')[0] || null,
      updated_at: new Date().toISOString(),
    }
    const { error: saveError } = await supabase
      .from('company_profiles')
      .upsert(profile, { onConflict: 'user_id' })
    if (saveError) {
      setError('Kunde inte spara uppgifterna. Försök igen.')
      setSaving(false)
      return
    }
    localStorage.setItem(onboardingDoneKey(user.id), '1')
    setSaving(false)
    setStep(3)
  }

  function finish(path) {
    localStorage.setItem(onboardingDoneKey(user.id), '1')
    onComplete({ company_name: form.company_name.trim(), logo_url: form.logo_url.split('?')[0] || '' })
    if (path) navigate(path)
  }

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto" style={{ background: '#111111' }}>
      <style>{ONBOARDING_CSS}</style>
      <Noise />
      {/* blue glow */}
      <div
        aria-hidden="true"
        className="fixed pointer-events-none"
        style={{
          top: '-180px', right: '-120px', width: '480px', height: '480px',
          background: 'radial-gradient(circle, rgba(0,85,255,0.30) 0%, transparent 70%)',
        }}
      />

      <div className="relative min-h-full flex flex-col items-center justify-center px-4 py-10">

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-10" aria-hidden="true">
          {[1, 2, 3].map(s => (
            <span
              key={s}
              className="rounded-full transition-all duration-200"
              style={{
                width: s === step ? 24 : 8,
                height: 8,
                background: s <= step ? '#0055FF' : '#333333',
              }}
            />
          ))}
        </div>

        {/* ── Step 1 — Välkommen ── */}
        {step === 1 && (
          <div key="step1" className="onboarding-step flex flex-col items-center text-center max-w-sm w-full">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-7" style={{ background: 'rgba(0,85,255,0.15)' }}>
              <Wrench className="w-8 h-8 text-[#5599FF]" strokeWidth={2} />
            </div>
            <h1 className="text-3xl font-extrabold text-white leading-tight" style={{ letterSpacing: '-0.02em' }}>
              Välkommen till Hantverksappen
            </h1>
            <p className="text-gray-400 text-base mt-3 leading-relaxed">
              Låt oss sätta upp ditt konto på 2 minuter
            </p>
            <button
              onClick={() => setStep(2)}
              className="btn-lift mt-9 w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark active:bg-primary-darker text-white font-semibold h-12 rounded-xl text-base"
            >
              Kom igång
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Step 2 — Företagsinformation ── */}
        {step === 2 && (
          <form key="step2" onSubmit={handleSaveCompany} className="onboarding-step w-full max-w-sm">
            <h1 className="text-2xl font-extrabold text-white text-center leading-tight" style={{ letterSpacing: '-0.02em' }}>
              Berätta om ditt företag
            </h1>
            <p className="text-gray-400 text-sm text-center mt-2 mb-7">
              Uppgifterna visas på dina offerter och fakturor.
            </p>

            <div className="bg-white rounded-xl p-5 space-y-4">
              <Field label="Företagsnamn *">
                <input
                  name="company_name" type="text" value={form.company_name} onChange={handleChange}
                  placeholder="Mitt Bygg AB" className={inputClass} autoFocus
                />
              </Field>
              <Field label="Organisationsnummer">
                <input
                  name="org_number" type="text" value={form.org_number} onChange={handleChange}
                  placeholder="556123-4567" className={inputClass}
                />
              </Field>
              <Field label="Telefon">
                <input
                  name="phone" type="tel" value={form.phone} onChange={handleChange}
                  placeholder="070-123 45 67" className={inputClass}
                />
              </Field>
              <Field label="E-post">
                <input
                  name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="info@mittbygg.se" className={inputClass}
                />
              </Field>

              {/* Optional logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Logotyp <span className="text-gray-400 font-normal">(valfritt)</span></label>
                {form.logo_url && (
                  <img src={form.logo_url} alt="Logotyp" className="h-14 object-contain rounded-xl border border-gray-200 mb-2" />
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                <button
                  type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-xl h-11 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-60"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                  {uploading ? 'Laddar upp…' : form.logo_url ? 'Byt logotyp' : 'Ladda upp logotyp'}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-300 mt-3 px-1">{error}</p>}

            <button
              type="submit" disabled={saving || uploading}
              className="btn-lift mt-5 w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark active:bg-primary-darker disabled:opacity-60 text-white font-semibold h-12 rounded-xl text-base"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Sparar…' : 'Fortsätt'}
            </button>
          </form>
        )}

        {/* ── Step 3 — Klar ── */}
        {step === 3 && (
          <div key="step3" className="onboarding-step flex flex-col items-center text-center max-w-sm w-full">
            <div className="check-pop w-16 h-16 rounded-full flex items-center justify-center mb-7" style={{ background: 'rgba(22,163,74,0.18)' }}>
              <CheckCircle className="w-9 h-9 text-green-400" strokeWidth={2} />
            </div>
            <h1 className="text-3xl font-extrabold text-white leading-tight" style={{ letterSpacing: '-0.02em' }}>
              Ditt konto är redo
            </h1>
            <p className="text-gray-400 text-base mt-3 leading-relaxed mb-8">
              Här är tre bra sätt att komma igång.
            </p>

            <div className="w-full space-y-3">
              <QuickStartCard
                Icon={UserPlus}
                label="Lägg till din första kund"
                onClick={() => finish('/customers/new')}
              />
              <QuickStartCard
                Icon={FileText}
                label="Skapa din första offert"
                onClick={() => finish('/quotes/new')}
              />
              <QuickStartCard
                Icon={Compass}
                label="Se en rundtur"
                onClick={() => finish(null)}
              />
            </div>

            <button
              onClick={() => finish(null)}
              className="mt-7 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Gå till översikten
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const inputClass =
  'w-full border border-gray-200 rounded-xl px-4 h-11 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all'

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function QuickStartCard({ Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="card-lift w-full flex items-center gap-3 rounded-xl px-4 py-4 text-left"
      style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,85,255,0.15)' }}>
        <Icon className="w-5 h-5 text-[#5599FF]" />
      </div>
      <span className="flex-1 text-sm font-semibold text-white">{label}</span>
      <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
    </button>
  )
}
