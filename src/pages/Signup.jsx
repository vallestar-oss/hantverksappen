import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { Mail, Lock, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { AuthLayout, IconField, AuthSubmit, PageLoader } from '../components/AuthLayout'
import { FormError } from '../components/FormField'

const MIN_PASSWORD_LENGTH = 6

export default function Signup() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  if (loading) return <PageLoader />
  if (user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Lösenorden matchar inte.'); return }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Lösenordet måste vara minst ${MIN_PASSWORD_LENGTH} tecken.`)
      return
    }

    setSubmitting(true)
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError) {
      setError(
        signUpError.message?.includes('already registered')
          ? 'E-postadressen har redan ett konto. Logga in i stället.'
          : 'Kunde inte skapa konto. Kontrollera uppgifterna och försök igen.',
      )
      setSubmitting(false)
    } else if (data.session) {
      navigate('/dashboard')
    } else {
      // The project requires e-mail confirmation: there is no session until the link is clicked.
      setNeedsConfirmation(true)
      setSubmitting(false)
    }
  }

  if (needsConfirmation) {
    return (
      <AuthLayout title="Kolla din e-post" subtitle="Ett steg kvar">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50">
            <CheckCircle className="w-6 h-6 text-success" aria-hidden="true" />
          </div>
          <p role="status" className="text-sm text-gray-600 leading-relaxed">
            Vi har skickat en bekräftelselänk till{' '}
            <span className="font-medium text-gray-900">{email}</span>. Klicka på länken och logga sedan in.
          </p>
          <Link to="/login" className="inline-block text-sm font-semibold text-primary hover:underline min-h-[44px] leading-[44px]">
            Till inloggningen
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Skapa konto"
      subtitle="Kom igång med Hantverksappen"
      footer={(
        <>
          Har du redan ett konto?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">Logga in här</Link>
        </>
      )}
    >
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8 space-y-5">
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
        <IconField
          label="Lösenord"
          icon={Lock}
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        <IconField
          label="Bekräfta lösenord"
          icon={Lock}
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="••••••••"
        />

        <FormError>{error}</FormError>

        <AuthSubmit busy={submitting} busyLabel="Skapar konto…">Skapa konto</AuthSubmit>
      </form>
    </AuthLayout>
  )
}
