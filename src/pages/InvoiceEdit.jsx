import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useCustomerOptions } from '../hooks/useCustomerOptions'
import Page from '../components/Premium'
import { SkeletonPage } from '../components/Skeleton'
import { Card, Field, FormError, inputClass } from '../components/FormField'
import {
  BuilderHeader, CustomerCard, RotRutSection, LineItemsSection, TotalsSummary, StickyTotalBar, MissingDocument,
} from '../components/DocumentBuilder'
import { updateDocument, emptyRow, rowsFromItems } from '../lib/documents'
import { addDaysISO, todayISO } from '../lib/date'
import { calcTotals } from '../utils/calc'

const PAYMENT_TERMS_DAYS = 30

export default function InvoiceEdit() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { customers } = useCustomerOptions(user.id)

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(todayISO)
  const [dueDate, setDueDate] = useState(() => addDaysISO(PAYMENT_TERMS_DAYS))
  const [notes, setNotes] = useState('')
  const [rotRut, setRotRut] = useState(false)
  const [rotRutType, setRotRutType] = useState('rot')
  const [rows, setRows] = useState(() => [emptyRow()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('*, invoice_items(*)')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle()
      if (!active) return

      if (!invoice) {
        setNotFound(true)
      } else {
        setCustomerId(invoice.customer_id ?? '')
        setInvoiceDate(invoice.invoice_date ?? todayISO())
        setDueDate(invoice.due_date ?? addDaysISO(PAYMENT_TERMS_DAYS))
        setNotes(invoice.notes ?? '')
        setRotRut(invoice.rot_rut_enabled ?? false)
        setRotRutType(invoice.rot_rut_type ?? 'rot')
        setRows(rowsFromItems(invoice.invoice_items))
      }
      setLoading(false)
    }

    load()
    return () => { active = false }
  }, [id, user.id])

  const totals = useMemo(() => calcTotals(rows, rotRut), [rows, rotRut])

  async function handleSave() {
    setError('')
    if (!customerId) {
      setError('Välj en kund för att spara fakturan.')
      return
    }

    setSaving(true)
    const { error: saveError } = await updateDocument(
      'invoice',
      user.id,
      id,
      {
        customer_id: customerId,
        invoice_date: invoiceDate || null,
        due_date: dueDate || null,
        notes: notes.trim() || null,
        rot_rut_enabled: rotRut,
        rot_rut_type: rotRut ? rotRutType : null,
      },
      rows,
    )

    if (saveError) {
      setError('Kunde inte spara ändringarna. Försök igen.')
      setSaving(false)
      return
    }

    navigate(`/invoices/${id}`, { state: { saved: true } })
  }

  if (loading) return <SkeletonPage />

  if (notFound) {
    return (
      <MissingDocument
        title="Redigera faktura"
        message="Fakturan hittades inte"
        backLabel="Tillbaka till fakturor"
        onBack={() => navigate('/invoices')}
      />
    )
  }

  return (
    <Page className="min-h-screen bg-gray-50">
      <BuilderHeader title="Redigera faktura" onBack={() => navigate(`/invoices/${id}`)} onSave={handleSave} saving={saving} />

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4 pb-28">
        <CustomerCard customers={customers} value={customerId} onChange={setCustomerId} />

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

      <StickyTotalBar rotRutEnabled={rotRut} toPay={totals.toPay} saving={saving} saveLabel="Spara ändringar" onSave={handleSave} />
    </Page>
  )
}
