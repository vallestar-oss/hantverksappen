import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import Page from '../components/Premium'
import { SkeletonPage } from '../components/Skeleton'
import { FormHeader, FormError, SubmitButton, DeleteButton } from '../components/FormField'
import { CustomerFields } from '../components/EntityFields'
import { customerPayload, EMPTY_CUSTOMER } from '../lib/entities'

export default function CustomerEdit() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const showToast = useToast()
  const { confirmDialog, confirm } = useConfirmDialog()

  const [form, setForm] = useState(EMPTY_CUSTOMER)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadCustomer() {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle()
      if (!active) return

      if (!data) {
        navigate('/customers', { replace: true })
        return
      }
      setForm({
        name: data.name ?? '', phone: data.phone ?? '', email: data.email ?? '',
        address: data.address ?? '', postal_code: data.postal_code ?? '',
        city: data.city ?? '', notes: data.notes ?? '',
      })
      setLoading(false)
    }

    loadCustomer()
    return () => { active = false }
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
    const { error: saveError } = await supabase
      .from('customers')
      .update(customerPayload(form))
      .eq('id', id)
      .eq('user_id', user.id)

    if (saveError) {
      setError('Kunde inte spara ändringarna. Försök igen.')
      setSaving(false)
      return
    }
    navigate(`/customers/${id}`)
  }

  async function handleDelete() {
    const ok = await confirm(
      'Radera kund',
      'Är du säker på att du vill radera denna kund? All kopplad data raderas också.',
    )
    if (!ok) return

    setDeleting(true)
    const { error: deleteError } = await supabase.from('customers').delete().eq('id', id).eq('user_id', user.id)
    if (deleteError) {
      setError('Kunde inte radera kunden. Försök igen.')
      setDeleting(false)
      return
    }
    showToast('Kunden raderades', 'info')
    navigate('/customers')
  }

  if (loading) return <SkeletonPage />

  return (
    <>
      {confirmDialog}
      <Page className="min-h-screen" style={{ background: '#F8F8F8' }}>
        <FormHeader title="Redigera kund" onBack={() => navigate(`/customers/${id}`)} />

        <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-6 space-y-4 pb-20">
          <CustomerFields form={form} onChange={handleChange} />

          <FormError>{error}</FormError>
          <SubmitButton busy={saving} disabled={deleting}>Spara ändringar</SubmitButton>
          <DeleteButton busy={deleting} disabled={saving} onClick={handleDelete}>Radera kund</DeleteButton>
        </form>
      </Page>
    </>
  )
}
