import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { generateInvoicePDF } from '../utils/generateInvoicePDF'

// ── helpers ────────────────────────────────────────────────────────────────

function todayISO() { return new Date().toISOString().slice(0, 10) }

function formatDate(iso) {
  if (!iso) return '–'
  return new Intl.DateTimeFormat('sv-SE', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(iso))
}

function formatSEK(n) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 2 }).format(n ?? 0) + ' kr'
}

function daysOverdue(dueDateISO) {
  const due = new Date(dueDateISO)
  const today = new Date(todayISO())
  return Math.floor((today - due) / (1000 * 60 * 60 * 24))
}

function effectiveStatus(invoice) {
  if (invoice.status === 'obetald' && invoice.due_date && invoice.due_date < todayISO()) {
    return 'försenad'
  }
  return invoice.status ?? 'obetald'
}

function calcTotals(items, rotRutEnabled) {
  const list = items ?? []
  const subtotal = list.reduce((s, r) => s + (r.quantity ?? 0) * (r.unit_price ?? 0), 0)
  const labourSubtotal = list
    .filter(r => r.type === 'arbete')
    .reduce((s, r) => s + (r.quantity ?? 0) * (r.unit_price ?? 0), 0)
  const rotRutDeduction = rotRutEnabled ? labourSubtotal * 0.3 : 0
  const vatByRate = {}
  for (const r of list) {
    const net = (r.quantity ?? 0) * (r.unit_price ?? 0)
    vatByRate[r.vat_rate] = (vatByRate[r.vat_rate] ?? 0) + net * ((r.vat_rate ?? 25) / 100)
  }
  const totalVat = Object.values(vatByRate).reduce((s, v) => s + v, 0)
  const totalInkMoms = subtotal + totalVat
  const toPay = totalInkMoms - rotRutDeduction
  return { subtotal, labourSubtotal, rotRutDeduction, vatByRate, totalVat, totalInkMoms, toPay }
}

// ── status config ──────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  obetald:  { label: 'Obetald',  bg: 'bg-amber-50',  text: 'text-warning',  border: 'border-amber-100',  dot: 'bg-warning' },
  betald:   { label: 'Betald',   bg: 'bg-green-50',  text: 'text-success',  border: 'border-green-100',  dot: 'bg-success' },
  försenad: { label: 'Försenad', bg: 'bg-red-50',    text: 'text-danger',   border: 'border-red-100',    dot: 'bg-danger' },
}

const VAT_RATES = [25, 12, 6]

// ── component ──────────────────────────────────────────────────────────────

