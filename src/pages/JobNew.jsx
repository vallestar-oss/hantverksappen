import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { useCustomerOptions } from '../hooks/useCustomerOptions'
import Page from '../components/Premium'
import { FormHeader, FormError, SubmitButton } from '../components/FormField'
import { InfoBanner } from '../components/DocumentBuilder'
import { JobFields } from '../components/EntityFields'
import { jobPayload } from '../lib/entities'
import { todayISO } from '../lib/date'

export default function JobNew() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const showToast = useToast()
  const [searchParams] = useSearchParams()
  const quoteIdParam = searchParams.get('quote_id')
  const customerIdParam = searchParams.get('customer_id')
  const { customers } = useCustomerOptions(user.id)

  const [linkedQuote, setLinkedQuote] = useState(null)
  const [form, setForm] = useState(() => ({
    title: '', customer_id: customerIdParam || '', description: '',
    scheduled_date: todayISO(), scheduled_time: '', notes: '',
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Pre-fill from a quote when created via "Skapa jobb".
  useEffect(() => {
    if (!quoteIdParam) return
    let active = true

    async function fetchQuote() {
      const { data } = await supabase
        .from('quotes')
        .select('quote_number, customer_id')
        .eq('id', quoteIdParam)
        .eq('user_id', user.id)
        .maybeSingle()
      if (!active || !data) return
      setLinkedQuote(data)
      setForm(prev => ({ ...prev, title: `Jobb från offert ${data.quote_number}`, customer_id: data.customer_id ?? '' }))
    }

    fetchQuote()
    return () => { active = false }
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
    const { data, error: saveError } = await supabase
      .from('jobs')
      .insert({ user_id: user.id, quote_id: quoteIdParam || null, status: 'planerad', ...jobPayload(form) })
      .select()
      .single()

    if (saveError) {
      setError('Kunde inte spara jobbet. Försök igen.')
      setSaving(false)
      return
    }
    showToast('Jobbet skapades', 'success')
    navigate(`/jobs/${data.id}`)
  }

  return (
    <Page className="min-h-screen" style={{ background: '#F8F8F8' }}>
      <FormHeader title="Nytt jobb" onBack={() => navigate('/jobs')} />

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-5 space-y-4 pb-20">
        {linkedQuote && (
          <InfoBanner>
            Skapad från offert <span className="font-semibold">{linkedQuote.quote_number}</span>
          </InfoBanner>
        )}

        <JobFields form={form} onChange={handleChange} customers={customers} />

        <FormError>{error}</FormError>
        <SubmitButton busy={saving}>Spara jobb</SubmitButton>
      </form>
    </Page>
  )
}
