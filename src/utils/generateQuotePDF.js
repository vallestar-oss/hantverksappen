import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// ── constants ──────────────────────────────────────────────────────────────

const PRIMARY       = [37, 99, 235]        // #2563EB
const PRIMARY_LIGHT = [219, 234, 254]      // blue-100
const SUCCESS       = [22, 163, 74]        // #16A34A
const TEXT_DARK     = [17, 24, 39]         // gray-900
const TEXT_MID      = [107, 114, 128]      // gray-500
const TEXT_LIGHT    = [156, 163, 175]      // gray-400
const BG_LIGHT      = [249, 250, 251]      // gray-50
const BORDER        = [229, 231, 235]      // gray-200
const AMBER_LIGHT   = [254, 243, 199]      // amber-100

// ── helpers ────────────────────────────────────────────────────────────────

/**
 * Replace Swedish characters that fall outside jsPDF's built-in Helvetica
 * Latin-1 subset with their closest ASCII equivalents.
 */
function sanitizeText(str) {
  if (str == null) return ''
  return String(str)
    .replace(/ä/g, 'a').replace(/Ä/g, 'A')
    .replace(/å/g, 'a').replace(/Å/g, 'A')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
}

function formatSEK(n) {
  return new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 2 }).format(n ?? 0) + ' kr'
}

function formatDate(iso) {
  if (!iso) return '-'
  return new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
}

function calcTotals(quoteItems, rotRutEnabled) {
  const items = quoteItems ?? []
  const subtotal = items.reduce((s, r) => s + (r.quantity ?? 0) * (r.unit_price ?? 0), 0)
  const labourSubtotal = items
    .filter(r => r.type === 'arbete')
    .reduce((s, r) => s + (r.quantity ?? 0) * (r.unit_price ?? 0), 0)
  const rotRutDeduction = rotRutEnabled ? labourSubtotal * 0.3 : 0
  const vatByRate = {}
  for (const r of items) {
    const net = (r.quantity ?? 0) * (r.unit_price ?? 0)
    vatByRate[r.vat_rate] = (vatByRate[r.vat_rate] ?? 0) + net * ((r.vat_rate ?? 25) / 100)
  }
  const totalVat = Object.values(vatByRate).reduce((s, v) => s + v, 0)
  const totalInkMoms = subtotal + totalVat
  const toPay = totalInkMoms - rotRutDeduction
  return { subtotal, labourSubtotal, rotRutDeduction, vatByRate, totalVat, totalInkMoms, toPay }
}