export default function InvoiceDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [invoice, setInvoice] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data, error: err } = await supabase
        .from('invoices')
        .select('*, customers(*), jobs(id, title)')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (err || !data) { navigate('/invoices'); return }

      const { data: itemData } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id)
        .order('created_at', { ascending: true })

      setInvoice(data)
      setItems(itemData ?? [])
      setLoading(false)
    }
    load()
  }, [id, user.id, navigate])

  async function handleMarkPaid() {
    setPaying(true)
    setError('')
    const today = todayISO()
    const patch = {
      status: 'betald',
      paid_date: today,
      updated_at: new Date().toISOString(),
    }
    const { error: err } = await supabase
      .from('invoices')
      .update(patch)
      .eq('id', id)
      .eq('user_id', user.id)

    if (err) {
      setError('Kunde inte uppdatera fakturan. Försök igen.')
    } else {
      setInvoice(prev => ({ ...prev, ...patch }))
    }
    setPaying(false)
  }

  async function handleDownloadPDF() {
    setPdfLoading(true)
    try {
      const { data: profile } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      await generateInvoicePDF(invoice, items, invoice.customers, profile)
    } catch (e) {
      console.error('PDF error:', e)
      setError('Kunde inte generera PDF. Försök igen.')
    }
    setPdfLoading(false)
  }

  // ── loading ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <svg className="animate-spin w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    )
  }

  const status = effectiveStatus(invoice)
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.obetald
  const totals = calcTotals(items, invoice.rot_rut_enabled)
  const isPaid = invoice.status === 'betald'
  const isOverdue = status === 'försenad'
  const overdueDays = isOverdue ? daysOverdue(invoice.due_date) : 0

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate('/invoices')}
          className="text-gray-500 hover:text-gray-800 transition-colors p-1 -ml-1 rounded-lg" aria-label="Tillbaka">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-bold text-gray-800 text-lg flex-1 truncate">
          Faktura {invoice.invoice_number ?? '–'}
        </h1>
        <button onClick={() => navigate(`/invoices/${id}/edit`)}
          className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-lg" aria-label="Redigera">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
          </svg>
        </button>
      </header>

      {/* ── Overdue banner (above status bar when overdue) ── */}
      {isOverdue && (
        <div className="bg-red-600 px-5 py-2.5 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <span className="text-white font-bold text-sm">FÖRSENAD</span>
            <span className="text-red-200 text-sm ml-2">
              Försenad med {overdueDays} {overdueDays === 1 ? 'dag' : 'dagar'}
            </span>
          </div>
        </div>
      )}

      {/* ── Status banner ── */}
      <div className={`${cfg.bg} ${cfg.text} border-b ${cfg.border} px-5 py-3 flex items-center gap-2`}>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
        <span className="font-semibold text-sm">{cfg.label}</span>
        {isPaid && invoice.paid_date && (
          <span className="ml-auto text-xs font-medium opacity-75">
            {formatDate(invoice.paid_date)}
          </span>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* ── Outstanding / Paid amount hero ── */}
        {!isPaid ? (
          <div className={`rounded-2xl px-5 py-4 border ${isOverdue ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${isOverdue ? 'text-danger' : 'text-warning'}`}>
              Att betala
            </p>
            <p className={`text-3xl font-bold tabular-nums ${isOverdue ? 'text-danger' : 'text-warning'}`}>
              {formatSEK(totals.toPay)}
            </p>
            {invoice.due_date && !isOverdue && (
              <p className="text-xs text-gray-500 mt-1">Förfaller {formatDate(invoice.due_date)}</p>
            )}
            {isOverdue && (
              <p className="text-xs text-danger mt-1 font-medium">
                Förföll {formatDate(invoice.due_date)}
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-2xl px-5 py-4 bg-green-50 border border-green-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-success uppercase tracking-wide">Betald</p>
              <p className="text-sm font-bold text-gray-800 tabular-nums">{formatSEK(totals.toPay)}</p>
              {invoice.paid_date && (
                <p className="text-xs text-gray-500 mt-0.5">{formatDate(invoice.paid_date)}</p>
              )}
            </div>
          </div>
        )}

        {/* ── Markera som betald — only when unpaid ── */}
        {!isPaid && (
          <button onClick={handleMarkPaid} disabled={paying}
            className="w-full flex items-center justify-center gap-2 bg-success hover:bg-green-700 active:bg-green-800 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-colors shadow-sm text-base">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {paying ? 'Uppdaterar...' : 'Markera som betald'}
          </button>
        )}

        {/* ── Kundinformation ── */}
        {invoice.customers && (
          <Card title="Kundinformation">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold text-sm">
                  {invoice.customers.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/customers/${invoice.customers.id}`}
                  className="font-semibold text-gray-800 hover:text-primary transition-colors text-sm">
                  {invoice.customers.name}
                </Link>
                {invoice.customers.city && (
                  <p className="text-xs text-gray-400 mt-0.5">{invoice.customers.city}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              {invoice.customers.phone && (
                <a href={`tel:${invoice.customers.phone}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm text-gray-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Ring
                </a>
              )}
              {invoice.customers.email && (
                <a href={`mailto:${invoice.customers.email}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm text-gray-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  E-post
                </a>
              )}
            </div>
          </Card>
        )}

        {/* ── Fakturadetaljer ── */}
        <Card title="Fakturadetaljer">
          <DetailRow label="Fakturanummer">
            <span className="text-sm font-semibold text-gray-800">{invoice.invoice_number ?? '–'}</span>
          </DetailRow>
          <DetailRow label="Fakturadatum">
            <span className="text-sm text-gray-800">{formatDate(invoice.invoice_date)}</span>
          </DetailRow>
          <DetailRow label="Förfallodatum">
            <span className={`text-sm font-medium ${isOverdue ? 'text-danger' : 'text-gray-800'}`}>
              {formatDate(invoice.due_date)}
              {isOverdue && (
                <span className="ml-2 text-xs font-semibold bg-red-100 text-danger px-1.5 py-0.5 rounded-full">
                  {overdueDays} {overdueDays === 1 ? 'dag' : 'dagar'} sen
                </span>
              )}
            </span>
          </DetailRow>
          {invoice.jobs && (
            <DetailRow label="Kopplat jobb">
              <Link to={`/jobs/${invoice.job_id}`} className="text-sm text-primary font-medium hover:underline">
                {invoice.jobs.title}
              </Link>
            </DetailRow>
          )}
          {invoice.rot_rut_enabled && (
            <DetailRow label="ROT/RUT">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-success">
                {(invoice.rot_rut_type ?? 'rot').toUpperCase()}-avdrag
              </span>
            </DetailRow>
          )}
          {invoice.notes && (
            <DetailRow label="Anteckningar">
              <span className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{invoice.notes}</span>
            </DetailRow>
          )}
        </Card>

        {/* ── Rader ── */}
        {items.length > 0 && (
          <Card title={`Rader (${items.length})`}>
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-sm min-w-[420px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2">Beskrivning</th>
                    <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2 px-2">Typ</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2 px-2">Antal</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2 px-2">À-pris</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2">Summa</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const rowTotal = (item.quantity ?? 0) * (item.unit_price ?? 0)
                    const isArbete = item.type === 'arbete'
                    return (
                      <tr key={item.id}
                        className={`border-b border-gray-50 last:border-0 ${invoice.rot_rut_enabled && isArbete ? 'bg-amber-50/40' : ''}`}>
                        <td className="py-2.5 pr-2">
                          <span className="text-gray-800 font-medium">{item.description || '–'}</span>
                          <span className="block text-xs text-gray-400">Moms {item.vat_rate ?? 25}%</span>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                            isArbete ? 'bg-blue-100 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                            {isArbete ? 'Arbete' : 'Material'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right text-gray-600 text-xs">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-2.5 px-2 text-right text-gray-600 text-xs tabular-nums">
                          {formatSEK(item.unit_price)}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-gray-800 text-xs tabular-nums">
                          {formatSEK(rowTotal)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ── Sammanställning ── */}
        <Card title="Sammanställning">
          <div className="space-y-2 text-sm">
            <SummaryRow label="Delsumma ex. moms" value={formatSEK(totals.subtotal)} />

            {invoice.rot_rut_enabled && totals.rotRutDeduction > 0 && (
              <SummaryRow
                label={`${(invoice.rot_rut_type ?? 'rot').toUpperCase()}-avdrag (30% av arbete)`}
                value={`- ${formatSEK(totals.rotRutDeduction)}`}
                valueClass="text-success font-semibold"
              />
            )}

            <div className="border-t border-gray-100 pt-2 space-y-2">
              {VAT_RATES.filter(r => (totals.vatByRate[r] ?? 0) > 0).map(r => (
                <SummaryRow key={r} label={`Moms ${r}%`} value={formatSEK(totals.vatByRate[r])} />
              ))}
            </div>

            <div className="border-t border-gray-100 pt-2">
              <SummaryRow label="Totalt ink. moms" value={formatSEK(totals.totalInkMoms)} />
            </div>

            <div className="border-t-2 border-gray-200 pt-3">
              <div className="flex justify-between items-baseline">
                <span className="font-bold text-gray-800 text-base">
                  {invoice.rot_rut_enabled ? 'Att betala efter ROT/RUT' : 'Att betala'}
                </span>
                <span className={`font-bold text-xl tabular-nums ${isPaid ? 'text-success' : isOverdue ? 'text-danger' : 'text-primary'}`}>
                  {formatSEK(totals.toPay)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {error && <p className="text-sm text-danger px-1">{error}</p>}

        {/* ── Ladda ner PDF ── */}
        <button onClick={handleDownloadPDF} disabled={pdfLoading}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-60 text-gray-700 font-semibold py-3 rounded-xl transition-colors">
          {pdfLoading ? (
            <>
              <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Genererar PDF...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Ladda ner PDF
            </>
          )}
        </button>

        {/* ── Skicka påminnelse — only when unpaid ── */}
        {!isPaid && (
          <button
            onClick={() => alert('Påminnelsefunktionen är inte tillgänglig ännu.')}
            className="w-full flex items-center justify-center gap-2 bg-white border border-amber-300 hover:bg-amber-50 active:bg-amber-100 text-warning font-semibold py-3 rounded-xl transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Skicka påminnelse
          </button>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  )
}

function DetailRow({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
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
