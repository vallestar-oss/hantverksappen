import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { useCustomerOptions } from '../hooks/useCustomerOptions'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import Page from '../components/Premium'
import { SkeletonPage } from '../components/Skeleton'
import { FormHeader, FormError, SubmitButton, DeleteButton } from '../components/FormField'
import { JobFields } from '../components/EntityFields'
import { jobPayload, EMPTY_JOB } from '../lib/entities'

export default function JobEdit() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const showToast = useToast()
  const { customers } = useCustomerOptions(user.id)
  const { confirmDialog, confirm } = useConfirmDialog()

  const [form, setForm] = useState(EMPTY_JOB)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      const { data } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle()
      if (!active) return

      if (!data) {
        navigate('/jobs', { replace: true })
        return
      }
      setForm({
        title: data.title ?? '', customer_id: data.customer_id ?? '',
        description: data.description ?? '', scheduled_date: data.scheduled_date ?? '',
        scheduled_time: data.scheduled_time ?? '', notes: data.notes ?? '',
      })
      setLoading(false)
    }

    load()
    return () => { active = false }
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
    const { error: saveError } = await supabase
      .from('jobs')
      .update({ ...jobPayload(form), updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)

    if (saveError) {
      setError('Kunde inte spara ändringarna. Försök igen.')
      setSaving(false)
      return
    }
    navigate(`/jobs/${id}`)
  }

  async function handleDelete() {
    const ok = await confirm('Radera jobb', 'Är du säker på att du vill radera detta jobb? Detta går inte att ångra.')
    if (!ok) return

    setDeleting(true)
    const { error: deleteError } = await supabase.from('jobs').delete().eq('id', id).eq('user_id', user.id)
    if (deleteError) {
      setError('Kunde inte radera jobbet. Försök igen.')
      setDeleting(false)
      return
    }
    showToast('Jobbet raderades', 'info')
    navigate('/jobs')
  }

  if (loading) return <SkeletonPage />

  return (
    <>
      {confirmDialog}
      <Page className="min-h-screen" style={{ background: '#F8F8F8' }}>
        <FormHeader title="Redigera jobb" onBack={() => navigate(`/jobs/${id}`)} />

        <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-5 space-y-4 pb-20">
          <JobFields form={form} onChange={handleChange} customers={customers} />

          <FormError>{error}</FormError>
          <SubmitButton busy={saving} disabled={deleting}>Spara ändringar</SubmitButton>
          <DeleteButton busy={deleting} disabled={saving} onClick={handleDelete}>Radera jobb</DeleteButton>
        </form>
      </Page>
    </>
  )
}
