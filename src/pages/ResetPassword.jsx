import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { AuthLayout, IconField, AuthSubmit, PageLoader } from '../components/AuthLayout'
import { FormError } from '../components/FormField'

const MIN_PASSWORD_LENGTH = 6

// Landing page for the link in the "reset password" e-mail. Opening that link
// gives the browser a short-lived recovery session, which is what allows
// updateUser({ password }) here. Without a session the link is invalid or expired.
export default function ResetPassword() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <PageLoader />

  if (!user) {
    return (
      <AuthLayout title="Länken fungerar inte" subtitle="Den kan ha gått ut eller redan använts">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <Link to="/login" className="text-sm font-semibold text-primary hover:underline">
            Begär en ny länk
          </Link>
        </div>
      </AuthLayout>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Lösenorden matchar inte.'); return }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Lösenordet måste vara minst ${MIN_PASSWORD_LENGTH} tecken.`)
      return
    }

    setSubmitting(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError('Kunde inte spara det nya lösenordet. Begär en ny länk och försök igen.')
      setSubmitting(false)
      return
    }
    navigate('/dashboard', { replace: true })
  }

  return (
    <AuthLayout title="Välj nytt lösenord" subtitle="Ange ett nytt lösenord för ditt konto">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-8 space-y-5">
        <IconField
          label="Nytt lösenord"
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

        <AuthSubmit busy={submitting} busyLabel="Sparar…">Spara lösenord</AuthSubmit>
      </form>
    </AuthLayout>
  )
}
