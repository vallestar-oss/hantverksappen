import { describe, it, expect, vi } from 'vitest'

// documents.js imports the Supabase client, which reads env vars at load time.
vi.mock('./supabase', () => ({ supabase: {} }))

const { nextSequenceNumber, itemsPayload, rowsFromItems } = await import('./documents')

describe('nextSequenceNumber', () => {
  it('starts at 001 for a new year', () => {
    expect(nextSequenceNumber([], 2026)).toBe('2026-001')
    expect(nextSequenceNumber(['2025-014'], 2026)).toBe('2026-001')
  })

  it('continues from the highest number in the year', () => {
    expect(nextSequenceNumber(['2026-001', '2026-002'], 2026)).toBe('2026-003')
  })

  it('never reuses a number after a document is deleted', () => {
    // 2026-002 was deleted; counting rows would wrongly hand out 2026-003 twice.
    expect(nextSequenceNumber(['2026-001', '2026-003'], 2026)).toBe('2026-004')
  })

  it('compares numerically, not alphabetically', () => {
    expect(nextSequenceNumber(['2026-999', '2026-1000'], 2026)).toBe('2026-1001')
  })

  it('ignores malformed values', () => {
    expect(nextSequenceNumber([null, undefined, '2026-abc', '2026-007'], 2026)).toBe('2026-008')
  })
})

describe('rowsFromItems', () => {
  it('always returns at least one editable row', () => {
    expect(rowsFromItems([])).toHaveLength(1)
    expect(rowsFromItems(undefined)).toHaveLength(1)
  })

  it('maps stored items and fills defaults', () => {
    const [row] = rowsFromItems([{ type: 'arbete', description: 'Målning', quantity: 4, unit_price: 500 }])
    expect(row).toMatchObject({ type: 'arbete', description: 'Målning', quantity: 4, unit: 'st', unit_price: 500, vat_rate: 25 })
    expect(row.id).toBeTruthy()
  })
})

describe('itemsPayload', () => {
  it('normalises form values for the database', () => {
    const rows = [{ id: 'x', type: 'material', description: '  Spik  ', quantity: '2', unit: 'st', unit_price: '10.5', vat_rate: 25 }]
    expect(itemsPayload(rows, 'quote_id', 'q1')).toEqual([
      { quote_id: 'q1', type: 'material', description: 'Spik', quantity: 2, unit: 'st', unit_price: 10.5, vat_rate: 25 },
    ])
  })

  it('stores empty descriptions and prices safely', () => {
    const rows = [{ id: 'x', type: 'arbete', description: '   ', quantity: '', unit: 'tim', unit_price: '', vat_rate: 12 }]
    expect(itemsPayload(rows, 'invoice_id', 'i1')[0]).toMatchObject({ description: null, quantity: 0, unit_price: 0 })
  })
})
