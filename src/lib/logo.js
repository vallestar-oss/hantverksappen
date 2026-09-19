import { supabase } from './supabase'

const BUCKET = 'logos'
const MAX_BYTES = 2 * 1024 * 1024

// jsPDF can embed PNG and JPEG; other formats (e.g. SVG) would be dropped from PDFs.
const ALLOWED_TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg' }

/**
 * Uploads the company logo to storage and returns a cache-busted public URL.
 * @returns {Promise<{ url: string|null, error: string|null }>} `error` is a Swedish, user-facing message
 */
export async function uploadLogo(userId, file) {
  const extension = ALLOWED_TYPES[file.type]
  if (!extension) return { url: null, error: 'Logotypen måste vara en PNG- eller JPG-bild.' }
  if (file.size > MAX_BYTES) return { url: null, error: 'Logotypen får vara högst 2 MB.' }

  const path = `${userId}/logo.${extension}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
  if (error) return { url: null, error: 'Kunde inte ladda upp logotypen. Försök igen.' }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: `${data.publicUrl}?t=${Date.now()}`, error: null }
}

/** Strips the cache-busting query string before the URL is stored. */
export function storableLogoUrl(url) {
  return url ? url.split('?')[0] : null
}
