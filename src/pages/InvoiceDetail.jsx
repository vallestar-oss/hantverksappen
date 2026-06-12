import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom'
import { SkeletonPage } from '../components/Skeleton'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { generateInvoicePDF } from '../utils/generateInvoicePDF'
import { useConfirmDialog } from '../hooks/useConfirmDialog'
import Page, { Noise } from '../components/Premium'
import ActivityLog from '../components/ActivityLog'
import { useToast } from '../components/Toast'
import {
  ChevronLeft, Pencil, AlertTriangle, Check, Phone, Mail,
  Download, Bell, Trash2, Loader2, Landmark,
} from 'lucide-react'

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
  const location = useLocation()
  const showToast = useToast()

  const [invoice, setInvoice] = useState(null)
  const [items, setItems] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const { confirmDialog, confirm } = useConfirmDialog()

  useEffect(() => {
    async function load() {
      const { data, error: err } = await supabase
        .from('invoices')
        .select('*, customers(*), jobs(id, title)')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (err || !data) { navigate('/invoices'); return }

      const [{ data: itemData }, { data: profileData }] = await Promise.all([
        supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', id)
          .order('created_at', { ascending: true }),
        supabase
          .from('company_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single(),
      ])

      setInvoice(data)
      setItems(itemData ?? [])
      setProfile(profileData ?? null)
      setLoading(false)
    }
    load()
  }, [id, user.id, navigate])

  // Saved from edit/create flow — show as toast, then clear the state
  useEffect(() => {
    if (location.state?.saved === true) {
      showToast('Fakturan sparades', 'success')
      window.history.replaceState({}, '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      showToast('Något gick fel', 'error')
    } else {
      setInvoice(prev => ({ ...prev, ...patch }))
      showToast('Fakturan markerades som betald', 'success')
    }
    setPaying(false)
  }

  async function handleDelete() {
    const ok = await confirm(
      'Radera faktura',
      'Är du säker på att du vill radera denna faktura? Detta går inte att ångra.'
    )
    if (!ok) return
    setDeleting(true)
    setError('')
    const { error: itemsErr } = await supabase
      .from('invoice_items')
      .delete()
      .eq('invoice_id', id)
    if (itemsErr) { setError('Kunde inte radera fakturan. Försök igen.'); setDeleting(false); return }
    const { error: invErr } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (invErr) { setError('Kunde inte radera fakturan. Försök igen.'); setDeleting(false) }
    else {
      showToast('Fakturan raderades', 'info')
      navigate('/invoices')
    }
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

  if (loading) return <SkeletonPage />

  const status = effectiveStatus(invoice)
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.obetald
  const totals = calcTotals(items, invoice.rot_rut_enabled)
  const isPaid = invoice.status === 'betald'
  const isOverdue = status === 'försenad'
  const overdueDays = isOverdue ? daysOverdue(invoice.due_date) : 0

  return (
    <>
      {confirmDialog}
    <Page className="min-h-screen bg-gray-50 pb-20">

      {/* ── Dark header — the document moment ── */}
      <header className="px-4 py-4 flex items-center gap-3 sticky top-0 z-10 overflow-hidden" style={{ background: '#111111' }}>
        <Noise />
        <button onClick={() => navigate('/invoices')}
          className="relative text-gray-400 hover:text-white transition-colors p-1 -ml-1 rounded-lg" aria-label="Tillbaka">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="relative font-bold text-white text-lg flex-1 truncate tracking-tight">
          Faktura #{invoice.invoice_number ?? '–'}
        </h1>
        <button onClick={() => navigate(`/invoices/${id}/edit`)}
          className="relative text-gray-400 hover:text-white transition-colors p-1 rounded-lg" aria-label="Redigera">
          <Pencil className="w-5 h-5" />
        </button>
      </header>

      {/* ── Dark hero — amount is the largest element on the screen ── */}
      <section className="relative overflow-hidden" style={{ background: '#111111' }}>
        <Noise />
        {/* status-tinted glow */}
        <div
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{
            top: '-120px', right: '-80px', width: '300px', height: '300px',
            background: `radial-gradient(circle, ${
              isPaid ? 'rgba(22,163,74,0.30)' : isOverdue ? 'rgba(220,38,38,0.30)' : 'rgba(0,85,255,0.28)'
            } 0%, transparent 70%)`,
          }}
        />
        <div className="relative max-w-lg mx-auto px-4 pt-5 pb-7">
          <div className="flex items-center justify-between gap-3">
            <p className={`text-xs font-semibold uppercase tracking-wide ${
              isPaid ? 'text-green-400' : isOverdue ? 'text-red-300' : 'text-blue-300'
            }`}>
              {isPaid ? 'Betald' : 'Att betala'}
            </p>
            {isPaid ? (
              <span className="check-pop inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700 glow-success">
                <Check className="w-3 h-3" strokeWidth={3} />
                Betald
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                isOverdue ? 'bg-red-100 text-red-700 glow-danger' : 'bg-amber-100 text-amber-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            )}
          </div>

          <p className="text-[2.5rem] font-extrabold text-white tabular-nums leading-tight mt-1" style={{ letterSpacing: '-0.02em' }}>
            {formatSEK(totals.toPay)}
          </p>

          {isPaid && invoice.paid_date && (
            <p className="text-sm text-gray-400 mt-1">Betalades {formatDate(invoice.paid_date)}</p>
          )}
          {!isPaid && !isOverdue && invoice.due_date && (
            <p className="text-sm text-gray-400 mt-1">Förfaller {formatDate(invoice.due_date)}</p>
          )}
          {isOverdue && (
            <p className="text-sm text-red-300 mt-1 font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Förföll {formatDate(invoice.due_date)} — försenad med {overdueDays} {overdueDays === 1 ? 'dag' : 'dagar'}
            </p>
          )}
        </div>
      </section>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* ── Markera som betald — only when unpaid ── */}
        {!isPaid && (
          <button onClick={handleMarkPaid} disabled={paying}
            className="btn-lift w-full flex items-center justify-center gap-2 bg-success hover:bg-green-700 active:bg-green-800 disabled:opacity-60 text-white font-bold py-4 rounded-xl text-base">
            <Check className="w-5 h-5" strokeWidth={2.5} />
            {paying ? 'Uppdaterar…' : 'Markera som betald'}
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
                  <Phone className="w-4 h-4" />
                  Ring
                </a>
              )}
              {invoice.customers.email && (
                <a href={`mailto:${invoice.customers.email}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm text-gray-600 transition-colors">
                  <Mail className="w-4 h-4" />
                  E-post
                </a>
              )}
            </div>
          </Card>
        )}

        {/* ── Fakturadetaljer ── */}
        <Card title="Fakturadetaljer">
          <DetailRow label="Fakturanummer">
            <span className="text-sm font-semibold text-gray-800">#{invoice.invoice_number ?? '–'}</span>
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
                  <tr className="border-b border-gray-200">
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
                        className={`border-b border-gray-100 last:border-0 ${invoice.rot_rut_enabled && isArbete ? 'bg-amber-50/40' : ''}`}>
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

            <div className="border-t border-gray-200 pt-2 space-y-2">
              {VAT_RATES.filter(r => (totals.vatByRate[r] ?? 0) > 0).map(r => (
                <SummaryRow key={r} label={`Moms ${r}%`} value={formatSEK(totals.vatByRate[r])} />
              ))}
            </div>

            <div className="border-t border-gray-200 pt-2">
              <SummaryRow label="Totalt ink. moms" value={formatSEK(totals.totalInkMoms)} />
            </div>

            {/* Total — distinct dark surface, document-grade */}
            <div className="relative overflow-hidden rounded-xl mt-3 -mx-1" style={{ background: '#111111' }}>
              <Noise />
              <div className="relative px-4 py-4 flex justify-between items-center gap-3">
                <span className="font-semibold text-white text-sm">
                  {invoice.rot_rut_enabled ? 'Att betala efter ROT/RUT' : 'Att betala'}
                </span>
                <span className={`font-extrabold text-2xl tabular-nums ${isPaid ? 'text-green-400' : 'text-white'}`} style={{ letterSpacing: '-0.02em' }}>
                  {formatSEK(totals.toPay)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Betalningsinformation ── */}
        <Card title="Betalningsinformation">
          {profile?.company_name && (
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              {profile.logo_url ? (
                <img src={profile.logo_url} alt="" className="h-9 w-9 object-contain rounded-lg border border-gray-100 flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Landmark className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{profile.company_name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {[profile.org_number && `Org.nr ${profile.org_number}`, profile.f_skatt && 'Innehar F-skattsedel'].filter(Boolean).join(' · ') || 'Betalningsmottagare'}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {profile?.bankgiro && (
              <DetailRow label="Bankgiro">
                <span className="text-sm font-semibold text-gray-800 tabular-nums">{profile.bankgiro}</span>
              </DetailRow>
            )}
            {profile?.swish && (
              <DetailRow label="Swish">
                <span className="text-sm font-semibold text-gray-800 tabular-nums">{profile.swish}</span>
              </DetailRow>
            )}
            <DetailRow label="Referens">
              <span className="text-sm font-semibold text-gray-800 tabular-nums">{invoice.invoice_number ?? '–'}</span>
            </DetailRow>
            <DetailRow label="Förfallodatum">
              <span className={`text-sm font-semibold ${isOverdue ? 'text-danger' : 'text-gray-800'}`}>
                {formatDate(invoice.due_date)}
              </span>
            </DetailRow>
            <DetailRow label="Att betala">
              <span className="text-sm font-bold text-gray-900 tabular-nums">{formatSEK(totals.toPay)}</span>
            </DetailRow>
          </div>

          {!profile?.bankgiro && !profile?.swish && (
            <p className="text-xs text-gray-400 leading-relaxed">
              Lägg till bankgiro eller Swish under Inställningar så visas de här och på dina PDF-fakturor.
            </p>
          )}
        </Card>

        {error && <p className="text-sm text-danger px-1">{error}</p>}

        {/* ── Ladda ner PDF ── */}
        <button onClick={handleDownloadPDF} disabled={pdfLoading}
          className="btn-lift w-full flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-60 text-gray-700 font-semibold py-3 rounded-xl">
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

        {/* ── Skicka påminnelse — only when unpaid and customer has email ── */}
        {!isPaid && invoice.customers?.email && (
          <a
            href={`mailto:${invoice.customers.email}?subject=${encodeURIComponent(`Påminnelse: Faktura ${invoice.invoice_number ?? ''}`)}&body=${encodeURIComponent(`Hej ${invoice.customers.name ?? ''},\n\nDetta är en vänlig påminnelse om faktura ${invoice.invoice_number ?? ''} på ${formatSEK(totals.toPay)}${invoice.due_date ? ` med förfallodatum ${formatDate(invoice.due_date)}` : ''}.\n\nMed vänliga hälsningar`)}`}
            className="btn-lift w-full flex items-center justify-center gap-2 bg-white border border-amber-300 hover:bg-amber-50 active:bg-amber-100 text-warning font-semibold py-3 rounded-xl">
            <Bell className="w-4 h-4" />
            Skicka påminnelse
          </a>
        )}

        {/* ── Aktivitet ── */}
        <ActivityLog
          events={[
            { label: 'Faktura skapad', date: invoice.created_at },
            invoice.status === 'betald' && invoice.paid_date && {
              // updated_at carries the full timestamp so the event sorts after
              // "Faktura skapad" on the same day (paid_date is date-only)
              label: 'Markerad som betald', date: invoice.updated_at ?? invoice.paid_date,
            },
            isOverdue && {
              label: `Förföll — ${overdueDays} ${overdueDays === 1 ? 'dag' : 'dagar'} sedan`,
              date: invoice.due_date,
            },
          ].filter(Boolean)}
        />

        {/* ── Radera faktura ── */}
        <button
          onClick={handleDelete}
          disabled={deleting || paying}
          className="btn-lift w-full flex items-center justify-center gap-2 bg-white border border-red-200 hover:bg-red-50 active:bg-red-100 disabled:opacity-60 text-red-600 font-semibold h-12 rounded-xl"
        >
          <Trash2 className="w-4 h-4" />
          {deleting ? 'Raderar…' : 'Radera faktura'}
        </button>
      </div>
    </Page>
    </>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
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
