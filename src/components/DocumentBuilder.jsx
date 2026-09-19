import { ChevronLeft, X, Plus, Loader2, Info, AlertTriangle } from 'lucide-react'
import { Noise } from './Premium'
import { Card, Field, SummaryRow, Toggle, inputClass, labelClass } from './FormField'
import { cn } from '../lib/utils'
import { formatSEK } from '../lib/format'
import { emptyRow, UNITS } from '../lib/documents'
import { lineNet, rotRutLabel, VAT_RATES, LABOUR } from '../utils/calc'

// Building blocks shared by QuoteNew, QuoteEdit, InvoiceNew and InvoiceEdit.

// ── header ───────────────────────────────────────────────────────────────────

export function BuilderHeader({ title, onBack, onSave, saving }) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
      <button
        type="button"
        onClick={onBack}
        className="text-gray-500 hover:text-gray-800 transition-colors p-1 -ml-1 rounded-lg"
        aria-label="Tillbaka"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <h1 className="font-bold text-gray-900 text-lg flex-1 tracking-tight">{title}</h1>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="text-sm font-semibold text-primary hover:text-primary-dark disabled:opacity-50 transition-colors px-1"
      >
        {saving ? 'Sparar…' : 'Spara'}
      </button>
    </header>
  )
}

// ── customer picker ──────────────────────────────────────────────────────────

export function CustomerCard({ customers, value, onChange }) {
  return (
    <Card title="Kund">
      <Field label="Kund *">
        <select value={value} onChange={e => onChange(e.target.value)} className={inputClass}>
          <option value="">Välj kund</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
    </Card>
  )
}

// ── ROT / RUT ────────────────────────────────────────────────────────────────

const ROT_RUT_OPTIONS = [
  { value: 'rot', sub: 'Reparation, Ombyggnad, Tillbyggnad' },
  { value: 'rut', sub: 'Rengöring, Underhåll, Tvätt' },
]

export function RotRutSection({ enabled, onEnabledChange, type, onTypeChange, totals }) {
  return (
    <Card title="ROT/RUT-avdrag">
      <Toggle checked={enabled} onChange={e => onEnabledChange(e.target.checked)} label="ROT/RUT-avdrag" />

      {enabled && (
        <div className="space-y-3">
          <fieldset className="flex gap-3">
            <legend className="sr-only">Typ av avdrag</legend>
            {ROT_RUT_OPTIONS.map(opt => (
              <label
                key={opt.value}
                className={cn(
                  'flex-1 flex flex-col gap-0.5 p-3 rounded-xl border cursor-pointer transition-colors',
                  type === opt.value
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 bg-white hover:border-gray-300',
                )}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="rotRutType"
                    value={opt.value}
                    checked={type === opt.value}
                    onChange={() => onTypeChange(opt.value)}
                    className="accent-primary"
                  />
                  <span className="text-sm font-semibold text-gray-800">{rotRutLabel(opt.value)}</span>
                </div>
                <span className="text-xs text-gray-400 pl-5 leading-tight">{opt.sub}</span>
              </label>
            ))}
          </fieldset>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <p className="text-xs text-blue-700 leading-relaxed">
              Kunden får 30 % skattereduktion på arbetskostnaden inklusive moms. ROT: max 50 000 kr/person/år.
              RUT: max 75 000 kr/person/år. Hantverkaren fakturerar fullt pris och ansöker om
              utbetalning från Skatteverket.
            </p>
          </div>

          {totals.labourSubtotal > 0 ? (
            <div className="border border-gray-200 rounded-xl p-4 space-y-2 text-sm bg-gray-50/50">
              <SummaryRow label="Arbetskostnad inkl. moms" value={formatSEK(totals.labourInclVat)} />
              <SummaryRow
                label={`${rotRutLabel(type)}-avdrag (30 %)`}
                value={`− ${formatSEK(totals.rotRutDeduction)}`}
                valueClass="text-success font-semibold"
              />
              <div className="border-t border-gray-200 pt-2">
                <SummaryRow label="Kunden betalar" value={formatSEK(totals.toPay)} valueClass="text-gray-900 font-bold" />
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 px-1">
              Lägg till en rad av typen Arbete så räknas avdraget ut automatiskt.
            </p>
          )}
        </div>
      )}
    </Card>
  )
}

