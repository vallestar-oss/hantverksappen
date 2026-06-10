import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { generateQuotePDF } from '../utils/generateQuotePDF'

// ── helpers ────────────────────────────────────────────────────────────────

function formatSEK(n) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 2 }).format(n ?? 0) + ' kr'
}

function formatDate(iso) {
  if (!iso) return '–'
  return new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
}

const STATUS_CONFIG = {
  utkast:  { label: 'Utkast',   bg: 'bg-gray-100',   text: 'text-gray-600',  border: 'border-gray-200', icon: DraftIcon },
  skickad: { label: 'Skickad',  bg: 'bg-blue-50',    text: 'text-blue-600',  border: 'border-blue-100', icon: SentIcon },
  godkänd: { label: 'Godkänd', bg: 'bg-green-50',   text: 'text-success',   border: 'border-green-100', icon: ApprovedIcon },
  avvisad: { label: 'Avvisad', bg: 'bg-red-50',     text: 'text-danger',    border: 'border-red-100',  icon: RejectedIcon },
}

const VAT_RATES = [25, 12, 6]

// ── icons ──────────────────────────────────────────────────────────────────

function DraftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}
function SentIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  )
}
function ApprovedIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
function RejectedIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

// ── sub-components ─────────────────────────────────────────────────────────

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {title && (
        <div className="px-5 pt-4 pb-3 border-b border-gray-50">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</h2>
        </div>
      )}
      <div className="p-5 space-y-3">{children}</div>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-gray-400 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-800 text-right font-medium">{value ?? '–'}</span>
    </div>
  )
}

function SummaryRow({ label, value, valueClass = 'text-gray-700', bold = false }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className={`text-sm ${bold ? 'font-bold text-gray-800' : 'text-gray-500'}`}>{label}</span>
      <span className={`text-sm font-medium tabular-nums ${valueClass} ${bold ? 'font-bold' : ''}`}>{value}</span>
    </div>
  )
}

// ── main page ──────────────────────────────────────────────────────────────

