// Pieces shared by the quote and invoice PDF generators.

import { formatSEK } from '../lib/format'
import { formatDate } from '../lib/date'
import { ROT_RUT_TYPES } from './calc'

// ── palette (RGB) ────────────────────────────────────────────────────────────
export const BLACK  = [17,  17,  17]   // headings, body text
export const LABEL  = [130, 130, 130]  // section headers, secondary
export const SUBTLE = [175, 175, 175]  // footer
export const BORDER = [210, 210, 210]  // dividers, table lines
export const DARK   = [80,  80,  80]   // header table border
export const ALT    = [249, 249, 249]  // alternating rows
export const DANGER = [180,  30,  30]  // overdue only
export const WHITE  = [255, 255, 255]

// ── layout (mm, A4 portrait) ─────────────────────────────────────────────────
export const MARGIN_X = 18
export const FOOTER_RESERVE = 20

// ── formatting ───────────────────────────────────────────────────────────────

/** Fixed two decimals, e.g. `1 250,00 kr`. */
export const formatMoney = amount => formatSEK(amount, { min: 2 })

export const formatPdfDate = value => formatDate(value, { fallback: '—' })

/** Swedish VAT number derived from the organisation number (SE + 10 digits + 01). */
export function momsregNr(orgNumber) {
  if (!orgNumber) return null
  return 'SE' + orgNumber.replace(/[-\s]/g, '') + '01'
}

/** "50 000" — max deduction per person and year for the given ROT/RUT type. */
export function maxDeductionText(type) {
  const { maxPerPerson } = ROT_RUT_TYPES[type] ?? ROT_RUT_TYPES.rot
  return new Intl.NumberFormat('sv-SE').format(maxPerPerson)
}

// ── assets ───────────────────────────────────────────────────────────────────

/** Fetches an image as a data URL, or null if it can't be loaded (PDF then omits the logo). */
export async function loadImageAsDataUrl(url) {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

/** Natural size of an image data URL in px, or null if it fails to decode. */
export function measureImage(dataUrl) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
}

// ── footer ───────────────────────────────────────────────────────────────────

/** Draws the thank-you line and "Sida n av N" on every page. Call once, last. */
export function drawFooters(doc, font, text) {
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const footerY = pageH - 13
  const pages = doc.internal.getNumberOfPages()

  for (let page = 1; page <= pages; page++) {
    doc.setPage(page)
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.4)
    doc.line(MARGIN_X, footerY - 4, pageW - MARGIN_X, footerY - 4)

    doc.setFont(font, 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...SUBTLE)
    doc.setCharSpace(0)
    doc.text(text, MARGIN_X, footerY)
    doc.text(`Sida ${page} av ${pages}`, pageW - MARGIN_X, footerY, { align: 'right' })
  }
}
