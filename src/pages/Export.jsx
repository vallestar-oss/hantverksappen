import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { buildFortnoxCSV, downloadCSV } from '../utils/exportFortnox'

// ── helpers ────────────────────────────────────────────────────────────────

function todayISO() { return new Date().toISOString().slice(0, 10) }

function firstOfMonthISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

// ── component ──────────────────────────────────────────────────────────────

export default function Export() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [fromDate, setFromDate]     = useState(firstOfMonthISO())
  const [toDate, setToDate]         = useState(todayISO())
  const [inclPaid, setInclPaid]     = useState(true)
  const [inclUnpaid, setInclUnpaid] = useState(true)

  const [loading, setLoading]       = useState(false)
  const [result, setResult]         = useState(null) // { count } after export
  const [error, setError]           = useState('')

  // ── preview count query ────────────────────────────────────────────────

  async function handleExport() {
    setError('')
    setResult(null)

    if (!inclPaid && !inclUnpaid) {
      setError('Välj minst en status att exportera.')
      return
    }

    setLoading(true)

    // Build status filter
    const statuses = []
    if (inclPaid)   statuses.push('betald')
    if (inclUnpaid) statuses.push('obetald')

    let query = supabase
      .from('invoices')
      .select('*, customers(*), invoice_items(*)')
      .eq('user_id', user.id)
      .in('status', statuses)
      .order('invoice_date', { ascending: true })

    // Date range on invoice_date (null dates are excluded by range filter)
    if (fromDate) query = query.gte('invoice_date', fromDate)
    if (toDate)   query = query.lte('invoice_date', toDate)

    const { data, error: fetchErr } = await query

    if (fetchErr) {
      console.error('Export fetch error:', fetchErr)
      setError(`Kunde inte hämta fakturor: ${fetchErr.message}`)
      setLoading(false)
      return
    }

    const invoices = data ?? []

    if (invoices.length === 0) {
      setError('Inga fakturor hittades för valda filter.')
      setLoading(false)
      return
    }

    const csv      = buildFortnoxCSV(invoices)
    const filename = `Fortnox-export-${todayISO()}.csv`
    downloadCSV(csv, filename)

    setResult({ count: invoices.length, filename })
    setLoading(false)
  }

  // ── render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate('/settings')}
          className="text-gray-500 hover:text-gray-800 transition-colors p-1 -ml-1 rounded-lg"
          aria-label="Tillbaka"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-bold text-gray-800 text-lg">Exportera</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4 pb-20">

        {/* Fortnox export card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">

          {/* Section heading */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-gray-800 text-sm">Fortnox-export</h2>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                Exportera fakturor i Fortnox-kompatibelt CSV-format. Filen kan importeras direkt i Fortnox bokföring.
              </p>
            </div>
          </div>

          {/* Date range */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Datumintervall</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Från datum</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => { setFromDate(e.target.value); setResult(null) }}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Till datum</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => { setToDate(e.target.value); setResult(null) }}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Status checkboxes */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Status</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={inclPaid}
                  onChange={e => { setInclPaid(e.target.checked); setResult(null) }}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className="text-sm text-gray-700">Betalda</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={inclUnpaid}
                  onChange={e => { setInclUnpaid(e.target.checked); setResult(null) }}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className="text-sm text-gray-700">Obetalda</span>
              </label>
            </div>
          </div>

          {/* Export button */}
          <button
            type="button"
            onClick={handleExport}
            disabled={loading || (!inclPaid && !inclUnpaid)}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Exporterar...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exportera till CSV
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <p className="text-sm text-danger">{error}</p>
          )}

          {/* Success summary */}
          {result && (
            <div className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-success flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-success">
                  {result.count} {result.count === 1 ? 'faktura exporterad' : 'fakturor exporterade'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 font-mono">{result.filename}</p>
              </div>
            </div>
          )}
        </div>

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-1.5">
          <p className="text-xs font-semibold text-blue-700">Om Fortnox-export</p>
          <p className="text-xs text-blue-600 leading-relaxed">
            CSV-filen är UTF-8-kodad med semikolonseparering och passar för import i Fortnox under
            <span className="font-semibold"> Fakturering → Importera fakturor</span>.
            Öppna inte filen i Excel innan import — det kan förstöra teckenkodningen.
          </p>
        </div>

      </div>
    </div>
  )
}

const inputClass = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
const labelClass = 'block text-xs font-medium text-gray-500 mb-1'
