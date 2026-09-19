import { describe, it, expect } from 'vitest'
import { buildFortnoxCSV } from './exportFortnox'

const invoice = (overrides = {}) => ({
  invoice_number: '2026-001',
  invoice_date: '2026-06-10',
  due_date: '2999-01-01',
  status: 'obetald',
  rot_rut_enabled: false,
  customers: { id: 'c1', name: 'Anna Andersson', address: 'Storgatan 1', postal_code: '123 45', city: 'Stockholm' },
  invoice_items: [{ description: 'Målning', quantity: 2, unit_price: 500, vat_rate: 25, type: 'arbete' }],
  ...overrides,
})

const BOM = String.fromCharCode(0xfeff)
const parse = csv => csv.replace(BOM, '').split('\r\n').map(line => line.split(';').map(c => c.slice(1, -1)))

describe('buildFortnoxCSV', () => {
  it('starts with a BOM and a header row, and uses CRLF', () => {
    const csv = buildFortnoxCSV([invoice()])
    expect(csv.startsWith(BOM)).toBe(true)
    expect(csv).toContain('\r\n')
    expect(parse(csv)[0][0]).toBe('FakturaNr')
  })

  it('writes one row per line item with Swedish decimals', () => {
    const rows = parse(buildFortnoxCSV([invoice()]))
    expect(rows).toHaveLength(2)
    expect(rows[1].slice(0, 2)).toEqual(['2026-001', '2026-06-10'])
    expect(rows[1].slice(9, 13)).toEqual(['2,00', '500,00', '25', '1000,00'])
  })

  it('writes a summary row for invoices without items', () => {
    const rows = parse(buildFortnoxCSV([invoice({ invoice_items: [] })]))
    expect(rows).toHaveLength(2)
    expect(rows[1].slice(8, 13)).toEqual(['', '', '', '', ''])
  })

  it('marks ROT/RUT and payment status', () => {
    const paid = parse(buildFortnoxCSV([invoice({ status: 'betald', rot_rut_enabled: true, rot_rut_type: 'rut' })]))[1]
    expect(paid.slice(13)).toEqual(['Ja', 'RUT', 'Betald'])

    const overdue = parse(buildFortnoxCSV([invoice({ due_date: '2000-01-01' })]))[1]
    expect(overdue[15]).toBe('Forsenad')
  })

  it('escapes quotes and keeps åäö', () => {
    const csv = buildFortnoxCSV([invoice({ customers: { id: 'c1', name: 'Åsa "Bygg" Öberg' } })])
    expect(csv).toContain('"Åsa ""Bygg"" Öberg"')
  })

  it('defuses spreadsheet formulas in user-entered text', () => {
    const csv = buildFortnoxCSV([
      invoice({
        customers: { id: 'c1', name: '=HYPERLINK("http://evil.example")' },
        invoice_items: [{ description: '@SUM(A1)', quantity: 1, unit_price: 100, vat_rate: 25, type: 'material' }],
      }),
    ])
    const [, dataRow] = parse(csv)
    expect(dataRow[4].startsWith("'=")).toBe(true)
    expect(dataRow[8]).toBe("'@SUM(A1)")
  })
})
