import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { useCustomerOptions } from '../hooks/useCustomerOptions'
import Page from '../components/Premium'
import { Card, Field, FormError, inputClass } from '../components/FormField'
import {
  BuilderHeader, CustomerCard, RotRutSection, LineItemsSection, TotalsSummary, StickyTotalBar,
} from '../components/DocumentBuilder'
import { createDocument, emptyRow } from '../lib/documents'
import { addDaysISO } from '../lib/date'
import { calcTotals } from '../utils/calc'

const VALIDITY_DAYS = 30

export default function QuoteNew() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const showToast = useToast()
  const { customers, error: customersError } = useCustomerOptions(user.id)

  const [customerId, setCustomerId] = useState('')
  const [validUntil, setValidUntil] = useState(() => addDaysISO(VALIDITY_DAYS))
  const [notes, setNotes] = useState('')
  const [rotRut, setRotRut] = useState(false)
  const [rotRutType, setRotRutType] = useState('rot')
  const [rows, setRows] = useState(() => [emptyRow()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const totals = useMemo(() => calcTotals(rows, rotRut), [rows, rotRut])

  async function handleSave() {
    setError('')
    if (!customerId) {
      setError('Välj en kund för att spara offerten.')
      return
    }

    setSaving(true)
    const { data: quote, error: saveError } = await createDocument(
      'quote',
      user.id,
      {
        customer_id: customerId,
        status: 'utkast',
        valid_until: validUntil || null,
        notes: notes.trim() || null,
        rot_rut_enabled: rotRut,
        rot_rut_type: rotRut ? rotRutType : null,
      },
      rows,
    )

    if (saveError) {
      setError('Kunde inte spara offerten. Försök igen.')
      setSaving(false)
      return
    }

    showToast('Offerten sparades', 'success')
    navigate(`/quotes/${quote.id}`)
  }

  return (
    <Page className="min-h-screen bg-gray-50">
      <BuilderHeader title="Ny offert" onBack={() => navigate('/quotes')} onSave={handleSave} saving={saving} />

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4 pb-28">
        <CustomerCard customers={customers} value={customerId} onChange={setCustomerId} />
        {customersError && <FormError>Kunde inte hämta kunder. Ladda om sidan.</FormError>}

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

      <StickyTotalBar rotRutEnabled={rotRut} toPay={totals.toPay} saving={saving} saveLabel="Spara offert" onSave={handleSave} />
    </Page>
  )
}
