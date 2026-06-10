import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// ── constants ──────────────────────────────────────────────────────────────

const PRIMARY       = [37, 99, 235]        // #2563EB
const PRIMARY_LIGHT = [219, 234, 254]      // blue-100
const SUCCESS       = [22, 163, 74]        // #16A34A
const SUCCESS_LIGHT = [220, 252, 231]      // green-100
const DANGER        = [220, 38, 38]        // #DC2626
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
  return new Intl.DateTimeFormat('sv-SE', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(iso))
}

function todayISO() { return new Date().toISOString().slice(0, 10) }

function isOverdue(invoice) {
  return invoice.status === 'obetald' && invoice.due_date && invoice.due_date < todayISO()
}

async function loadImageAsDataUrl(url) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
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

function calcTotals(items, rotRutEnabled) {
  const list = items ?? []
  const subtotal = list.reduce((s, r) => s + (r.quantity ?? 0) * (r.unit_price ?? 0), 0)
  const labourSubtotal = list
    .filter(r => r.type === 'arbete')
    .reduce((s, r) => s + (r.quantity ?? 0) * (r.unit_price ?? 0), 0)
  const rotRutDeduction = rotRutEnabled ? labourSubtotal * 0.3 : 0
  const vatByRate = {}
  for (const r of list) {
    const net = (r.quantity ?? 0) * (r.unit_price ?? 0)
    vatByRate[r.vat_rate] = (vatByRate[r.vat_rate] ?? 0) + net * ((r.vat_rate ?? 25) / 100)
  }
  const totalVat = Object.values(vatByRate).reduce((s, v) => s + v, 0)
  const totalInkMoms = subtotal + totalVat
  const toPay = totalInkMoms - rotRutDeduction
  return { subtotal, labourSubtotal, rotRutDeduction, vatByRate, totalVat, totalInkMoms, toPay }
}

// ── main export ────────────────────────────────────────────────────────────

