/**
 * exportFortnox.js
 *
 * Generates a Fortnox-compatible semicolon-separated CSV from an array of
 * invoices (each with nested customers and invoice_items).
 *
 * Column order (matches Fortnox import template):
 *   FakturaNr ; FakturaDatum ; ForfalloDatum ; KundNr ; KundNamn ;
 *   KundAdress ; KundPostnr ; KundOrt ; Beskrivning ; Antal ;
 *   APris ; Moms% ; RadSumma ; ROT_RUT ; ROT_RUT_Typ ; Status
 *
 * One output row per line item. If an invoice has no items, one summary row
 * is written with empty item columns so the invoice itself is recorded.
 *
 * The file is UTF-8 with BOM (﻿) so Excel opens it correctly.
 */

// ── helpers ────────────────────────────────────────────────────────────────

/** Format a number as Swedish decimal with comma separator (Fortnox expects comma). */
function num(n) {
  if (n == null || n === '') return ''
  return new Intl.NumberFormat('sv-SE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  }).format(Number(n))
}

/** Format an ISO date string as YYYY-MM-DD (Fortnox date format). */
function date(iso) {
  if (!iso) return ''
  return String(iso).slice(0, 10)
}

/** Escape a single CSV cell: wrap in quotes if it contains ; " or newline. */
function cell(value) {
  const s = value == null ? '' : String(value)
  // Always quote to be safe with Swedish characters and addresses
  return '"' + s.replace(/"/g, '""') + '"'
}

/** Build one CSV row from an array of values. */
function row(values) {
  return values.map(cell).join(';')
}

// ── Status label mapping ───────────────────────────────────────────────────

function statusLabel(invoice) {
  if (invoice.status === 'betald') return 'Betald'
  // Overdue = obetald where due_date has passed
  const today = new Date().toISOString().slice(0, 10)
  if (invoice.status === 'obetald' && invoice.due_date && invoice.due_date < today) {
    return 'Forsenad'
  }
  return 'Obetald'
}

// ── main export ────────────────────────────────────────────────────────────

/**
 * @param {Array} invoices  - fetched with customers(*) and invoice_items(*)
 * @returns {string}        - CSV string (UTF-8 with BOM, semicolon-separated)
 */
export function buildFortnoxCSV(invoices) {
  const headers = [
    'FakturaNr',
    'FakturaDatum',
    'ForfalloDatum',
    'KundNr',
    'KundNamn',
    'KundAdress',
    'KundPostnr',
    'KundOrt',
    'Beskrivning',
    'Antal',
    'APris',
    'Moms%',
    'RadSumma',
    'ROT_RUT',
    'ROT_RUT_Typ',
    'Status',
  ]

  const lines = [row(headers)]

  for (const inv of invoices) {
    const c = inv.customers ?? {}
    const items = inv.invoice_items ?? []

    // Shared columns for every row of this invoice
    const base = [
      inv.invoice_number ?? '',
      date(inv.invoice_date),
      date(inv.due_date),
      c.id ?? '',
      c.name ?? '',
      c.address ?? '',
      c.postal_code ?? '',
      c.city ?? '',
    ]

    const rotRut = inv.rot_rut_enabled ? 'Ja' : 'Nej'
    const rotRutType = inv.rot_rut_enabled ? (inv.rot_rut_type ?? 'rot').toUpperCase() : ''
    const status = statusLabel(inv)

    if (items.length === 0) {
      // No line items — write a single row with empty item columns
      lines.push(row([
        ...base,
        '', // Beskrivning
        '', // Antal
        '', // APris
        '', // Moms%
        '', // RadSumma
        rotRut,
        rotRutType,
        status,
      ]))
    } else {
      for (const item of items) {
        const antal = item.quantity ?? 0
        const apris = item.unit_price ?? 0
        const radSumma = antal * apris
        lines.push(row([
          ...base,
          item.description ?? '',
          num(antal),
          num(apris),
          item.vat_rate ?? 25,
          num(radSumma),
          rotRut,
          rotRutType,
          status,
        ]))
      }
    }
  }

  // UTF-8 BOM + CRLF line endings (Excel on Windows)
  return '﻿' + lines.join('\r\n')
}

/**
 * Triggers a browser download of the CSV.
 * @param {string} csvString
 * @param {string} filename   e.g. "Fortnox-export-2026-06-10.csv"
 */
export function downloadCSV(csvString, filename) {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
