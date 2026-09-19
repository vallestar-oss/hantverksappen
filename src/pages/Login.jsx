import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { Mail, Lock, CheckCircle, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { AuthLayout, IconField, AuthSubmit, PageLoader } from '../components/AuthLayout'
import { FormError } from '../components/FormField'

export default function Login() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 'login' | 'reset' | 'reset-sent'
  const [mode, setMode] = useState('login')

  if (loading) return <PageLoader />
  if (user) return <Navigate to="/dashboard" replace />

  function switchMode(next) {
    setMode(next)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
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
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setSubmitting(false)
    if (resetError) setError('Kunde inte skicka återställningslänken. Kontrollera e-postadressen.')
    else setMode('reset-sent')
  }

  const title = mode === 'login' ? 'Välkommen tillbaka' : 'Återställ lösenord'
  const subtitle = mode === 'login'
    ? 'Logga in på Hantverksappen'
    : 'Vi skickar en återställningslänk till din e-post'

  return (
    <AuthLayout
      title={title}
      subtitle={subtitle}
      footer={mode === 'login' && (
        <>
          Inget konto?{' '}
          <Link to="/signup" className="text-primary font-semibold hover:underline">Skapa ett här</Link>
        </>
      )}
    >
      {mode === 'reset-sent' ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50">
            <CheckCircle className="w-6 h-6 text-success" aria-hidden="true" />
          </div>
          <div role="status">
            <p className="font-semibold text-gray-900">Länken är skickad</p>
            <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
              Om <span className="font-medium text-gray-900">{email}</span> har ett konto
              hittar du en återställningslänk i inkorgen inom någon minut.
            </p>
          </div>
          <button
            type="button"
            onClick={() => switchMode('login')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Tillbaka till inloggning
          </button>
        </div>
      ) : (
        <form
          onSubmit={mode === 'login' ? handleSubmit : handleReset}
          className="bg-white rounded-xl border border-gray-200 p-8 space-y-5"
        >
          <IconField
            label="E-post"
            icon={Mail}
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="din@epost.se"
          />

          {mode === 'login' && (
            <IconField
              label="Lösenord"
              icon={Lock}
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              aside={(
                <button
                  type="button"
                  onClick={() => switchMode('reset')}
                  className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                >
                  Glömt lösenord?
                </button>
              )}
            />
          )}

          <FormError>{error}</FormError>

          <AuthSubmit
            busy={submitting}
            busyLabel={mode === 'login' ? 'Loggar in…' : 'Skickar…'}
          >
            {mode === 'login' ? 'Logga in' : 'Skicka återställningslänk'}
          </AuthSubmit>

          {mode === 'reset' && (
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Tillbaka till inloggning
            </button>
          )}
        </form>
      )}
    </AuthLayout>
  )
}