export async function generateInvoicePDF(invoice, invoiceItems, customer, companyProfile) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()   // 210
  const pageH = doc.internal.pageSize.getHeight()  // 297
  const margin = 15
  const contentW = pageW - 2 * margin

  // Load logo
  let logoDataUrl = null
  const logoUrl = companyProfile?.logo_url?.split('?')[0]
  if (logoUrl) logoDataUrl = await loadImageAsDataUrl(logoUrl)

  // ── PAGE HEADER ────────────────────────────────────────────────────────────

  let leftY = margin
  let rightY = margin

  // Logo (left column)
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

  // Company detail lines
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

  // "FAKTURA" heading (right column)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(30)
  doc.setTextColor(...PRIMARY)
  doc.text('FAKTURA', pageW - margin, rightY, { align: 'right' })
  rightY += 11

  // Invoice number
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...TEXT_DARK)
  doc.text(`Nr: ${invoice.invoice_number ?? '-'}`, pageW - margin, rightY, { align: 'right' })
  rightY += 5.5

  // Fakturadatum
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...TEXT_MID)
  doc.text(sanitizeText(`Fakturadatum: ${formatDate(invoice.invoice_date)}`), pageW - margin, rightY, { align: 'right' })
  rightY += 4.5

  // Forfallodatum — red if overdue
  const overdue = isOverdue(invoice)
  doc.setFont('helvetica', overdue ? 'bold' : 'normal')
  doc.setTextColor(...(overdue ? DANGER : TEXT_MID))
  doc.text(
    sanitizeText(`Forfallodatum: ${formatDate(invoice.due_date)}${overdue ? ' (FORFALLIT)' : ''}`),
    pageW - margin, rightY, { align: 'right' }
  )
  rightY += 5

  // ROT/RUT badge
  if (invoice.rot_rut_enabled) {
    const badgeLabel = sanitizeText((invoice.rot_rut_type ?? 'rot').toUpperCase() + '-avdrag')
    const badgeW = doc.getTextWidth(badgeLabel) + 6
    const badgeX = pageW - margin - badgeW
    doc.setFillColor(...SUCCESS)
    doc.roundedRect(badgeX, rightY - 4, badgeW, 6, 1, 1, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text(badgeLabel, badgeX + 3, rightY)
    rightY += 7
  }

  // Status badge if paid
  if (invoice.status === 'betald') {
    const badgeW = doc.getTextWidth('BETALD') + 6
    const badgeX = pageW - margin - badgeW
    doc.setFillColor(...SUCCESS)
    doc.roundedRect(badgeX, rightY - 4, badgeW, 6, 1, 1, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text('BETALD', badgeX + 3, rightY)
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
  doc.text('FAKTURERAS TILL:', margin, curY)
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

  curY += 6

  // ── LINE ITEMS TABLE ───────────────────────────────────────────────────────

  const tableRows = (invoiceItems ?? []).map(item => [
    sanitizeText(item.description) || '-',
    item.type === 'arbete' ? 'Arbete' : 'Material',
    String(item.quantity ?? 0),
    item.unit ?? 'st',
    formatSEK(item.unit_price ?? 0),
    `${item.vat_rate ?? 25}%`,
    formatSEK((item.quantity ?? 0) * (item.unit_price ?? 0)),
  ])

  const rotRutEnabled = invoice.rot_rut_enabled

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
      if (rotRutEnabled && data.section === 'body') {
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

  // ── SUMMARY (right-aligned) ────────────────────────────────────────────────

  const { subtotal, labourSubtotal, rotRutDeduction, vatByRate, totalInkMoms, toPay } =
    calcTotals(invoiceItems, rotRutEnabled)

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

  if (rotRutEnabled && rotRutDeduction > 0) {
    const rrLabel = `${(invoice.rot_rut_type ?? 'rot').toUpperCase()}-avdrag (30% arbete)`
    summaryLine(rrLabel, `- ${formatSEK(rotRutDeduction)}`, { color: SUCCESS, valueColor: SUCCESS, bold: true })
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

  // "Att betala" highlight box
  const toPayLabel = sanitizeText(rotRutEnabled ? 'Att betala efter ROT/RUT' : 'Att betala')
  doc.setFillColor(...PRIMARY_LIGHT)
  doc.roundedRect(summaryX - 3, curY - 4.5, summaryW + 3, 9, 1, 1, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...PRIMARY)
  doc.text(toPayLabel, summaryX, curY)
  doc.text(formatSEK(toPay), summaryX + summaryW, curY, { align: 'right' })
  curY += 12

  // Notes
  if (invoice.notes) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...TEXT_LIGHT)
    doc.text('ANTECKNINGAR', margin, curY)
    curY += 4.5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...TEXT_MID)
    const noteLines = doc.splitTextToSize(sanitizeText(invoice.notes), contentW)
    doc.text(noteLines, margin, curY)
    curY += noteLines.length * 4.5 + 6
  }

  // ── PAYMENT INFORMATION ────────────────────────────────────────────────────

  const payBoxY = curY
  curY += 5

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...TEXT_DARK)
  doc.text('Betalningsinformation', margin + 3, curY)
  curY += 5.5

  const halfW = (contentW - 6) / 2
  const col2PayX = margin + 3 + halfW + 8

  function payRow(label, value, x, bold = false) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...TEXT_LIGHT)
    doc.text(sanitizeText(label), x, curY)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...TEXT_DARK)
    doc.text(sanitizeText(value), x, curY + 4)
  }

  const hasBankgiro = !!companyProfile?.bankgiro
  const hasSwish = !!companyProfile?.swish

  if (hasBankgiro) payRow('Bankgiro', companyProfile.bankgiro, margin + 3, true)
  if (hasSwish) payRow('Swish', companyProfile.swish, hasBankgiro ? col2PayX : margin + 3, true)
  if (hasBankgiro || hasSwish) curY += 10

  payRow('OCR / Referens', invoice.invoice_number ?? '-', margin + 3, true)
  payRow('Forfallodatum', formatDate(invoice.due_date), col2PayX, overdue)
  curY += 10

  payRow('Betalningsvillkor', '30 dagar netto', margin + 3)
  if (invoice.status === 'betald' && invoice.paid_date) {
    payRow('Betald', formatDate(invoice.paid_date), col2PayX)
  }
  curY += 10

  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.3)
  doc.roundedRect(margin, payBoxY, contentW, curY - payBoxY + 2, 2, 2, 'S')
  curY += 6

  // ── ROT/RUT INFORMATION ────────────────────────────────────────────────────

  if (rotRutEnabled) {
    const rrType = (invoice.rot_rut_type ?? 'rot').toUpperCase()
    const rrBoxY = curY
    curY += 5

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...TEXT_DARK)
    doc.text(`${rrType}-information`, margin + 3, curY)
    curY += 5.5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...TEXT_MID)

    const maxAmount = invoice.rot_rut_type === 'rut' ? '75 000' : '50 000'
    const rrExplain = doc.splitTextToSize(
      `Kunden betalar reducerat belopp enligt reglerna for ${rrType}-avdrag. ` +
      `Hantverkaren ansoker om utbetalning fran Skatteverket for mellanskillnaden. ` +
      `Maxbelopp: ${maxAmount} kr per person och ar.`,
      contentW - 6
    )
    doc.text(rrExplain, margin + 3, curY)
    curY += rrExplain.length * 4.2 + 4

    const workcostExVat = labourSubtotal
    const reduction = workcostExVat * 0.3
    const customerShare = totalInkMoms - reduction

    autoTable(doc, {
      startY: curY,
      margin: { left: margin + 3, right: margin + 3 },
      body: [
        ['Arbetskostnad ex. moms', formatSEK(workcostExVat)],
        [`Skattereduktion 30% (${rrType})`, `- ${formatSEK(reduction)}`],
        ['Kundens andel att betala', formatSEK(customerShare)],
      ],
      styles: {
        fontSize: 8.5,
        cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 },
        textColor: TEXT_DARK,
        lineColor: BORDER,
        lineWidth: 0.1,
      },
      alternateRowStyles: { fillColor: SUCCESS_LIGHT },
      columnStyles: {
        0: { cellWidth: 'auto', fontStyle: 'normal' },
        1: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
      },
      didDrawCell(data) {
        if (data.section === 'body' && data.row.index === 2) {
          doc.setTextColor(...PRIMARY)
        }
      },
    })

    curY = doc.lastAutoTable.finalY + 6

    doc.setDrawColor(...SUCCESS)
    doc.setLineWidth(0.3)
    doc.roundedRect(margin, rrBoxY, contentW, curY - rrBoxY + 2, 2, 2, 'S')
    curY += 6
  }

  // ── FOOTER ─────────────────────────────────────────────────────────────────

  const footerY = pageH - 14
  doc.setDrawColor(...PRIMARY_LIGHT)
  doc.setLineWidth(0.4)
  doc.line(margin, footerY - 3, pageW - margin, footerY - 3)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...TEXT_LIGHT)
  doc.text('Tack for ditt fortroende!', margin, footerY)

  const pageCount = doc.internal.getNumberOfPages()
  doc.text(`Sida 1 av ${pageCount}`, pageW - margin, footerY, { align: 'right' })

  // ── SAVE ───────────────────────────────────────────────────────────────────

  const filename = `Faktura-${invoice.invoice_number ?? invoice.id}.pdf`
  doc.save(filename)
  return doc
}
