import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Page, { Noise } from '../components/Premium'
import { useToast } from '../components/Toast'
import { ChevronLeft, X, Plus, Info, Loader2 } from 'lucide-react'

const ROW_CSS = `
@keyframes row-enter {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.row-enter { animation: row-enter 200ms ease both; }
`

// ── helpers ────────────────────────────────────────────────────────────────

function todayISO() { return new Date().toISOString().slice(0, 10) }
function plusDays(n) {
  const d = new Date(); d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
function formatSEK(n) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 2 }).format(n ?? 0) + ' kr'
}
function emptyRow() {
  return { id: crypto.randomUUID(), type: 'material', description: '', quantity: 1, unit: 'st', unit_price: '', vat_rate: 25 }
}

const UNITS = ['st', 'tim', 'm', 'm²', 'm³']
const VAT_RATES = [25, 12, 6]

// ── LineItem component ─────────────────────────────────────────────────────

function LineItem({ row, onChange, onRemove }) {
  const total = (Number(row.quantity) || 0) * (Number(row.unit_price) || 0)
  const set = (field, value) => onChange({ ...row, [field]: value })

  return (
    <div className="row-enter border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50">
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

// ── main page ──────────────────────────────────────────────────────────────

export default function InvoiceNew() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const showToast = useToast()
  const [searchParams] = useSearchParams()
  const jobIdParam = searchParams.get('job_id')

  const [customers, setCustomers] = useState([])
  const [linkedJob, setLinkedJob] = useState(null)
  const [customerId, setCustomerId] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(todayISO())
  const [dueDate, setDueDate] = useState(plusDays(30))
  const [notes, setNotes] = useState('')
  const [rotRut, setRotRut] = useState(false)
  const [rotRutType, setRotRutType] = useState('rot')
  const [rows, setRows] = useState([emptyRow()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Load customers
  useEffect(() => {
    supabase.from('customers').select('id, name').eq('user_id', user.id).order('name')
      .then(({ data }) => setCustomers(data ?? []))
  }, [user.id])

  // Pre-fill from job
  useEffect(() => {
    if (!jobIdParam) return
    async function fetchJob() {
      const { data: job } = await supabase
        .from('jobs')
        .select('*, customers(id, name), quotes(id, rot_rut_enabled, rot_rut_type, quote_items(*))')
        .eq('id', jobIdParam)
        .eq('user_id', user.id)
        .single()
      if (!job) return
      setLinkedJob(job)
      setCustomerId(job.customer_id ?? '')

      // Import quote items if linked quote exists
      const qItems = job.quotes?.quote_items
      if (qItems?.length > 0) {
        setRows(qItems.map(item => ({
          id: crypto.randomUUID(),
          type: item.type ?? 'material',
          description: item.description ?? '',
          quantity: item.quantity ?? 1,
          unit: item.unit ?? 'st',
          unit_price: item.unit_price ?? '',
          vat_rate: item.vat_rate ?? 25,
        })))
        if (job.quotes.rot_rut_enabled) {
          setRotRut(true)
          setRotRutType(job.quotes.rot_rut_type ?? 'rot')
        }
      }
    }
    fetchJob()
  }, [jobIdParam, user.id])

  // ── Calculations ────────────────────────────────────────────────────────

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
    return { subtotal, rotRutDeduction, vatByRate, totalInkMoms, toPay }
  }, [rows, rotRut])

  // ── Row handlers ────────────────────────────────────────────────────────

  function updateRow(id, updated) { setRows(prev => prev.map(r => r.id === id ? updated : r)) }
  function removeRow(id) { setRows(prev => prev.filter(r => r.id !== id)) }
  function addRow() { setRows(prev => [...prev, emptyRow()]) }

  // ── Save ────────────────────────────────────────────────────────────────

  async function handleSave() {
    setError('')
    if (!customerId) { setError('Välj en kund för att spara fakturan.'); return }
    setSaving(true)

    const year = new Date().getFullYear()
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', `${year}-01-01`)

    const seq = String((count ?? 0) + 1).padStart(3, '0')
    const invoiceNumber = `${year}-${seq}`

    const { data: invoice, error: iErr } = await supabase
      .from('invoices')
      .insert({
        user_id: user.id,
        customer_id: customerId,
        job_id: jobIdParam || null,
        invoice_number: invoiceNumber,
        status: 'obetald',
        invoice_date: invoiceDate || null,
        due_date: dueDate || null,
        notes: notes.trim() || null,
        rot_rut_enabled: rotRut,
        rot_rut_type: rotRut ? rotRutType : null,
      })
      .select()
      .single()

    if (iErr) {
      console.error('Invoice insert error:', iErr)
      setError(`Kunde inte spara fakturan: ${iErr.message}`)
      setSaving(false)
      return
    }

    if (rows.length > 0) {
      const items = rows.map(r => ({
        invoice_id: invoice.id,
        type: r.type,
        description: r.description.trim() || null,
        quantity: Number(r.quantity) || 0,
        unit: r.unit,
        unit_price: Number(r.unit_price) || 0,
        vat_rate: r.vat_rate,
      }))
      const { error: liErr } = await supabase.from('invoice_items').insert(items)
      if (liErr) {
        console.error('Invoice items error:', liErr)
        setError(`Raderna misslyckades: ${liErr.message}`)
        setSaving(false)
        return
      }
    }

    showToast('Fakturan skapades', 'success')
    navigate(`/invoices/${invoice.id}`)
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <Page className="min-h-screen bg-gray-50">
      <style>{ROW_CSS}</style>
      <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate('/invoices')}
          className="text-gray-500 hover:text-gray-800 transition-colors p-1 -ml-1 rounded-lg" aria-label="Tillbaka">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg flex-1 tracking-tight">Ny faktura</h1>
        <button type="button" onClick={handleSave} disabled={saving}
          className="text-sm font-semibold text-primary hover:text-primary-dark disabled:opacity-50 transition-colors px-1">
          {saving ? 'Sparar…' : 'Spara'}
        </button>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4 pb-28">

        {/* Job banner */}
        {linkedJob && (
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Skapad från jobb: <span className="font-semibold">{linkedJob.title}</span>
            </p>
          </div>
        )}

        {/* Kund */}
        <Card title="Kund">
          <div>
            <label className={labelClass}>Kund *</label>
            <select value={customerId} onChange={e => setCustomerId(e.target.value)} className={inputClass}>
              <option value="">Välj kund</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </Card>

        {/* Fakturadetaljer */}
        <Card title="Fakturadetaljer">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Fakturadatum</label>
              <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Förfallodatum</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Anteckningar</label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Ev. noteringar till kunden..." className={`${inputClass} resize-none`} />
          </div>
        </Card>

        {/* ROT/RUT */}
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
                      <input type="radio" name="rrType" value={opt.value} checked={rotRutType === opt.value}
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

        {/* Rader */}
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

        {/* Sammanställning */}
        <Card title="Sammanställning">
          <div className="space-y-2 text-sm">
            <SummaryRow label="Delsumma ex. moms" value={formatSEK(calc.subtotal)} />
            {rotRut && calc.rotRutDeduction > 0 && (
              <SummaryRow label={`${rotRutType.toUpperCase()}-avdrag (30% av arbete)`}
                value={`- ${formatSEK(calc.rotRutDeduction)}`} valueClass="text-success font-semibold" />
            )}
            <div className="border-t border-gray-200 pt-2 space-y-2">
              {VAT_RATES.filter(r => (calc.vatByRate[r] ?? 0) > 0).map(r => (
                <SummaryRow key={r} label={`Moms ${r}%`} value={formatSEK(calc.vatByRate[r])} />
              ))}
            </div>
            <div className="border-t border-gray-200 pt-2">
              <SummaryRow label="Totalt ink. moms" value={formatSEK(calc.totalInkMoms)} />
            </div>
            {/* Total — the hero of the invoice, on a dark surface */}
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

      {/* Sticky total + save — the sum is the hero, always visible while building */}
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
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-lift flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark active:bg-primary-darker disabled:opacity-60 text-white font-semibold h-11 px-6 rounded-xl"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Sparar…' : 'Spara faktura'}
          </button>
        </div>
      </div>
    </Page>
  )
}

// ── Shared helpers ─────────────────────────────────────────────────────────

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

function SummaryRow({ label, value, valueClass = 'text-gray-700' }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium tabular-nums ${valueClass}`}>{value}</span>
    </div>
  )
}
