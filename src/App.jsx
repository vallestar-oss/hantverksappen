import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import { PageLoader } from './components/AuthLayout'
import { isSupabaseConfigured } from './lib/supabase'

// Every screen is its own chunk, so the landing page doesn't ship the whole app
// (and the PDF/calendar libraries) to visitors who haven't signed in.
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Settings = lazy(() => import('./pages/Settings'))
const Export = lazy(() => import('./pages/Export'))
const Customers = lazy(() => import('./pages/Customers'))
const CustomerNew = lazy(() => import('./pages/CustomerNew'))
const CustomerDetail = lazy(() => import('./pages/CustomerDetail'))
const CustomerEdit = lazy(() => import('./pages/CustomerEdit'))
const Quotes = lazy(() => import('./pages/Quotes'))
const QuoteNew = lazy(() => import('./pages/QuoteNew'))
const QuoteDetail = lazy(() => import('./pages/QuoteDetail'))
const QuoteEdit = lazy(() => import('./pages/QuoteEdit'))
const Jobs = lazy(() => import('./pages/Jobs'))
const JobNew = lazy(() => import('./pages/JobNew'))
const JobDetail = lazy(() => import('./pages/JobDetail'))
const JobEdit = lazy(() => import('./pages/JobEdit'))
const JobCalendar = lazy(() => import('./pages/JobCalendar'))
const Invoices = lazy(() => import('./pages/Invoices'))
const InvoiceNew = lazy(() => import('./pages/InvoiceNew'))
const InvoiceDetail = lazy(() => import('./pages/InvoiceDetail'))
const InvoiceEdit = lazy(() => import('./pages/InvoiceEdit'))

/** Wraps an authenticated screen in the route guard and the app shell. */
function Protected({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

function MissingConfig() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div role="alert" className="max-w-md text-center">
        <h1 className="text-lg font-bold text-gray-900">Supabase är inte konfigurerat</h1>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          Kopiera <code className="font-mono">.env.example</code> till <code className="font-mono">.env</code> och
          fyll i <code className="font-mono">VITE_SUPABASE_URL</code> och{' '}
          <code className="font-mono">VITE_SUPABASE_ANON_KEY</code>. Starta sedan om utvecklingsservern.
        </p>
      </div>
    </main>
  )
}

export default function App() {
  if (!isSupabaseConfigured) return <MissingConfig />

  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/settings" element={<Protected><Settings /></Protected>} />
            <Route path="/export" element={<Protected><Export /></Protected>} />

            <Route path="/customers" element={<Protected><Customers /></Protected>} />
            <Route path="/customers/new" element={<Protected><CustomerNew /></Protected>} />
            <Route path="/customers/:id" element={<Protected><CustomerDetail /></Protected>} />
            <Route path="/customers/:id/edit" element={<Protected><CustomerEdit /></Protected>} />

            <Route path="/quotes" element={<Protected><Quotes /></Protected>} />
            <Route path="/quotes/new" element={<Protected><QuoteNew /></Protected>} />
            <Route path="/quotes/:id" element={<Protected><QuoteDetail /></Protected>} />
            <Route path="/quotes/:id/edit" element={<Protected><QuoteEdit /></Protected>} />

            <Route path="/jobs" element={<Protected><Jobs /></Protected>} />
            <Route path="/jobs/calendar" element={<Protected><JobCalendar /></Protected>} />
            <Route path="/jobs/new" element={<Protected><JobNew /></Protected>} />
            <Route path="/jobs/:id" element={<Protected><JobDetail /></Protected>} />
            <Route path="/jobs/:id/edit" element={<Protected><JobEdit /></Protected>} />

            <Route path="/invoices" element={<Protected><Invoices /></Protected>} />
            <Route path="/invoices/new" element={<Protected><InvoiceNew /></Protected>} />
            <Route path="/invoices/:id" element={<Protected><InvoiceDetail /></Protected>} />
            <Route path="/invoices/:id/edit" element={<Protected><InvoiceEdit /></Protected>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
