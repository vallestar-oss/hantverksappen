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
import { calcTotals } from '../utils/calc'

export default function QuoteEdit() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { customers } = useCustomerOptions(user.id)

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [rotRut, setRotRut] = useState(false)
  const [rotRutType, setRotRutType] = useState('rot')
  const [rows, setRows] = useState(() => [emptyRow()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      const { data: quote } = await supabase
        .from('quotes')
        .select('*, quote_items(*)')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle()
      if (!active) return

      if (!quote) {
        setNotFound(true)
      } else {
        setCustomerId(quote.customer_id ?? '')
        setValidUntil(quote.valid_until ?? '')
        setNotes(quote.notes ?? '')
        setRotRut(quote.rot_rut_enabled ?? false)
        setRotRutType(quote.rot_rut_type ?? 'rot')
        setRows(rowsFromItems(quote.quote_items))
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
      setError('Välj en kund för att spara offerten.')
      return
    }

    setSaving(true)
    const { error: saveError } = await updateDocument(
      'quote',
      user.id,
      id,
      {
        customer_id: customerId,
        valid_until: validUntil || null,
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

    navigate(`/quotes/${id}`, { state: { saved: true } })
  }

  if (loading) return <SkeletonPage />

  if (notFound) {
    return (
      <MissingDocument
        title="Redigera offert"
        message="Offerten hittades inte"
        backLabel="Tillbaka till offerter"
        onBack={() => navigate('/quotes')}
      />
    )
  }

  return (
    <Page className="min-h-screen bg-gray-50">
      <BuilderHeader title="Redigera offert" onBack={() => navigate(`/quotes/${id}`)} onSave={handleSave} saving={saving} />

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4 pb-28">
        <CustomerCard customers={customers} value={customerId} onChange={setCustomerId} />

        <Card title="Offertdetaljer">
          <Field label="Giltig till">
            <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className={inputClass} />
          </Field>
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
