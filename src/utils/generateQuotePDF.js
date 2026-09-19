import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { applySwedishFont, safeText } from './pdfFont'
import { calcTotals, lineNet, rotRutLabel, VAT_RATES } from './calc'
import {
  BLACK, LABEL, BORDER, DARK, ALT, WHITE, MARGIN_X, FOOTER_RESERVE,
  formatMoney, formatPdfDate, momsregNr, maxDeductionText, loadImageAsDataUrl, measureImage, drawFooters,
} from './pdfCommon'

// ── main export ────────────────────────────────────────────────────────────
export async function generateQuotePDF(quote, quoteItems, customer, companyProfile) {
  const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()   // 210
  const pageH = doc.internal.pageSize.getHeight()  // 297
  const MX    = MARGIN_X
  const CW    = pageW - 2 * MX   // 174 mm
  const COL2X = MX + 108         // right-column x (~126 mm)

  const font = await applySwedishFont(doc)
  const t    = safeText(font)

  // Load logo
  let logoDataUrl = null
  if (companyProfile?.logo_url) {
    logoDataUrl = await loadImageAsDataUrl(companyProfile.logo_url.split('?')[0])
  }

  function label(size = 7) {
    doc.setFont(font, 'bold')
    doc.setFontSize(size)
    doc.setTextColor(...LABEL)
    doc.setCharSpace(0.7)
  }
  function body(bold = false, color = BLACK) {
    doc.setFont(font, bold ? 'bold' : 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...color)
    doc.setCharSpace(0)
  }

  // Starts a new page when fewer than `mm` millimetres remain above the footer.
  let curY = 0
  function ensureSpace(mm) {
    if (curY + mm > pageH - FOOTER_RESERVE) {
      doc.addPage()
      curY = MX
    }
  }

  // ── HEADER ─────────────────────────────────────────────────────────────────

  let leftY  = MX
  let rightY = MX

  // Logo top-left
  const logoSize = logoDataUrl ? await measureImage(logoDataUrl) : null
  if (logoSize) {
    const PX_TO_MM = 0.264583
    const logoH = Math.min(22, logoSize.height * PX_TO_MM)
    const logoW = Math.min(logoH * (logoSize.width / logoSize.height), 65)
    try {
      doc.addImage(logoDataUrl, 'AUTO', MX, leftY, logoW, logoH)
      leftY += logoH + 5
    } catch {
      // Unsupported image format (e.g. SVG): leave the logo out rather than fail the PDF.
    }
  }

  // Company name
  doc.setFont(font, 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...BLACK)
  doc.setCharSpace(0)
  doc.text(t(companyProfile?.company_name ?? ''), MX, leftY)
  leftY += 5.5

  // Company detail lines
  body(false, LABEL)
  const momsreg = momsregNr(companyProfile?.org_number)
  const companyLines = [
    companyProfile?.address,
    [companyProfile?.postal_code, companyProfile?.city].filter(Boolean).join(' '),
    companyProfile?.phone,
    companyProfile?.email,
    companyProfile?.org_number ? `Org.nr: ${companyProfile.org_number}` : null,
    companyProfile?.f_skatt ? 'F-skatt' : null,
    momsreg ? `Momsreg.nr: ${momsreg}` : null,
  ].filter(Boolean)
  for (const line of companyLines) {
    doc.text(t(line), MX, leftY)
    leftY += 4
  }

  // "OFFERT" — black, large, top-right
  doc.setFont(font, 'bold')
  doc.setFontSize(28)
  doc.setTextColor(...BLACK)
  doc.setCharSpace(1.5)
  doc.text('OFFERT', pageW - MX, rightY, { align: 'right' })
  doc.setCharSpace(0)
  rightY += 9

  // Quote number
  body(false, LABEL)
  doc.text(t(`Nr ${quote.quote_number ?? '—'}`), pageW - MX, rightY, { align: 'right' })
  rightY += 5

  // ROT/RUT indicator — plain text
  if (quote.rot_rut_enabled) {
    body(false, LABEL)
    doc.text(t(`${rotRutLabel(quote.rot_rut_type)}-avdrag`), pageW - MX, rightY, { align: 'right' })
    rightY += 5
  }

  // Divider
  const divY = Math.max(leftY, rightY) + 6
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.5)
  doc.line(MX, divY, pageW - MX, divY)
  curY = divY + 8

  // ── BUYER + DATES (two columns) ────────────────────────────────────────────

  let buyerY = curY
  let datesY = curY

  // Left: label
  label()
  doc.text('KUND', MX, buyerY)
  doc.setCharSpace(0)
  buyerY += 5

  // Left: Customer name
  doc.setFont(font, 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...BLACK)
  doc.text(t(customer?.name ?? '—'), MX, buyerY)
  buyerY += 5.5

  // Left: Customer address
  body(false, LABEL)
  const custLines = [
    customer?.address,
    [customer?.postal_code, customer?.city].filter(Boolean).join(' '),
    customer?.phone,
    customer?.email,
  ].filter(Boolean)
  for (const line of custLines) {
    doc.text(t(line), MX, buyerY)
    buyerY += 4.5
  }

  // Right: OFFERTDATUM
  label()
  doc.text('OFFERTDATUM', COL2X, datesY)
  doc.setCharSpace(0)
  datesY += 4.5
  body(false, BLACK)
  doc.text(t(formatPdfDate(quote.created_at)), COL2X, datesY)
  datesY += 7.5

  // Right: GILTIG TILL
  label()
  doc.text(t('GILTIG TILL'), COL2X, datesY)
  doc.setCharSpace(0)
  datesY += 4.5
  body(false, BLACK)
  doc.text(t(formatPdfDate(quote.valid_until)), COL2X, datesY)
  datesY += 5

  curY = Math.max(buyerY, datesY) + 9

  // ── LINE ITEMS TABLE ───────────────────────────────────────────────────────

  const rotRutEnabled = quote.rot_rut_enabled
  const tableRows = (quoteItems ?? []).map(item => [
    t(item.description) || '—',
    item.type === 'arbete' ? t('Arbete') : t('Material'),
    String(item.quantity ?? 0),
    item.unit ?? 'st',
    formatMoney(item.unit_price ?? 0),
    `${item.vat_rate ?? 25} %`,
    formatMoney(lineNet(item)),
  ])

  doc.setFont(font, 'normal')
  doc.setCharSpace(0)

  autoTable(doc, {
    startY: curY,
    margin: { left: MX, right: MX },
    head: [[
      t('Beskrivning'), t('Typ'), t('Antal'), t('Enhet'),
      t('À-pris'), t('Moms'), t('Summa'),
    ]],
    body: tableRows,
    styles: {
      font,
      fontSize: 8.5,
      cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
      textColor: BLACK,
      lineColor: BORDER,
      lineWidth: { top: 0, right: 0, bottom: 0.3, left: 0 },
    },
    headStyles: {
      font,
      fillColor: WHITE,
      textColor: BLACK,
      fontStyle: 'bold',
      fontSize: 8,
      lineColor: DARK,
      lineWidth: { top: 0, right: 0, bottom: 0.5, left: 0 },
    },
    alternateRowStyles: { fillColor: ALT },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 22, halign: 'center', textColor: LABEL },
      2: { cellWidth: 16, halign: 'right' },
      3: { cellWidth: 16, halign: 'center' },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 16, halign: 'center', textColor: LABEL },
      6: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
  })

  curY = doc.lastAutoTable.finalY + 10

  // ── SUMMARY ────────────────────────────────────────────────────────────────

  const { subtotal, labourInclVat, rotRutDeduction, vatByRate, totalInkMoms, toPay } =
    calcTotals(quoteItems, rotRutEnabled)
  const rrLabel = rotRutLabel(quote.rot_rut_type)

  ensureSpace(70)
  const sumX = MX + 92
  const sumW = pageW - MX - sumX   // ~82 mm

  function summaryRow(lbl, val, bold = false, lblColor = LABEL, valColor = BLACK) {
    doc.setFont(font, bold ? 'bold' : 'normal')
    doc.setFontSize(9)
    doc.setCharSpace(0)
    doc.setTextColor(...lblColor)
    doc.text(t(lbl), sumX, curY)
    doc.setTextColor(...valColor)
    doc.text(val, sumX + sumW, curY, { align: 'right' })
    curY += 5
  }

  function hRule(color = BORDER, w = 0.3) {
    doc.setDrawColor(...color)
    doc.setLineWidth(w)
    doc.line(sumX, curY - 1.5, sumX + sumW, curY - 1.5)
    curY += 1.5
  }

  summaryRow('Delsumma ex. moms', formatMoney(subtotal))

  hRule()

  for (const r of VAT_RATES.filter(rate => (vatByRate[rate] ?? 0) > 0)) {
    summaryRow(t(`Moms ${r} %`), formatMoney(vatByRate[r]))
  }

  hRule()
  summaryRow('Totalt ink. moms', formatMoney(totalInkMoms), true, BLACK, BLACK)

  if (rotRutEnabled && rotRutDeduction > 0) {
    summaryRow(t(`${rrLabel}-avdrag (30 % av arbete)`), `- ${formatMoney(rotRutDeduction)}`)
  }

  // "Offertpris" — bold, no fill
  curY += 3
  hRule(BLACK, 0.5)
  curY += 1

  const toPayLabel = rotRutEnabled
    ? t('Offertpris efter ROT/RUT')
    : t('Offertpris')
  doc.setFont(font, 'bold')
  doc.setFontSize(10.5)
  doc.setCharSpace(0)
  doc.setTextColor(...BLACK)
  doc.text(toPayLabel, sumX, curY + 5)
  doc.text(formatMoney(toPay), sumX + sumW, curY + 5, { align: 'right' })
  curY += 14

  // Notes
  if (quote.notes) {
    ensureSpace(20)
    label()
    doc.text('ANTECKNINGAR', MX, curY)
    doc.setCharSpace(0)
    curY += 5
    body(false, LABEL)
    const noteLines = doc.splitTextToSize(t(quote.notes), CW)
    doc.text(noteLines, MX, curY)
    curY += noteLines.length * 4.5 + 6
  }

  // ── ROT/RUT INFORMATION ────────────────────────────────────────────────────

  if (rotRutEnabled) {
    ensureSpace(55)
    curY += 2
    doc.setDrawColor(...BORDER)
    doc.setLineWidth(0.5)
    doc.line(MX, curY, pageW - MX, curY)
    curY += 6

    label()
    doc.text(t(`${rrLabel}-INFORMATION`), MX, curY)
    doc.setCharSpace(0)
    curY += 5.5

    const maxAmount = maxDeductionText(quote.rot_rut_type)
    const rrText = t(
      `Offerten inkluderar ${rrLabel}-avdrag. Kunden betalar reducerat belopp och ` +
      `hantverkaren ansöker om utbetalning från Skatteverket för mellanskillnaden. ` +
      `Maxbelopp: ${maxAmount} kr per person och år.`
    )
    body(false, LABEL)
    const rrLines = doc.splitTextToSize(rrText, CW)
    doc.text(rrLines, MX, curY)
    curY += rrLines.length * 4.5 + 5

    doc.setFont(font, 'normal')
    doc.setCharSpace(0)

    autoTable(doc, {
      startY: curY,
      margin: { left: MX, right: MX },
      body: [
        [t('Arbetskostnad inkl. moms'), formatMoney(labourInclVat)],
        [t(`Skattereduktion 30 % (${rrLabel})`), `- ${formatMoney(rotRutDeduction)}`],
        [t('Kundens andel att betala'), formatMoney(toPay)],
      ],
      styles: {
        font,
        fontSize: 8.5,
        cellPadding: { top: 2.5, bottom: 2.5, left: 4, right: 4 },
        textColor: BLACK,
        lineColor: BORDER,
        lineWidth: { top: 0, right: 0, bottom: 0.3, left: 0 },
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 42, halign: 'right', fontStyle: 'bold' },
      },
    })

    curY = doc.lastAutoTable.finalY + 8
  }

  // ── FOOTER ─────────────────────────────────────────────────────────────────

  drawFooters(doc, font, t('Tack för ditt förtroende!'))

  // ── SAVE ───────────────────────────────────────────────────────────────────

  doc.save(`Offert-${quote.quote_number ?? quote.id}.pdf`)
  return doc
}
