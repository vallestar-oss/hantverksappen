// Single source of truth for quote and invoice arithmetic. Every screen, PDF
// and export goes through `calcTotals`, so the numbers can never disagree.

export const VAT_RATES = [25, 12, 6]
export const DEFAULT_VAT_RATE = 25

/** Skattereduktion for ROT and RUT: 30 % of the labour cost including VAT. */
export const ROT_RUT_RATE = 0.3

export const ROT_RUT_TYPES = {
  rot: { label: 'ROT', maxPerPerson: 50000 },
  rut: { label: 'RUT', maxPerPerson: 75000 },
}

export const LABOUR = 'arbete'

const num = value => Number(value) || 0

/** Rounds to whole öre while avoiding binary floating-point artefacts. */
export function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/** Net (ex. VAT) amount of one line item. Accepts numbers or form strings. */
export function lineNet(item) {
  return round2(num(item.quantity) * num(item.unit_price))
}

function vatRateOf(item) {
  return item.vat_rate == null || item.vat_rate === '' ? DEFAULT_VAT_RATE : num(item.vat_rate)
}

/**
 * @param {Array<{type?: string, quantity: number|string, unit_price: number|string, vat_rate?: number}>} items
 * @param {boolean} rotRutEnabled
 * @returns {{
 *   subtotal: number, labourSubtotal: number, labourInclVat: number,
 *   rotRutDeduction: number, vatByRate: Record<number, number>,
 *   totalVat: number, totalInkMoms: number, toPay: number
 * }}
 */
export function calcTotals(items, rotRutEnabled = false) {
  let subtotal = 0
  let labourSubtotal = 0
  let labourInclVat = 0
  const netByRate = {}

  for (const item of items ?? []) {
    const net = lineNet(item)
    const rate = vatRateOf(item)
    subtotal += net
    netByRate[rate] = (netByRate[rate] ?? 0) + net
    if (item.type === LABOUR) {
      labourSubtotal += net
      labourInclVat += net * (1 + rate / 100)
    }
  }

  // VAT is calculated per rate on the summed net, then rounded once.
  const vatByRate = {}
  for (const [rate, net] of Object.entries(netByRate)) {
    vatByRate[rate] = round2((net * Number(rate)) / 100)
  }

  subtotal = round2(subtotal)
  labourSubtotal = round2(labourSubtotal)
  labourInclVat = round2(labourInclVat)

  const totalVat = round2(Object.values(vatByRate).reduce((sum, v) => sum + v, 0))
  const totalInkMoms = round2(subtotal + totalVat)
  const rotRutDeduction = rotRutEnabled ? round2(labourInclVat * ROT_RUT_RATE) : 0
  const toPay = round2(totalInkMoms - rotRutDeduction)

  return {
    subtotal, labourSubtotal, labourInclVat, rotRutDeduction,
    vatByRate, totalVat, totalInkMoms, toPay,
  }
}

/** Amount the customer owes for a stored document's line items. */
export function documentTotal(items, rotRutEnabled) {
  return calcTotals(items, rotRutEnabled).toPay
}

/** Display label for a stored ROT/RUT type, defaulting to ROT. */
export function rotRutLabel(type) {
  return (ROT_RUT_TYPES[type] ?? ROT_RUT_TYPES.rot).label
}