// ── line items ───────────────────────────────────────────────────────────────

function LineItem({ row, index, onChange, onRemove }) {
  const set = (field, value) => onChange({ ...row, [field]: value })
  const position = index + 1

  return (
    <div className="row-enter border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50">
      <div className="flex gap-2">
        <input
          type="text"
          value={row.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Beskrivning"
          aria-label={`Beskrivning, rad ${position}`}
          className={cn(inputClass, 'flex-1')}
        />
        <button
          type="button"
          onClick={onRemove}
          className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl text-gray-300 hover:text-danger hover:bg-red-50 transition-colors"
          aria-label={`Ta bort rad ${position}`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex gap-2" role="group" aria-label={`Typ, rad ${position}`}>
        {[LABOUR, 'material'].map(type => (
          <button
            key={type}
            type="button"
            onClick={() => set('type', type)}
            aria-pressed={row.type === type}
            className={cn(
              'flex-1 py-2 rounded-xl text-sm font-medium transition-colors border',
              row.type === type
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300',
            )}
          >
            {type === LABOUR ? 'Arbete' : 'Material'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label>
          <span className={labelClass}>Antal</span>
          <input
            type="number" min="0" step="any" inputMode="decimal"
            value={row.quantity}
            onChange={e => set('quantity', e.target.value)}
            className={inputClass}
          />
        </label>
        <label>
          <span className={labelClass}>Enhet</span>
          <select value={row.unit} onChange={e => set('unit', e.target.value)} className={inputClass}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>
        <label>
          <span className={labelClass}>À-pris (kr)</span>
          <input
            type="number" min="0" step="any" inputMode="decimal"
            value={row.unit_price}
            onChange={e => set('unit_price', e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </label>
        <label>
          <span className={labelClass}>Moms</span>
          <select value={row.vat_rate} onChange={e => set('vat_rate', Number(e.target.value))} className={inputClass}>
            {VAT_RATES.map(r => <option key={r} value={r}>{r} %</option>)}
          </select>
        </label>
      </div>

      <div className="flex justify-end">
        <span className="text-sm font-semibold text-gray-700 tabular-nums">{formatSEK(lineNet(row))} ex. moms</span>
      </div>
    </div>
  )
}

/** Renders the list of rows plus an add button. `rows` and `setRows` come from useState. */
export function LineItemsSection({ rows, setRows }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Rader</h2>
        <span className="text-xs text-gray-400">{rows.length} {rows.length === 1 ? 'rad' : 'rader'}</span>
      </div>

      {rows.map((row, index) => (
        <LineItem
          key={row.id}
          row={row}
          index={index}
          onChange={updated => setRows(prev => prev.map(r => (r.id === row.id ? updated : r)))}
          onRemove={() => setRows(prev => prev.filter(r => r.id !== row.id))}
        />
      ))}

      <button
        type="button"
        onClick={() => setRows(prev => [...prev, emptyRow()])}
        className="btn-lift w-full flex items-center justify-center gap-1.5 border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm font-medium text-gray-600 hover:border-primary hover:text-primary"
      >
        <Plus className="w-4 h-4" />
        Lägg till rad
      </button>
    </section>
  )
}

// ── totals ───────────────────────────────────────────────────────────────────

/** Dark hero bar showing the amount to pay. */
export function TotalHero({ label, amount, className, amountClass = 'text-white' }) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl', className)} style={{ background: '#111111' }}>
      <Noise />
      <div className="relative px-4 py-4 flex justify-between items-center gap-3">
        <span className="font-semibold text-white text-sm">{label}</span>
        <span className={cn('font-extrabold text-2xl tabular-nums', amountClass)} style={{ letterSpacing: '-0.02em' }}>
          {amount}
        </span>
      </div>
    </div>
  )
}

/** Subtotal, VAT per rate, total and the amount to pay. `totals` comes from calcTotals. */
export function TotalsBody({ totals, rotRutEnabled, rotRutType, amountClass }) {
  return (
    <div className="space-y-2 text-sm">
      <SummaryRow label="Delsumma ex. moms" value={formatSEK(totals.subtotal)} />

      <div className="border-t border-gray-200 pt-2 mt-2 space-y-2">
        {VAT_RATES.filter(r => (totals.vatByRate[r] ?? 0) > 0).map(r => (
          <SummaryRow key={r} label={`Moms ${r} %`} value={formatSEK(totals.vatByRate[r])} className="text-gray-500" />
        ))}
      </div>

      <div className="border-t border-gray-200 pt-2 mt-2 space-y-2">
        <SummaryRow label="Totalt ink. moms" value={formatSEK(totals.totalInkMoms)} />
        {rotRutEnabled && totals.rotRutDeduction > 0 && (
          <SummaryRow
            label={`${rotRutLabel(rotRutType)}-avdrag (30 % av arbete inkl. moms)`}
            value={`− ${formatSEK(totals.rotRutDeduction)}`}
            valueClass="text-success font-semibold"
          />
        )}
      </div>

      <TotalHero
        className="mt-3 -mx-1"
        label={rotRutEnabled ? 'Att betala efter ROT/RUT' : 'Att betala'}
        amount={formatSEK(totals.toPay)}
        amountClass={amountClass}
      />
    </div>
  )
}

export function TotalsSummary(props) {
  return (
    <Card title="Sammanställning">
      <TotalsBody {...props} />
    </Card>
  )
}

/** Fixed bottom bar: the amount is always visible while building a document. */
export function StickyTotalBar({ rotRutEnabled, toPay, saving, saveLabel, onSave }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 overflow-hidden" style={{ background: '#111111' }}>
      <Noise />
      <div className="relative max-w-lg mx-auto px-4 py-3.5 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-300 leading-tight">
            {rotRutEnabled ? 'Att betala efter ROT/RUT' : 'Att betala'}
          </p>
          <p className="text-[1.75rem] font-extrabold text-white tabular-nums leading-tight" style={{ letterSpacing: '-0.02em' }}>
            {formatSEK(toPay)}
          </p>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="btn-lift flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark active:bg-primary-darker disabled:opacity-60 text-white font-semibold h-11 px-6 rounded-xl"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Sparar…' : saveLabel}
        </button>
      </div>
    </div>
  )
}

export function InfoBanner({ children }) {
  return (
    <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
      <Info className="w-4 h-4 text-blue-500 flex-shrink-0" aria-hidden="true" />
      <p className="text-sm text-blue-700">{children}</p>
    </div>
  )
}

/** Shown by the edit pages when the document doesn't exist or isn't the user's. */
export function MissingDocument({ title, message, backLabel, onBack }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button
          type="button"
          onClick={onBack}
          className="text-gray-500 hover:text-gray-800 transition-colors p-1.5 -ml-1 rounded-xl hover:bg-gray-100"
          aria-label="Tillbaka"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg">{title}</h1>
      </header>
      <div className="max-w-lg mx-auto px-4 py-16 flex flex-col items-center text-center">
        <AlertTriangle className="w-10 h-10 text-gray-300 mb-4" aria-hidden="true" />
        <p className="text-gray-900 font-semibold text-sm">{message}</p>
        <p className="text-gray-500 text-sm mt-1">Den kan ha tagits bort eller så saknar du behörighet.</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-6 inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold h-11 px-6 rounded-xl transition-all duration-200"
        >
          {backLabel}
        </button>
      </div>
    </div>
  )
}
