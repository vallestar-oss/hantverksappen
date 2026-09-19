// Date helpers. Dates in the database are date-only strings (YYYY-MM-DD).
// `new Date('2026-06-10')` parses those as UTC midnight, and
// `toISOString()` reports the UTC day, so both are off by one around midnight
// in Swedish time. Everything here works in the local calendar instead.

const pad = n => String(n).padStart(2, '0')

/** Local calendar date as YYYY-MM-DD. */
export function toISODate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayISO() {
  return toISODate(new Date())
}

/** YYYY-MM-DD for `from` plus `days` (negative goes back). */
export function addDaysISO(days, from = new Date()) {
  return toISODate(new Date(from.getFullYear(), from.getMonth(), from.getDate() + days))
}

export function monthStartISO(from = new Date()) {
  return `${from.getFullYear()}-${pad(from.getMonth() + 1)}-01`
}

/** Parses a date-only string as local midnight; full timestamps pass through. */
export function parseDate(value) {
  if (value instanceof Date) return value
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value))
  if (dateOnly) return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
  return new Date(value)
}

const FORMATS = {
  long: { day: 'numeric', month: 'long', year: 'numeric' },
  medium: { day: 'numeric', month: 'short', year: 'numeric' },
  short: { day: 'numeric', month: 'short' },
}

/**
 * Formats a date in Swedish. Returns `fallback` for empty or invalid input.
 * `style`: 'long' → 10 juni 2026, 'medium' → 10 jun. 2026, 'short' → 10 jun.
 */
export function formatDate(value, { style = 'long', fallback = '–' } = {}) {
  if (!value) return fallback
  const date = parseDate(value)
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat('sv-SE', FORMATS[style]).format(date)
}

/** Whole calendar days from `from` to `to` (date-only strings or Dates). */
export function daysBetween(from, to) {
  const a = parseDate(from)
  const b = parseDate(to)
  const utc = d => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
  return Math.round((utc(b) - utc(a)) / 86_400_000)
}
