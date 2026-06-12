import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { SkeletonPage } from '../components/Skeleton'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { generateQuotePDF } from '../utils/generateQuotePDF'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import Page, { Noise } from '../components/Premium'
import ActivityLog from '../components/ActivityLog'
import { useToast } from '../components/Toast'
import {
  ChevronLeft, Pencil, PencilLine, Send, CheckCircle, XCircle,
  Phone, Mail, MapPin, Download, Briefcase, Trash2, Loader2, Check,
} from 'lucide-react'

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

// ── icons (Lucide, consistent with the rest of the app) ─────────────────────

function DraftIcon()    { return <PencilLine className="w-5 h-5" /> }
function SentIcon()     { return <Send className="w-5 h-5" /> }
function ApprovedIcon() { return <CheckCircle className="w-5 h-5" /> }
function RejectedIcon() { return <XCircle className="w-5 h-5" /> }

// ── sub-components ─────────────────────────────────────────────────────────

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {title && (
        <div className="px-5 pt-4 pb-3 border-b border-gray-100">
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
  const location = useLocation()
  const showToast = useToast()

  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const { confirmDialog, confirm } = useConfirmDialog()

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

  // Saved from edit/create flow — show as toast, then clear the state
  useEffect(() => {
    if (location.state?.saved === true) {
      showToast('Offerten sparades', 'success')
      window.history.replaceState({}, '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      showToast('Något gick fel', 'error')
      setUpdating(false)
    } else {
      setQuote(prev => ({ ...prev, status, updated_at: new Date().toISOString() }))
      const statusLabel = STATUS_CONFIG[status]?.label ?? status
      showToast(`Status ändrad till ${statusLabel}`, 'success')
      setUpdating(false)
    }
  }

  async function handleDelete() {
    const ok = await confirm(
      'Radera offert',
      'Är du säker på att du vill radera denna offert? Detta går inte att ångra.'
    )
    if (!ok) return
    setDeleting(true)
    setError('')
    const { error: itemsErr } = await supabase
      .from('quote_items')
      .delete()
      .eq('quote_id', id)
    if (itemsErr) { setError('Kunde inte radera offerten. Försök igen.'); setDeleting(false); return }
    const { error: quoteErr } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (quoteErr) { setError('Kunde inte radera offerten. Försök igen.'); setDeleting(false) }
    else {
      showToast('Offerten raderades', 'info')
      navigate('/quotes')
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

  if (loading) return <SkeletonPage />

  const status = quote.status ?? 'utkast'
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.utkast
  const items = quote.quote_items ?? []
  const customer = quote.customers

  return (
    <>
      {confirmDialog}
    <Page className="min-h-screen bg-gray-50 pb-20">
      {/* ── Dark header — the document moment ── */}
      <header className="px-4 py-4 flex items-center gap-3 sticky top-0 z-10 overflow-hidden" style={{ background: '#111111' }}>
        <Noise />
        <button
          onClick={() => navigate('/quotes')}
          className="relative text-gray-400 hover:text-white transition-colors p-1 -ml-1 rounded-lg"
          aria-label="Tillbaka"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="relative font-bold text-white text-lg flex-1 truncate tracking-tight">
          Offert {quote.quote_number}
        </h1>
        <button
          onClick={() => navigate(`/quotes/${id}/edit`)}
          className="relative text-gray-400 hover:text-white transition-colors p-1 rounded-lg"
          aria-label="Redigera offert"
        >
          <Pencil className="w-5 h-5" />
        </button>
      </header>

      {/* ── Dark hero — the quoted amount is the hero ── */}
      <section className="relative overflow-hidden" style={{ background: '#111111' }}>
        <Noise />
        <div
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{
            top: '-120px', right: '-80px', width: '300px', height: '300px',
            background: `radial-gradient(circle, ${
              status === 'godkänd' ? 'rgba(22,163,74,0.30)'
              : status === 'avvisad' ? 'rgba(220,38,38,0.25)'
              : 'rgba(0,85,255,0.28)'
            } 0%, transparent 70%)`,
          }}
        />
        <div className="relative max-w-lg mx-auto px-4 pt-5 pb-7">
          <div className="flex items-center justify-between gap-3">
            <p className={`text-xs font-semibold uppercase tracking-wide ${
              status === 'godkänd' ? 'text-green-400' : status === 'avvisad' ? 'text-red-300' : 'text-blue-300'
            }`}>
              {quote.rot_rut_enabled ? 'Att betala efter ROT/RUT' : 'Att betala'}
            </p>
            {status === 'godkänd' ? (
              <span className="check-pop inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700 glow-success">
                <Check className="w-3 h-3" strokeWidth={3} />
                Godkänd
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                status === 'avvisad' ? 'bg-red-100 text-red-700'
                : status === 'skickad' ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600'
              }`}>
                {cfg.label}
              </span>
            )}
          </div>

          <p className="text-[2.5rem] font-extrabold text-white tabular-nums leading-tight mt-1" style={{ letterSpacing: '-0.02em' }}>
            {formatSEK(calc.toPay)}
          </p>

          {quote.valid_until && (
            <p className="text-sm text-gray-400 mt-1">Giltig till {formatDate(quote.valid_until)}</p>
          )}
        </div>
      </section>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Customer card */}
        {customer && (
          <Card title="Kundinformation">
            <p className="font-bold text-gray-800 text-base">{customer.name}</p>

            {customer.phone && (
              <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {customer.phone}
              </a>
            )}

            {customer.email && (
              <a href={`mailto:${customer.email}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {customer.email}
              </a>
            )}

            {(customer.address || customer.city) && (
              <p className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
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
            <div className="pt-1 border-t border-gray-100">
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
                    className={`px-5 py-4 ${i < items.length - 1 ? 'border-b border-gray-100' : ''}`}
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

          <div className="border-t border-gray-200 pt-3 mt-1 space-y-2">
            {VAT_RATES.filter(r => (calc.vatByRate?.[r] ?? 0) > 0).map(r => (
              <SummaryRow key={r} label={`Moms ${r}%`} value={formatSEK(calc.vatByRate[r])} />
            ))}
          </div>

          <div className="border-t border-gray-200 pt-3 mt-1">
            <SummaryRow label="Totalt ink. moms" value={formatSEK(calc.totalInkMoms)} />
          </div>

          {/* Total — distinct dark surface */}
          <div className="relative overflow-hidden rounded-xl mt-3 -mx-1" style={{ background: '#111111' }}>
            <Noise />
            <div className="relative px-4 py-4 flex justify-between items-center gap-3">
              <span className="font-semibold text-white text-sm">
                {quote.rot_rut_enabled ? 'Att betala efter ROT/RUT' : 'Att betala'}
              </span>
              <span className="font-extrabold text-white text-2xl tabular-nums" style={{ letterSpacing: '-0.02em' }}>
                {formatSEK(calc.toPay)}
              </span>
            </div>
          </div>
        </Card>

        {/* PDF download */}
        <button
          onClick={handleDownloadPDF}
          disabled={pdfLoading}
          className="btn-lift w-full flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold py-3 rounded-xl disabled:opacity-60"
        >
          {pdfLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Genererar PDF…
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Ladda ner PDF
            </>
          )}
        </button>

        {/* Action buttons */}
        {error && <p className="text-sm text-danger px-1">{error}</p>}

        <ActionButtons status={status} updating={updating} onUpdate={updateStatus} quoteId={id} />

        {/* Aktivitet */}
        <ActivityLog
          events={[
            { label: 'Offert skapad', date: quote.created_at },
            status !== 'utkast' && {
              label: `Status ändrad till ${cfg.label}`,
              date: quote.updated_at ?? quote.created_at,
            },
          ].filter(Boolean)}
        />

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={deleting || updating}
          className="btn-lift w-full flex items-center justify-center gap-2 bg-white border border-red-200 hover:bg-red-50 active:bg-red-100 disabled:opacity-60 text-red-600 font-semibold h-12 rounded-xl"
        >
          <Trash2 className="w-4 h-4" />
          {deleting ? 'Raderar…' : 'Radera offert'}
        </button>
      </div>
    </Page>
    </>
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
          className="bg-primary hover:bg-primary-dark text-white"
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
          <Briefcase className="w-5 h-5" />
        }
        className="bg-primary hover:bg-primary-dark text-white"
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
      className={`btn-lift w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl disabled:opacity-60 ${className}`}
    >
      {icon}
      {label}
    </button>
  )
}
