import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { useCustomerOptions } from '../hooks/useCustomerOptions'
import Page from '../components/Premium'
import { Card, Field, FormError, inputClass } from '../components/FormField'
import {
  BuilderHeader, CustomerCard, RotRutSection, LineItemsSection, TotalsSummary, StickyTotalBar, InfoBanner,
} from '../components/DocumentBuilder'
import { createDocument, emptyRow, rowsFromItems } from '../lib/documents'
import { addDaysISO, todayISO } from '../lib/date'
import { calcTotals } from '../utils/calc'

const PAYMENT_TERMS_DAYS = 30

export default function InvoiceNew() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const showToast = useToast()
  const [searchParams] = useSearchParams()
  const jobIdParam = searchParams.get('job_id')
  const { customers, error: customersError } = useCustomerOptions(user.id)

  const [linkedJob, setLinkedJob] = useState(null)
  const [customerId, setCustomerId] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(todayISO)
  const [dueDate, setDueDate] = useState(() => addDaysISO(PAYMENT_TERMS_DAYS))
  const [notes, setNotes] = useState('')
  const [rotRut, setRotRut] = useState(false)
  const [rotRutType, setRotRutType] = useState('rot')
  const [rows, setRows] = useState(() => [emptyRow()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Pre-fill from a job (and its quote) when created via "Skapa faktura".
  useEffect(() => {
    if (!jobIdParam) return
    let active = true

    async function fetchJob() {
      const { data: job } = await supabase
        .from('jobs')
        .select('*, customers(id, name), quotes(id, rot_rut_enabled, rot_rut_type, quote_items(*))')
        .eq('id', jobIdParam)
        .eq('user_id', user.id)
        .maybeSingle()
      if (!active || !job) return

      setLinkedJob(job)
      setCustomerId(job.customer_id ?? '')

      const quoteItems = job.quotes?.quote_items
      if (quoteItems?.length > 0) {
        setRows(rowsFromItems(quoteItems))
        if (job.quotes.rot_rut_enabled) {
          setRotRut(true)
          setRotRutType(job.quotes.rot_rut_type ?? 'rot')
        }
      }
    }

    fetchJob()
    return () => { active = false }
  }, [jobIdParam, user.id])

  const totals = useMemo(() => calcTotals(rows, rotRut), [rows, rotRut])

  async function handleSave() {
    setError('')
    if (!customerId) {
      setError('Välj en kund för att spara fakturan.')
      return
    }

    setSaving(true)
    const { data: invoice, error: saveError } = await createDocument(
      'invoice',
      user.id,
      {
        customer_id: customerId,
        job_id: jobIdParam || null,
        status: 'obetald',
        invoice_date: invoiceDate || null,
        due_date: dueDate || null,
        notes: notes.trim() || null,
        rot_rut_enabled: rotRut,
        rot_rut_type: rotRut ? rotRutType : null,
      },
      rows,
    )

    if (saveError) {
      setError('Kunde inte spara fakturan. Försök igen.')
      setSaving(false)
      return
    }

    showToast('Fakturan skapades', 'success')
    navigate(`/invoices/${invoice.id}`)
  }

  return (
    <Page className="min-h-screen bg-gray-50">
      <BuilderHeader title="Ny faktura" onBack={() => navigate('/invoices')} onSave={handleSave} saving={saving} />

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4 pb-28">
        {linkedJob && (
          <InfoBanner>
            Skapad från jobb: <span className="font-semibold">{linkedJob.title}</span>
          </InfoBanner>
        )}

        <CustomerCard customers={customers} value={customerId} onChange={setCustomerId} />
        {customersError && <FormError>Kunde inte hämta kunder. Ladda om sidan.</FormError>}

        <Card title="Fakturadetaljer">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fakturadatum">
              <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Förfallodatum">
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputClass} />
            </Field>
          </div>
          <Field label="Anteckningar">
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ev. noteringar till kunden…"
              className={`${inputClass} resize-none`}
            />
          </Field>
        </Card>

        <RotRutSection
          enabled={rotRut}
          onEnabledChange={setRotRut}
          type={rotRutType}
          onTypeChange={setRotRutType}
          totals={totals}
        />

        <LineItemsSection rows={rows} setRows={setRows} />

        <TotalsSummary totals={totals} rotRutEnabled={rotRut} rotRutType={rotRutType} />

        <FormError>{error}</FormError>
      </div>

      <StickyTotalBar rotRutEnabled={rotRut} toPay={totals.toPay} saving={saving} saveLabel="Spara faktura" onSave={handleSave} />
    </Page>
  )
}
