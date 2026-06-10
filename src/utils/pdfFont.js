/**
 * pdfFont.js
 *
 * Loads a Unicode-compatible font (Open Sans) into a jsPDF document so that
 * Swedish characters (å, ä, ö, Å, Ä, Ö) render correctly in generated PDFs.
 *
 * The font is fetched once from jsDelivr CDN and cached in memory for the
 * session. If the network request fails, the function returns 'helvetica'
 * so callers can fall back to the ASCII-sanitized text behaviour.
 *
 * Usage:
 *   import { applySwedishFont, safeText } from './pdfFont'
 *
 *   const fontName = await applySwedishFont(doc)
 *   const t = safeText(fontName)    // passthrough when proper font loaded
 *   doc.setFont(fontName, 'bold')
 *   doc.text(t('Förfallodatum'), x, y)
 */

// Pinned CDN URLs for Open Sans v4 — includes woff (WOFF1) which jsPDF supports
const CDN_NORMAL = 'https://cdn.jsdelivr.net/npm/@fontsource/open-sans@4.5.14/files/open-sans-latin-400-normal.woff'
const CDN_BOLD   = 'https://cdn.jsdelivr.net/npm/@fontsource/open-sans@4.5.14/files/open-sans-latin-700-normal.woff'

// In-memory cache so we only fetch once per session
let _cached = null  // null = not tried, false = failed, { normal, bold } = success

async function fetchToBase64(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`)
  const buf = await res.arrayBuffer()
  const bytes = new Uint8Array(buf)
  // btoa with chunk strategy to avoid call-stack overflow on large fonts
  let binary = ''
  const CHUNK = 8192
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

/**
 * Registers Open Sans (normal + bold) in the given jsPDF document instance
 * and sets the active font.
 *
 * @param {import('jspdf').jsPDF} doc
 * @returns {Promise<string>}  Font family name to use: 'OpenSans' or 'helvetica'
 */
export async function applySwedishFont(doc) {
  // First call: attempt to load font data
  if (_cached === null) {
    try {
      const [normal, bold] = await Promise.all([
        fetchToBase64(CDN_NORMAL),
        fetchToBase64(CDN_BOLD),
      ])
      _cached = { normal, bold }
    } catch (err) {
      console.warn('[pdfFont] Could not load Swedish font, falling back to Helvetica:', err)
      _cached = false
    }
  }

  if (!_cached) return 'helvetica'

  // Register font in this doc instance
  doc.addFileToVFS('OpenSans-Regular.woff', _cached.normal)
  doc.addFont('OpenSans-Regular.woff', 'OpenSans', 'normal')
  doc.addFileToVFS('OpenSans-Bold.woff', _cached.bold)
  doc.addFont('OpenSans-Bold.woff', 'OpenSans', 'bold')
  doc.setFont('OpenSans', 'normal')
  return 'OpenSans'
}

/**
 * Returns a text normaliser function.
 * - When a proper Unicode font is active: returns the string as-is.
 * - When falling back to Helvetica: replaces Swedish chars with ASCII.
 *
 * @param {string} fontName  Result of applySwedishFont()
 * @returns {(str: any) => string}
 */
export function safeText(fontName) {
  if (fontName !== 'helvetica') {
    return str => (str == null ? '' : String(str))
  }
  // Helvetica fallback: replace characters outside Latin-1 subset
  return str => {
    if (str == null) return ''
    return String(str)
      .replace(/ä/g, 'a').replace(/Ä/g, 'A')
      .replace(/å/g, 'a').replace(/Å/g, 'A')
      .replace(/ö/g, 'o').replace(/Ö/g, 'O')
  }
}
