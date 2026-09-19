// Registers a Unicode font (Open Sans) in a jsPDF document so that Swedish
// characters (å, ä, ö) render correctly. jsPDF's built-in Helvetica only covers
// WinAnsi, so without this åäö would be garbled.
//
// The font files ship with the app (via @fontsource) instead of being fetched
// from a CDN, so PDF export works offline and has no third-party dependency.
// `?url` makes Vite emit them as hashed assets that are only requested when a
// PDF is generated.

import normalUrl from '@fontsource/open-sans/files/open-sans-latin-400-normal.woff?url'
import boldUrl from '@fontsource/open-sans/files/open-sans-latin-700-normal.woff?url'

// Loaded once per session. `undefined` = not tried yet, `false` = failed.
let cached

async function fetchToBase64(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`)
  const bytes = new Uint8Array(await response.arrayBuffer())
  // Chunked to stay clear of the call-stack limit for spread arguments.
  const CHUNK = 8192
  let binary = ''
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

/**
 * Registers Open Sans (normal + bold) on the document and makes it active.
 * @param {import('jspdf').jsPDF} doc
 * @returns {Promise<string>} font family to use: 'OpenSans', or 'helvetica' if loading failed
 */
export async function applySwedishFont(doc) {
  if (cached === undefined) {
    try {
      const [normal, bold] = await Promise.all([fetchToBase64(normalUrl), fetchToBase64(boldUrl)])
      cached = { normal, bold }
    } catch {
      cached = false
    }
  }

  if (!cached) return 'helvetica'

  doc.addFileToVFS('OpenSans-Regular.woff', cached.normal)
  doc.addFont('OpenSans-Regular.woff', 'OpenSans', 'normal')
  doc.addFileToVFS('OpenSans-Bold.woff', cached.bold)
  doc.addFont('OpenSans-Bold.woff', 'OpenSans', 'bold')
  doc.setFont('OpenSans', 'normal')
  return 'OpenSans'
}

/**
 * Returns a text normaliser: identity when the Unicode font is active, or an
 * ASCII transliteration of å/ä/ö when falling back to Helvetica.
 * @param {string} fontName result of applySwedishFont()
 * @returns {(value: unknown) => string}
 */
export function safeText(fontName) {
  if (fontName !== 'helvetica') {
    return value => (value == null ? '' : String(value))
  }
  return value => {
    if (value == null) return ''
    return String(value)
      .replace(/ä/g, 'a').replace(/Ä/g, 'A')
      .replace(/å/g, 'a').replace(/Å/g, 'A')
      .replace(/ö/g, 'o').replace(/Ö/g, 'O')
  }
}
