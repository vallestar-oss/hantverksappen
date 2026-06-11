import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Wrench, Mail, Lock, AlertCircle, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react'

export default function Login() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 'login' | 'reset' | 'reset-sent'
  const [mode, setMode] = useState('login')

  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Fel e-post eller lösenord. Försök igen.')
      setSubmitting(false)
    } else {
      navigate('/dashboard')
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    setSubmitting(false)
    if (error) {
      setError('Kunde inte skicka återställningslänken. Kontrollera e-postadressen.')
    } else {
      setMode('reset-sent')
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
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {mode === 'login' ? 'Välkommen tillbaka' : 'Återställ lösenord'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {mode === 'login'
              ? 'Logga in på Hantverksappen'
              : 'Vi skickar en återställningslänk till din e-post'}
          </p>
        </div>

        {mode === 'reset-sent' ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Länken är skickad</p>
              <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                Om <span className="font-medium text-gray-900">{email}</span> har ett konto
                hittar du en återställningslänk i inkorgen inom någon minut.
              </p>
            </div>
            <button
              onClick={() => { setMode('login'); setError('') }}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark transition-colors min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              Tillbaka till inloggning
            </button>
          </div>
        ) : (
          <form
            onSubmit={mode === 'login' ? handleSubmit : handleReset}
            className="bg-white rounded-xl border border-gray-200 p-8 space-y-5"
          >
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">E-post</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  placeholder="din@epost.se"
                />
              </div>
            </div>

            {mode === 'login' && (
              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Lösenord</label>
                  <button
                    type="button"
                    onClick={() => { setMode('reset'); setError('') }}
                    className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                  >
                    Glömt lösenord?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

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
              {mode === 'login'
                ? (submitting ? 'Loggar in…' : 'Logga in')
                : (submitting ? 'Skickar…' : 'Skicka återställningslänk')}
            </button>

            {mode === 'reset' && (
              <button
                type="button"
                onClick={() => { setMode('login'); setError('') }}
                className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" />
                Tillbaka till inloggning
              </button>
            )}
          </form>
        )}

        {mode === 'login' && (
          <p className="text-center text-sm text-gray-600 mt-5">
            Inget konto?{' '}
            <Link to="/signup" className="text-primary font-semibold hover:underline">
              Skapa ett här
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
