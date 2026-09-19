/**
 * Builds a semicolon-separated CSV of invoices for import into accounting
 * software such as Fortnox.
 *
 * Columns:
 *   FakturaNr ; FakturaDatum ; ForfalloDatum ; KundNr ; KundNamn ;
 *   KundAdress ; KundPostnr ; KundOrt ; Beskrivning ; Antal ;
 *   APris ; Moms% ; RadSumma ; ROT_RUT ; ROT_RUT_Typ ; Status
 *
 * One output row per line item. An invoice without items gets a single row
 * with empty item columns so the invoice itself is still recorded.
 *
 * The file is UTF-8 with a BOM and CRLF line endings so Excel on Windows
 * opens it with the correct encoding.
 */

import { todayISO } from '../lib/date'
import { lineNet, rotRutLabel } from './calc'

// U+FEFF, built from its code point so no invisible character sits in the source.
const BOM = String.fromCharCode(0xfeff)

const HEADERS = [
  'FakturaNr', 'FakturaDatum', 'ForfalloDatum', 'KundNr', 'KundNamn',
  'KundAdress', 'KundPostnr', 'KundOrt', 'Beskrivning', 'Antal',
  'APris', 'Moms%', 'RadSumma', 'ROT_RUT', 'ROT_RUT_Typ', 'Status',
]

// ── cell formatting ────────────────────────────────────────────────────────

/** Swedish decimal comma without thousands grouping, as accounting imports expect. */
function num(value) {
  if (value == null || value === '') return ''
  return new Intl.NumberFormat('sv-SE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(Number(value))
}

/** ISO date (YYYY-MM-DD) from a date or timestamp string. */
function date(iso) {
  return iso ? String(iso).slice(0, 10) : ''
}

/**
 * Free text typed by users. Spreadsheet apps execute cells that start with
 * = + - @ as formulas ("CSV injection"), so those are defused with a leading
 * apostrophe.
 */
function text(value) {
  const s = value == null ? '' : String(value)
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
}

/** Quotes every cell so åäö, addresses and separators inside text stay intact. */
function cell(value) {
  const s = value == null ? '' : String(value)
  return '"' + s.replace(/"/g, '""') + '"'
}

const row = values => values.map(cell).join(';')

function statusLabel(invoice) {
  if (invoice.status === 'betald') return 'Betald'
  if (invoice.status === 'obetald' && invoice.due_date && invoice.due_date < todayISO()) {
    return 'Forsenad'
  }
  return 'Obetald'
}

// ── public API ─────────────────────────────────────────────────────────────

/**
 * @param {Array} invoices fetched with customers(*) and invoice_items(*)
 * @returns {string} CSV text including BOM
 */
export function buildFortnoxCSV(invoices) {
  const lines = [row(HEADERS)]

  for (const invoice of invoices) {
    const customer = invoice.customers ?? {}
    const items = invoice.invoice_items ?? []

    const invoiceColumns = [
      text(invoice.invoice_number),
      date(invoice.invoice_date),
      date(invoice.due_date),
      customer.id ?? '',
      text(customer.name),
      text(customer.address),
      text(customer.postal_code),
      text(customer.city),
    ]
    const rotRutColumns = [
      invoice.rot_rut_enabled ? 'Ja' : 'Nej',
      invoice.rot_rut_enabled ? rotRutLabel(invoice.rot_rut_type) : '',
      statusLabel(invoice),
    ]

    if (items.length === 0) {
      lines.push(row([...invoiceColumns, '', '', '', '', '', ...rotRutColumns]))
      continue
    }

    for (const item of items) {
      lines.push(row([
        ...invoiceColumns,
        text(item.description),
        num(item.quantity ?? 0),
        num(item.unit_price ?? 0),
        item.vat_rate ?? 25,
        num(lineNet(item)),
        ...rotRutColumns,
      ]))
    }
  }

  return BOM + lines.join('\r\n')
}

/**
 * Triggers a browser download of the CSV.
 * @param {string} csvString
 * @param {string} filename e.g. "Fortnox-export-2026-06-10.csv"
 */
export function downloadCSV(csvString, filename) {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
