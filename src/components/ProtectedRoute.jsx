import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { PageLoader } from './AuthLayout'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />

  return children
}