async function loadImageAsDataUrl(url) {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

// ── main export ────────────────────────────────────────────────────────────

export async function generateQuotePDF(quote, quoteItems, customer, companyProfile) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()   // 210
  const pageH = doc.internal.pageSize.getHeight()  // 297
  const margin = 15

  // Load logo if present
  let logoDataUrl = null
  const logoUrl = companyProfile?.logo_url?.split('?')[0]
  if (logoUrl) logoDataUrl = await loadImageAsDataUrl(logoUrl)

  // ── PAGE HEADER ────────────────────────────────────────────────────────────

  let leftY = margin

  // Logo
  if (logoDataUrl) {
    try {
      const img = new Image()
      img.src = logoDataUrl
      await new Promise(r => { img.onload = r; img.onerror = r })
      const maxH = 25
      const ratio = img.naturalWidth / img.naturalHeight
      const logoH = Math.min(maxH, img.naturalHeight * 0.264583)
      const logoW = logoH * ratio
      doc.addImage(logoDataUrl, 'AUTO', margin, leftY, logoW, logoH)
      leftY += logoH + 4
    } catch { /* ignore */ }
  }

  // Company name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...TEXT_DARK)
  doc.text(sanitizeText(companyProfile?.company_name), margin, leftY)
  leftY += 6

  // Company address lines
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...TEXT_MID)

  const companyLines = [
    companyProfile?.address,
    [companyProfile?.postal_code, companyProfile?.city].filter(Boolean).join(' '),
    companyProfile?.phone,
    companyProfile?.email,
    [
      companyProfile?.org_number ? `Org.nr: ${companyProfile.org_number}` : null,
      companyProfile?.f_skatt ? 'Innehar F-skattsedel' : null,
    ].filter(Boolean).join(' | '),
  ].filter(Boolean)

  for (const line of companyLines) {
    doc.text(sanitizeText(line), margin, leftY)
    leftY += 4.5
  }

  // ── RIGHT COLUMN: OFFERT heading ───────────────────────────────────────────

  let rightY = margin

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(...PRIMARY)
  doc.text('OFFERT', pageW - margin, rightY, { align: 'right' })
  rightY += 10

  // Quote number
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...TEXT_DARK)
  doc.text(`Nr: ${quote.quote_number ?? '-'}`, pageW - margin, rightY, { align: 'right' })
  rightY += 5.5

  // Dates
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...TEXT_MID)
  doc.text(sanitizeText(`Datum: ${formatDate(quote.created_at)}`), pageW - margin, rightY, { align: 'right' })
  rightY += 4.5
  doc.text(sanitizeText(`Giltig till: ${formatDate(quote.valid_until)}`), pageW - margin, rightY, { align: 'right' })
  rightY += 5

  // ROT/RUT badge
  if (quote.rot_rut_enabled) {
    const badgeLabel = (quote.rot_rut_type ?? 'rot').toUpperCase() + '-avdrag'
    const badgeW = doc.getTextWidth(sanitizeText(badgeLabel)) + 6
    const badgeX = pageW - margin - badgeW
    doc.setFillColor(...SUCCESS)
    doc.roundedRect(badgeX, rightY - 4, badgeW, 6, 1, 1, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text(sanitizeText(badgeLabel), badgeX + 3, rightY)
    rightY += 7
  }

  // Divider
  const dividerY = Math.max(leftY, rightY) + 4
  doc.setDrawColor(...PRIMARY_LIGHT)
  doc.setLineWidth(0.5)
  doc.line(margin, dividerY, pageW - margin, dividerY)

  let curY = dividerY + 7

  // ── CUSTOMER SECTION ───────────────────────────────────────────────────────

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...TEXT_LIGHT)
  doc.text('KUND', margin, curY)
  curY += 5

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...TEXT_DARK)
  doc.text(sanitizeText(customer?.name), margin, curY)
  curY += 5.5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...TEXT_MID)

  const customerLines = [
    customer?.address,
    [customer?.postal_code, customer?.city].filter(Boolean).join(' '),
    customer?.phone,
    customer?.email,
  ].filter(Boolean)

  for (const line of customerLines) {
    doc.text(sanitizeText(line), margin, curY)
    curY += 4.5
  }

  curY += 5

  // ── LINE ITEMS TABLE ───────────────────────────────────────────────────────

  const tableRows = (quoteItems ?? []).map(item => [
    sanitizeText(item.description) || '-',
    item.type === 'arbete' ? 'Arbete' : 'Material',
    String(item.quantity ?? 0),
    item.unit ?? 'st',
    formatSEK(item.unit_price ?? 0),
    `${item.vat_rate ?? 25}%`,
    formatSEK((item.quantity ?? 0) * (item.unit_price ?? 0)),
  ])

  autoTable(doc, {
    startY: curY,
    margin: { left: margin, right: margin },
    head: [['Beskrivning', 'Typ', 'Antal', 'Enhet', 'A-pris', 'Moms', 'Summa']],
    body: tableRows,
    styles: {
      fontSize: 9,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
      textColor: TEXT_DARK,
      lineColor: BORDER,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: PRIMARY,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    alternateRowStyles: { fillColor: BG_LIGHT },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 24, halign: 'center' },
      2: { cellWidth: 18, halign: 'right' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
    willDrawCell(data) {
      if (quote.rot_rut_enabled && data.section === 'body') {
        const typeCell = data.row.cells[1]
        if (typeCell?.text?.[0] === 'Arbete') {
          doc.setFillColor(...AMBER_LIGHT)
        }
      }
    },
    didDrawCell(data) {
      if (data.section === 'body' && data.column.index === 1) {
        const val = data.cell.text[0]
        doc.setTextColor(...(val === 'Arbete' ? PRIMARY : TEXT_MID))
      }
    },
  })

  curY = doc.lastAutoTable.finalY + 8

  // ── SUMMARY ────────────────────────────────────────────────────────────────

  const { subtotal, rotRutDeduction, vatByRate, totalInkMoms, toPay } = calcTotals(
    quoteItems,
    quote.rot_rut_enabled
  )

  const summaryX = pageW / 2 + 10
  const summaryW = pageW - margin - summaryX

  function summaryLine(label, value, opts = {}) {
    const { bold = false, color = TEXT_MID, valueColor = TEXT_DARK } = opts
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...color)
    doc.text(sanitizeText(label), summaryX, curY)
    doc.setTextColor(...valueColor)
    doc.text(sanitizeText(value), summaryX + summaryW, curY, { align: 'right' })
    curY += 5
  }

  summaryLine('Delsumma ex. moms', formatSEK(subtotal))

  if (quote.rot_rut_enabled && rotRutDeduction > 0) {
    const label = `${(quote.rot_rut_type ?? 'rot').toUpperCase()}-avdrag (30% arbete)`
    summaryLine(label, `- ${formatSEK(rotRutDeduction)}`, { color: SUCCESS, valueColor: SUCCESS, bold: true })
  }

  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.2)
  doc.line(summaryX, curY - 1, summaryX + summaryW, curY - 1)
  curY += 1

  const usedRates = [25, 12, 6].filter(r => (vatByRate[r] ?? 0) > 0)
  for (const r of usedRates) {
    summaryLine(`Moms ${r}%`, formatSEK(vatByRate[r]))
  }

  doc.line(summaryX, curY - 1, summaryX + summaryW, curY - 1)
  curY += 1
  summaryLine('Totalt ink. moms', formatSEK(totalInkMoms), { bold: true, color: TEXT_DARK })

  curY += 2

  // "Att betala" prominent row
  const toPayLabel = sanitizeText(quote.rot_rut_enabled ? 'Att betala efter ROT/RUT' : 'Att betala')
  doc.setFillColor(...PRIMARY_LIGHT)
  doc.roundedRect(summaryX - 3, curY - 4.5, summaryW + 3, 9, 1, 1, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...PRIMARY)
  doc.text(toPayLabel, summaryX, curY)
  doc.text(formatSEK(toPay), summaryX + summaryW, curY, { align: 'right' })
  curY += 10

  // Notes
  if (quote.notes) {
    curY += 2
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...TEXT_LIGHT)
    doc.text('ANTECKNINGAR', margin, curY)
    curY += 4.5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...TEXT_MID)
    const noteLines = doc.splitTextToSize(sanitizeText(quote.notes), pageW - 2 * margin)
    doc.text(noteLines, margin, curY)
    curY += noteLines.length * 4.5 + 4
  }

  // ── FOOTER ─────────────────────────────────────────────────────────────────

  const footerY = pageH - 18
  doc.setDrawColor(...PRIMARY_LIGHT)
  doc.setLineWidth(0.4)
  doc.line(margin, footerY - 3, pageW - margin, footerY - 3)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...TEXT_LIGHT)

  const footerLeft = sanitizeText([
    'Betalningsvillkor: 30 dagar netto',
    companyProfile?.bankgiro ? `Bankgiro: ${companyProfile.bankgiro}` : null,
    'Tack for ditt fortroende!',
  ].filter(Boolean).join('   .   '))

  doc.text(footerLeft, margin, footerY)

  const pageCount = doc.internal.getNumberOfPages()
  doc.text(`Sida 1 av ${pageCount}`, pageW - margin, footerY, { align: 'right' })

  // ── SAVE ───────────────────────────────────────────────────────────────────

  const filename = `Offert-${quote.quote_number ?? quote.id}.pdf`
  doc.save(filename)
  return doc
}
