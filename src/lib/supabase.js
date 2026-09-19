import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** False when `.env` is missing — the app then shows a setup notice instead of crashing. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// createClient throws on an empty URL, so fall back to inert placeholders.
export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseAnonKey || 'missing-anon-key',
)
