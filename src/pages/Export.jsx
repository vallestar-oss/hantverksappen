import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Download, CheckCircle, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { buildFortnoxCSV, downloadCSV } from '../utils/exportFortnox'
import { todayISO, monthStartISO } from '../lib/date'
import { pluralize } from '../lib/format'
import Page from '../components/Premium'
import { Card, Field, FormError, FormHeader, inputClass } from '../components/FormField'

export default function Export() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [fromDate, setFromDate] = useState(monthStartISO)
  const [toDate, setToDate] = useState(todayISO)
  const [inclPaid, setInclPaid] = useState(true)
  const [inclUnpaid, setInclUnpaid] = useState(true)

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null) // { count, filename } after an export
  const [error, setError] = useState('')

  // Any change to the filters invalidates the previous "exported" message.
  function update(setter) {
    return value => { setter(value); setResult(null) }
  }

  async function handleExport() {
    setError('')
    setResult(null)

    if (!inclPaid && !inclUnpaid) {
      setError('Välj minst en status att exportera.')
      return
    }

    setLoading(true)

    const statuses = []
    if (inclPaid) statuses.push('betald')
    if (inclUnpaid) statuses.push('obetald')

    let query = supabase
      .from('invoices')
      .select('*, customers(*), invoice_items(*)')
      .eq('user_id', user.id)
      .in('status', statuses)
      .order('invoice_date', { ascending: true })

    // Range on invoice_date; invoices without a date are excluded by the filter.
    if (fromDate) query = query.gte('invoice_date', fromDate)
    if (toDate) query = query.lte('invoice_date', toDate)

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError('Kunde inte hämta fakturor. Försök igen.')
    } else if (!data?.length) {
      setError('Inga fakturor hittades för valda filter.')
    } else {
      const filename = `Fortnox-export-${todayISO()}.csv`
      downloadCSV(buildFortnoxCSV(data), filename)
      setResult({ count: data.length, filename })
    }

    setLoading(false)
  }

  return (
    <Page className="min-h-screen bg-gray-50">
      <FormHeader title="Exportera" onBack={() => navigate('/settings')} />

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4 pb-20">
        <Card className="space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
              <BarChart3 className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800 text-sm">Fortnox-export</h2>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                Exportera fakturor som en CSV-fil för bokföring, med en rad per fakturarad.
              </p>
            </div>
          </div>

          <fieldset>
            <legend className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Datumintervall</legend>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Från datum">
                <input type="date" value={fromDate} onChange={e => update(setFromDate)(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Till datum">
                <input type="date" value={toDate} onChange={e => update(setToDate)(e.target.value)} className={inputClass} />
              </Field>
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Status</legend>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={inclPaid}
                  onChange={e => update(setInclPaid)(e.target.checked)}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className="text-sm text-gray-700">Betalda</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={inclUnpaid}
                  onChange={e => update(setInclUnpaid)(e.target.checked)}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className="text-sm text-gray-700">Obetalda</span>
              </label>
            </div>
          </fieldset>

          <button
            type="button"
            onClick={handleExport}
            disabled={loading || (!inclPaid && !inclUnpaid)}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark active:bg-primary-darker disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporterar…
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Exportera till CSV
              </>
            )}
          </button>

          <FormError>{error}</FormError>

          {result && (
            <div role="status" className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-success">
                  {pluralize(result.count, 'faktura exporterad', 'fakturor exporterade')}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 font-mono">{result.filename}</p>
              </div>
            </div>
          )}
        </Card>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-1.5">
          <p className="text-xs font-semibold text-blue-700">Om exportformatet</p>
          <p className="text-xs text-blue-600 leading-relaxed">
            Filen är UTF-8-kodad med semikolon som avgränsare. Kontrollera kolumnerna mot importmallen i
            ditt bokföringsprogram innan du importerar.
          </p>
        </div>
      </div>
    </Page>
  )
}