export default function QuoteDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('quotes')
        .select('*, customers(*), quote_items(*)')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        navigate('/quotes')
        return
      }
      setQuote(data)
      setLoading(false)
    }
    load()
  }, [id, user.id, navigate])

  const calc = useMemo(() => {
    if (!quote) return {}
    const items = quote.quote_items ?? []

    const subtotal = items.reduce((s, r) => s + (r.quantity ?? 0) * (r.unit_price ?? 0), 0)
    const labourSubtotal = items
      .filter(r => r.type === 'arbete')
      .reduce((s, r) => s + (r.quantity ?? 0) * (r.unit_price ?? 0), 0)

    const rotRutDeduction = quote.rot_rut_enabled ? labourSubtotal * 0.3 : 0

    const vatByRate = {}
    for (const r of items) {
      const net = (r.quantity ?? 0) * (r.unit_price ?? 0)
      vatByRate[r.vat_rate] = (vatByRate[r.vat_rate] ?? 0) + net * ((r.vat_rate ?? 25) / 100)
    }

    const totalVat = Object.values(vatByRate).reduce((s, v) => s + v, 0)
    const totalInkMoms = subtotal + totalVat
    const toPay = totalInkMoms - rotRutDeduction

    return { subtotal, labourSubtotal, rotRutDeduction, vatByRate, totalVat, totalInkMoms, toPay }
  }, [quote])

  async function updateStatus(status) {
    setUpdating(true)
    setError('')
    const { error } = await supabase
      .from('quotes')
      .update({ status })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      setError('Kunde inte uppdatera status. Försök igen.')
      setUpdating(false)
    } else {
      setQuote(prev => ({ ...prev, status }))
      setUpdating(false)
    }
  }

  async function handleDownloadPDF() {
    setPdfLoading(true)
    setError('')
    try {
      const { data: profile } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      await generateQuotePDF(
        quote,
        quote.quote_items ?? [],
        quote.customers ?? {},
        profile ?? {}
      )
    } catch (e) {
      console.error('PDF error:', e)
      setError('Kunde inte generera PDF. Försök igen.')
    } finally {
      setPdfLoading(false)
    }
  }

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

  const status = quote.status ?? 'utkast'
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.utkast
  const StatusIcon = cfg.icon
  const items = quote.quote_items ?? []
  const customer = quote.customers

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate('/quotes')}
          className="text-gray-500 hover:text-gray-800 transition-colors p-1 -ml-1 rounded-lg"
          aria-label="Tillbaka"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-bold text-gray-800 text-lg flex-1 truncate">
          Offert {quote.quote_number}
        </h1>
        <button
          onClick={() => navigate(`/quotes/${id}/edit`)}
          className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-lg"
          aria-label="Redigera offert"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
          </svg>
        </button>
      </header>

      {/* Status banner */}
      <div className={`${cfg.bg} ${cfg.text} border-b ${cfg.border} px-5 py-3 flex items-center gap-2`}>
        <StatusIcon />
        <span className="font-semibold text-sm">{cfg.label}</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Customer card */}
        {customer && (
          <Card title="Kundinformation">
            <p className="font-bold text-gray-800 text-base">{customer.name}</p>

            {customer.phone && (
              <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {customer.phone}
              </a>
            )}

            {customer.email && (
              <a href={`mailto:${customer.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {customer.email}
              </a>
            )}

            {(customer.address || customer.city) && (
              <p className="flex items-start gap-2 text-sm text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {[customer.address, [customer.postal_code, customer.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
              </p>
            )}
          </Card>
        )}

        {/* Quote details card */}
        <Card title="Offertdetaljer">
          <DetailRow label="Offertnummer" value={quote.quote_number} />
          <DetailRow label="Skapad" value={formatDate(quote.created_at)} />
          <DetailRow label="Giltig till" value={formatDate(quote.valid_until)} />
          {quote.rot_rut_enabled && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Avdrag</span>
              <span className="text-xs font-semibold px-2.5 py-1 bg-green-100 text-success rounded-full uppercase">
                {quote.rot_rut_type ?? 'ROT/RUT'}
              </span>
            </div>
          )}
          {quote.notes && (
            <div className="pt-1 border-t border-gray-50">
              <p className="text-xs text-gray-400 mb-1">Anteckningar</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{quote.notes}</p>
            </div>
          )}
        </Card>

        {/* Line items card */}
        {items.length > 0 && (
          <Card title="Rader">
            <div className="space-y-0 -mx-5 -mt-3 -mb-5">
              {items.map((item, i) => {
                const rowTotal = (item.quantity ?? 0) * (item.unit_price ?? 0)
                return (
                  <div
                    key={item.id}
                    className={`px-5 py-4 ${i < items.length - 1 ? 'border-b border-gray-50' : ''}`}
                  >
                    {/* Description + badges */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-sm font-medium text-gray-800 leading-snug flex-1">
                        {item.description || <span className="text-gray-300 italic">Ingen beskrivning</span>}
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          item.type === 'arbete'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {item.type === 'arbete' ? 'Arbete' : 'Material'}
                        </span>
                      </div>
                    </div>

                    {/* Quantity × price = total */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">
                        {item.quantity} {item.unit} × {formatSEK(item.unit_price)}
                        <span className="ml-2 text-xs text-gray-300">moms {item.vat_rate}%</span>
                      </span>
                      <span className="font-semibold text-gray-700 tabular-nums">{formatSEK(rowTotal)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Summary card */}
        <Card title="Sammanställning">
          <SummaryRow label="Delsumma ex. moms" value={formatSEK(calc.subtotal)} />

          {quote.rot_rut_enabled && calc.rotRutDeduction > 0 && (
            <SummaryRow
              label={`${(quote.rot_rut_type ?? 'rot').toUpperCase()}-avdrag (30% av arbete)`}
              value={`− ${formatSEK(calc.rotRutDeduction)}`}
              valueClass="text-success font-semibold"
            />
          )}

          <div className="border-t border-gray-100 pt-3 mt-1 space-y-2">
            {VAT_RATES.filter(r => (calc.vatByRate?.[r] ?? 0) > 0).map(r => (
              <SummaryRow key={r} label={`Moms ${r}%`} value={formatSEK(calc.vatByRate[r])} />
            ))}
          </div>

          <div className="border-t border-gray-100 pt-3 mt-1">
            <SummaryRow label="Totalt ink. moms" value={formatSEK(calc.totalInkMoms)} />
          </div>

          <div className="border-t-2 border-gray-200 pt-3 mt-1">
            <div className="flex justify-between items-baseline">
              <span className="font-bold text-gray-800">
                {quote.rot_rut_enabled ? 'Att betala efter ROT/RUT' : 'Att betala'}
              </span>
              <span className="font-bold text-primary text-xl tabular-nums">{formatSEK(calc.toPay)}</span>
            </div>
          </div>
        </Card>

        {/* PDF download */}
        <button
          onClick={handleDownloadPDF}
          disabled={pdfLoading}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold py-3 rounded-xl transition-colors duration-150 disabled:opacity-60"
        >
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Ladda ner PDF
            </>
          )}
        </button>

        {/* Action buttons */}
        {error && <p className="text-sm text-danger px-1">{error}</p>}

        <ActionButtons status={status} updating={updating} onUpdate={updateStatus} quoteId={id} />
      </div>
    </div>
  )
}

// ── action buttons per status ──────────────────────────────────────────────

function ActionButtons({ status, updating, onUpdate, quoteId }) {
  const navigate = useNavigate()
  if (status === 'utkast') {
    return (
      <div className="space-y-3">
        <ActionBtn
          label="Skicka offert"
          icon={<SentIcon />}
          className="bg-primary hover:bg-blue-700 text-white"
          onClick={() => onUpdate('skickad')}
          disabled={updating}
        />
        <ActionBtn
          label="Markera som godkänd"
          icon={<ApprovedIcon />}
          className="bg-success hover:bg-green-700 text-white"
          onClick={() => onUpdate('godkänd')}
          disabled={updating}
        />
      </div>
    )
  }

  if (status === 'skickad') {
    return (
      <div className="space-y-3">
        <ActionBtn
          label="Markera som godkänd"
          icon={<ApprovedIcon />}
          className="bg-success hover:bg-green-700 text-white"
          onClick={() => onUpdate('godkänd')}
          disabled={updating}
        />
        <ActionBtn
          label="Markera som avvisad"
          icon={<RejectedIcon />}
          className="bg-white border border-danger/40 text-danger hover:bg-red-50"
          onClick={() => onUpdate('avvisad')}
          disabled={updating}
        />
      </div>
    )
  }

  if (status === 'godkänd') {
    return (
      <ActionBtn
        label="Skapa jobb"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        }
        className="bg-primary hover:bg-blue-700 text-white"
        onClick={() => navigate(`/jobs/new?quote_id=${quoteId}`)}
        disabled={updating}
      />
    )
  }

  if (status === 'avvisad') {
    return (
      <ActionBtn
        label="Återöppna som utkast"
        icon={<DraftIcon />}
        className="bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
        onClick={() => onUpdate('utkast')}
        disabled={updating}
      />
    )
  }

  return null
}

function ActionBtn({ label, icon, className, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-colors duration-150 shadow-sm disabled:opacity-60 ${className}`}
    >
      {icon}
      {label}
    </button>
  )
}
