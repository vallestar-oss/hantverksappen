/**
 * Formats an amount as Swedish kronor, e.g. `1 234,50 kr`.
 * Defaults to at most two decimals; pass `{ min: 2 }` for fixed öre (invoices,
 * PDFs) or `{ max: 0 }` for compact dashboard figures.
 */
export function formatSEK(amount, { min = 0, max = 2 } = {}) {
  return (
    new Intl.NumberFormat('sv-SE', {
      minimumFractionDigits: min,
      maximumFractionDigits: Math.max(min, max),
    }).format(Number(amount) || 0) + ' kr'
  )
}

/** pluralize(3, 'faktura', 'fakturor') → "3 fakturor" */
export function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`
}
