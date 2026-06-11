import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Page, { Noise } from '../components/Premium'
import { ChevronLeft, X, Plus, Loader2, AlertTriangle } from 'lucide-react'
import { SkeletonPage } from '../components/Skeleton'

function formatSEK(n) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 2 }).format(n ?? 0) + ' kr'
}

function emptyRow() {
  return {
    id: crypto.randomUUID(),
    type: 'material',
    description: '',
    quantity: 1,
    unit: 'st',
    unit_price: '',
    vat_rate: 25,
  }
}

const UNITS = ['st', 'tim', 'm', 'm²', 'm³']
const VAT_RATES = [25, 12, 6]

function LineItem({ row, onChange, onRemove }) {
  const total = (Number(row.quantity) || 0) * (Number(row.unit_price) || 0)
  const set = (field, value) => onChange({ ...row, [field]: value })

  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50">
      <div className="flex gap-2">
        <input
          type="text" value={row.description} onChange={e => set('description', e.target.value)}
          placeholder="Beskrivning" className={inputClass + ' flex-1'}
        />
        <button type="button" onClick={onRemove}
          className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl text-gray-300 hover:text-danger hover:bg-red-50 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex gap-2">
        {['arbete', 'material'].map(t => (
          <button key={t} type="button" onClick={() => set('type', t)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors border ${
              row.type === t ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
            {t === 'arbete' ? 'Arbete' : 'Material'}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className={labelClass}>Antal</label>
          <input type="number" min="0" step="any" value={row.quantity} onChange={e => set('quantity', e.target.value)} className={inputClass} />
        </div>
        <div><label className={labelClass}>Enhet</label>
          <select value={row.unit} onChange={e => set('unit', e.target.value)} className={inputClass}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div><label className={labelClass}>À-pris (kr)</label>
          <input type="number" min="0" step="any" value={row.unit_price} onChange={e => set('unit_price', e.target.value)} placeholder="0" className={inputClass} />
        </div>
        <div><label className={labelClass}>Moms</label>
          <select value={row.vat_rate} onChange={e => set('vat_rate', Number(e.target.value))} className={inputClass}>
            {VAT_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end">
        <span className="text-sm font-semibold text-gray-700">{formatSEK(total)} ex. moms</span>
      </div>
    </div>
  )
}

export default function QuoteEdit() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [customers, setCustomers] = useState([])
  const [customerId, setCustomerId] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [rotRut, setRotRut] = useState(false)
  const [rotRutType, setRotRutType] = useState('rot')
  const [rows, setRows] = useState([emptyRow()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const [{ data: quote }, { data: custs }] = await Promise.all([
        supabase
          .from('quotes')
          .select('*, quote_items(*)')
          .eq('id', id)
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('customers')
          .select('id, name')
          .eq('user_id', user.id)
          .order('name'),
      ])

      setCustomers(custs ?? [])

      if (!quote) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setCustomerId(quote.customer_id ?? '')
      setValidUntil(quote.valid_until ?? '')
      setNotes(quote.notes ?? '')
      setRotRut(quote.rot_rut_enabled ?? false)
      setRotRutType(quote.rot_rut_type ?? 'rot')
      setRows(
        (quote.quote_items ?? []).length > 0
          ? quote.quote_items.map(item => ({
              id: crypto.randomUUID(),
              type: item.type ?? 'material',
              description: item.description ?? '',
              quantity: item.quantity ?? 1,
              unit: item.unit ?? 'st',
              unit_price: item.unit_price ?? '',
              vat_rate: item.vat_rate ?? 25,
            }))
          : [emptyRow()]
      )
      setLoading(false)
    }
    load()
  }, [id, user.id])

  const calc = useMemo(() => {
    const subtotal = rows.reduce((s, r) => s + (Number(r.quantity) || 0) * (Number(r.unit_price) || 0), 0)
    const labourSubtotal = rows.filter(r => r.type === 'arbete')
      .reduce((s, r) => s + (Number(r.quantity) || 0) * (Number(r.unit_price) || 0), 0)
    const rotRutDeduction = rotRut ? labourSubtotal * 0.3 : 0
    const vatByRate = {}
    for (const r of rows) {
      const net = (Number(r.quantity) || 0) * (Number(r.unit_price) || 0)
      vatByRate[r.vat_rate] = (vatByRate[r.vat_rate] ?? 0) + net * (r.vat_rate / 100)
    }
    const totalVat = Object.values(vatByRate).reduce((s, v) => s + v, 0)
    const totalInkMoms = subtotal + totalVat
    const toPay = totalInkMoms - rotRutDeduction
    return { subtotal, labourSubtotal, rotRutDeduction, vatByRate, totalVat, totalInkMoms, toPay }
  }, [rows, rotRut])

  function updateRow(rowId, updated) { setRows(prev => prev.map(r => r.id === rowId ? updated : r)) }
  function removeRow(rowId) { setRows(prev => prev.filter(r => r.id !== rowId)) }
  function addRow() { setRows(prev => [...prev, emptyRow()]) }

  async function handleSave() {
    setError('')
    if (!customerId) { setError('Välj en kund för att spara offerten.'); return }
    setSaving(true)

    const { error: qErr } = await supabase
      .from('quotes')
      .update({
        customer_id: customerId,
        valid_until: validUntil || null,
        notes: notes.trim() || null,
        rot_rut_enabled: rotRut,
        rot_rut_type: rotRut ? rotRutType : null,
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (qErr) {
      setError(`Kunde inte spara offerten: ${qErr.message}`)
      setSaving(false)
      return
    }

    // Replace all line items: delete existing, insert new
    await supabase.from('quote_items').delete().eq('quote_id', id)

    if (rows.length > 0) {
      const items = rows.map(r => ({
        quote_id: id,
        type: r.type,
        description: r.description.trim() || null,
        quantity: Number(r.quantity) || 0,
        unit: r.unit,
        unit_price: Number(r.unit_price) || 0,
        vat_rate: r.vat_rate,
      }))
      const { error: iErr } = await supabase.from('quote_items').insert(items)
      if (iErr) {
        setError(`Raderna misslyckades: ${iErr.message}`)
        setSaving(false)
        return
      }
    }

    navigate(`/quotes/${id}`, { state: { saved: true } })
  }

  if (loading) return <SkeletonPage />

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => navigate('/quotes')}
            className="text-gray-500 hover:text-gray-800 transition-colors p-1.5 -ml-1 rounded-xl hover:bg-gray-100">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-gray-900 text-lg">Redigera offert</h1>
        </header>
        <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center text-center">
          <AlertTriangle className="w-10 h-10 text-gray-300 mb-4" />
          <p className="text-gray-900 font-semibold text-sm">Offerten hittades inte</p>
          <p className="text-gray-500 text-sm mt-1">Den kan ha tagits bort eller så saknar du behörighet.</p>
          <button onClick={() => navigate('/quotes')}
            className="mt-6 inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold h-11 px-6 rounded-xl transition-all duration-200">
            Tillbaka till offerter
          </button>
        </div>
      </div>
    )
  }

  return (
    <Page className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(`/quotes/${id}`)}
          className="text-gray-500 hover:text-gray-800 transition-colors p-1 -ml-1 rounded-lg" aria-label="Tillbaka">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg flex-1 tracking-tight">Redigera offert</h1>
        <button type="button" onClick={handleSave} disabled={saving}
          className="text-sm font-semibold text-primary hover:text-primary-dark disabled:opacity-50 transition-colors px-1">
          {saving ? 'Sparar…' : 'Spara'}
        </button>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4 pb-28">

        <Card title="Kund">
          <div>
            <label className={labelClass}>Kund *</label>
            <select value={customerId} onChange={e => setCustomerId(e.target.value)} className={inputClass}>
              <option value="">Välj kund</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </Card>

        <Card title="Offertdetaljer">
          <div>
            <label className={labelClass}>Giltig till</label>
            <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Anteckningar</label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Ev. noteringar till kunden..." className={`${inputClass} resize-none`} />
          </div>
        </Card>

        <Card title="ROT/RUT-avdrag">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative">
              <input type="checkbox" checked={rotRut} onChange={e => setRotRut(e.target.checked)} className="sr-only peer" />
              <div className="w-10 h-6 bg-gray-200 peer-checked:bg-primary rounded-full transition-colors duration-150" />
              <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-150 peer-checked:translate-x-4" />
            </div>
            <span className="text-sm font-medium text-gray-700">ROT/RUT-avdrag</span>
          </label>
          {rotRut && (
            <div className="space-y-3">
              <div className="flex gap-3">
                {[
                  { value: 'rot', label: 'ROT', sub: 'Reparation, Ombyggnad, Tillbyggnad' },
                  { value: 'rut', label: 'RUT', sub: 'Rengöring, Underhåll, Tvätt' },
                ].map(opt => (
                  <label key={opt.value}
                    className={`flex-1 flex flex-col gap-0.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                      rotRutType === opt.value ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <div className="flex items-center gap-2">
                      <input type="radio" name="rotRutType" value={opt.value} checked={rotRutType === opt.value}
                        onChange={() => setRotRutType(opt.value)} className="accent-primary" />
                      <span className="text-sm font-semibold text-gray-800">{opt.label}</span>
                    </div>
                    <span className="text-xs text-gray-400 pl-5 leading-tight">{opt.sub}</span>
                  </label>
                ))}
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-xs text-blue-700 leading-relaxed">
                  Kunden får 30% skattereduktion på arbetskostnaden. ROT: max 50 000 kr/person/år.
                  RUT: max 75 000 kr/person/år. Hantverkaren fakturerar fullt pris och ansöker om
                  utbetalning från Skatteverket.
                </p>
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Rader</h2>
            <span className="text-xs text-gray-400">{rows.length} {rows.length === 1 ? 'rad' : 'rader'}</span>
          </div>
          {rows.map(row => (
            <LineItem key={row.id} row={row}
              onChange={updated => updateRow(row.id, updated)}
              onRemove={() => removeRow(row.id)} />
          ))}
          <button type="button" onClick={addRow}
            className="btn-lift w-full flex items-center justify-center gap-1.5 border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm font-medium text-gray-600 hover:border-primary hover:text-primary">
            <Plus className="w-4 h-4" />
            Lägg till rad
          </button>
        </div>

        <Card title="Sammanställning">
          <div className="space-y-2 text-sm">
            <SummaryRow label="Delsumma ex. moms" value={formatSEK(calc.subtotal)} />
            {rotRut && calc.rotRutDeduction > 0 && (
              <SummaryRow label={`${rotRutType.toUpperCase()}-avdrag (30% av arbete)`}
                value={`− ${formatSEK(calc.rotRutDeduction)}`} valueClass="text-success font-semibold" />
            )}
            <div className="border-t border-gray-200 pt-2 mt-2 space-y-2">
              {VAT_RATES.filter(r => (calc.vatByRate[r] ?? 0) > 0).map(r => (
                <SummaryRow key={r} label={`Moms ${r}%`} value={formatSEK(calc.vatByRate[r])} className="text-gray-500" />
              ))}
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2">
              <SummaryRow label="Totalt ink. moms" value={formatSEK(calc.totalInkMoms)} />
            </div>
            {/* Total — the hero of the quote, on a dark surface */}
            <div className="relative overflow-hidden rounded-xl mt-3 -mx-1" style={{ background: '#111111' }}>
              <Noise />
              <div className="relative px-4 py-4 flex justify-between items-center gap-3">
                <span className="font-semibold text-white text-sm">
                  {rotRut ? 'Att betala efter ROT/RUT' : 'Att betala'}
                </span>
                <span className="font-extrabold text-white text-2xl tabular-nums" style={{ letterSpacing: '-0.02em' }}>
                  {formatSEK(calc.toPay)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {error && <p className="text-sm text-danger px-1">{error}</p>}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 overflow-hidden" style={{ background: '#111111' }}>
        <Noise />
        <div className="relative max-w-lg mx-auto px-4 py-3.5 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-300 leading-tight">
              {rotRut ? 'Att betala efter ROT/RUT' : 'Att betala'}
            </p>
            <p className="text-[1.75rem] font-extrabold text-white tabular-nums leading-tight" style={{ letterSpacing: '-0.02em' }}>
              {formatSEK(calc.toPay)}
            </p>
          </div>
          <button type="button" onClick={handleSave} disabled={saving}
            className="btn-lift flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark active:bg-primary-darker disabled:opacity-60 text-white font-semibold h-11 px-6 rounded-xl">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Sparar…' : 'Spara ändringar'}
          </button>
        </div>
      </div>
    </Page>
  )
}

const inputClass = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  )
}

function SummaryRow({ label, value, valueClass = 'text-gray-700', className = '' }) {
  return (
    <div className={`flex justify-between items-baseline ${className}`}>
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium tabular-nums ${valueClass}`}>{value}</span>
    </div>
  )
}
