import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Wrench, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'

export default function Signup() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Lösenorden matchar inte.'); return }
    if (password.length < 6) { setError('Lösenordet måste vara minst 6 tecken.'); return }
    setSubmitting(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message?.includes('already registered') ? 'E-postadressen har redan ett konto. Logga in i stället.' : 'Kunde inte skapa konto. Kontrollera uppgifterna och försök igen.')
      setSubmitting(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary mb-4">
            <Wrench className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Skapa konto</h1>
          <p className="text-sm text-gray-600 mt-1">Kom igång med Hantverksappen</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">E-post</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="din@epost.se"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Lösenord</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bekräfta lösenord</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="password"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-danger rounded-xl px-3 py-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark active:bg-primary-darker disabled:opacity-60 text-white font-semibold h-12 rounded-xl transition-all duration-200"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Skapar konto…' : 'Skapa konto'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-5">
          Har du redan ett konto?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Logga in här
          </Link>
        </p>
      </div>
    </div>
  )
}
