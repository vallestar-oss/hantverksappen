import { describe, it, expect } from 'vitest'
import { toISODate, addDaysISO, parseDate, formatDate, daysBetween, monthStartISO } from './date'

describe('toISODate', () => {
  it('uses the local calendar day, not the UTC day', () => {
    // 00:30 local time — toISOString() reports the previous day in UTC+1/+2.
    expect(toISODate(new Date(2026, 5, 10, 0, 30))).toBe('2026-06-10')
  })
})

describe('addDaysISO', () => {
  it('crosses month and year boundaries', () => {
    expect(addDaysISO(30, new Date(2026, 11, 15))).toBe('2027-01-14')
    expect(addDaysISO(-1, new Date(2026, 2, 1))).toBe('2026-02-28')
  })
})

describe('monthStartISO', () => {
  it('returns the first of the month', () => {
    expect(monthStartISO(new Date(2026, 8, 19))).toBe('2026-09-01')
  })
})

describe('parseDate / formatDate', () => {
  it('parses date-only strings as local midnight', () => {
    const d = parseDate('2026-06-10')
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 5, 10, 0])
  })

  it('formats in Swedish', () => {
    expect(formatDate('2026-06-10')).toBe('10 juni 2026')
    expect(formatDate('2026-06-10', { style: 'short' })).toMatch(/^10 jun/)
  })

  it('falls back for empty or invalid input', () => {
    expect(formatDate(null)).toBe('–')
    expect(formatDate('inte ett datum')).toBe('–')
    expect(formatDate('', { fallback: '' })).toBe('')
  })
})

describe('daysBetween', () => {
  it('counts whole calendar days', () => {
    expect(daysBetween('2026-06-01', '2026-06-11')).toBe(10)
    expect(daysBetween('2026-06-11', '2026-06-01')).toBe(-10)
  })

  it('is unaffected by daylight-saving changes', () => {
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2)
  })
})
