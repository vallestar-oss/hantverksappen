import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import Page from '../components/Premium'
import { FormHeader, FormError, SubmitButton } from '../components/FormField'
import { CustomerFields } from '../components/EntityFields'
import { customerPayload, EMPTY_CUSTOMER } from '../lib/entities'

export default function CustomerNew() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const showToast = useToast()

  const [form, setForm] = useState(EMPTY_CUSTOMER)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('Namn är obligatoriskt.'); return }

    setSaving(true)
    const { error: saveError } = await supabase
      .from('customers')
      .insert({ user_id: user.id, ...customerPayload(form) })

    if (saveError) {
      setError('Kunde inte spara kunden. Försök igen.')
      setSaving(false)
      return
    }
    showToast('Kunden lades till', 'success')
    navigate('/customers')
  }

  return (
    <Page className="min-h-screen" style={{ background: '#F8F8F8' }}>
      <FormHeader title="Ny kund" onBack={() => navigate('/customers')} />

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-20">
        <CustomerFields form={form} onChange={handleChange} />

        <FormError>{error}</FormError>
        <SubmitButton busy={saving}>Spara kund</SubmitButton>
      </form>
    </Page>
  )
}
