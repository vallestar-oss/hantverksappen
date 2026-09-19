import { describe, it, expect, vi, beforeAll } from 'vitest'
import { jsPDF } from 'jspdf'
import { generateInvoicePDF } from './generateInvoicePDF'
import { generateQuotePDF } from './generateQuotePDF'

// Smoke tests: run the generators end to end in Node (Helvetica fallback, no
// logo) to catch runtime errors. `save` needs a browser, so it is stubbed.

const items = [
  { type: 'arbete', description: 'Målning av vardagsrum', quantity: 8, unit: 'tim', unit_price: 650, vat_rate: 25 },
  { type: 'material', description: 'Färg', quantity: 3, unit: 'st', unit_price: 399.5, vat_rate: 25 },
]
const customer = { name: 'Anna Andersson', address: 'Storgatan 1', postal_code: '123 45', city: 'Stockholm' }
const profile = { company_name: 'Testbolaget AB', org_number: '556123-4567', f_skatt: true, bankgiro: '123-4567' }

beforeAll(() => {
  jsPDF.API.save = () => {}
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
})

describe.each([
  ['invoice', () => generateInvoicePDF(
    { invoice_number: '2026-001', invoice_date: '2026-06-10', due_date: '2026-07-10', status: 'obetald', rot_rut_enabled: true, rot_rut_type: 'rot', notes: 'Tack' },
    items, customer, profile,
  )],
  ['quote', () => generateQuotePDF(
    { quote_number: '2026-001', valid_until: '2026-07-10', rot_rut_enabled: true, rot_rut_type: 'rut', notes: 'Tack' },
    items, customer, profile,
  )],
])('%s PDF', (_name, generate) => {
  it('renders without throwing and numbers its pages', async () => {
    const doc = await generate()
    expect(doc.internal.getNumberOfPages()).toBeGreaterThanOrEqual(1)
  })
})

describe('long documents', () => {
  it('flow onto extra pages instead of overflowing', async () => {
    const many = Array.from({ length: 60 }, (_, i) => ({ ...items[0], description: `Rad ${i + 1}` }))
    const doc = await generateInvoicePDF(
      { invoice_number: '2026-002', invoice_date: '2026-06-10', due_date: '2026-07-10', status: 'obetald', rot_rut_enabled: true },
      many, customer, profile,
    )
    expect(doc.internal.getNumberOfPages()).toBeGreaterThan(1)
  })
})
