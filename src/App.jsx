import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Customers from './pages/Customers'
import CustomerNew from './pages/CustomerNew'
import CustomerDetail from './pages/CustomerDetail'
import CustomerEdit from './pages/CustomerEdit'
import Quotes from './pages/Quotes'
import QuoteNew from './pages/QuoteNew'
import QuoteDetail from './pages/QuoteDetail'
import QuoteEdit from './pages/QuoteEdit'
import Jobs from './pages/Jobs'
import JobNew from './pages/JobNew'
import JobDetail from './pages/JobDetail'
import JobEdit from './pages/JobEdit'
import JobCalendar from './pages/JobCalendar'
import Invoices from './pages/Invoices'
import InvoiceNew from './pages/InvoiceNew'
import InvoiceDetail from './pages/InvoiceDetail'
import InvoiceEdit from './pages/InvoiceEdit'
import Export from './pages/Export'

function AL({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<AL><Dashboard /></AL>} />
          <Route path="/settings" element={<AL><Settings /></AL>} />
          <Route path="/customers" element={<AL><Customers /></AL>} />
          <Route path="/customers/new" element={<AL><CustomerNew /></AL>} />
          <Route path="/customers/:id" element={<AL><CustomerDetail /></AL>} />
          <Route path="/customers/:id/edit" element={<AL><CustomerEdit /></AL>} />
          <Route path="/quotes" element={<AL><Quotes /></AL>} />
          <Route path="/quotes/new" element={<AL><QuoteNew /></AL>} />
          <Route path="/quotes/:id" element={<AL><QuoteDetail /></AL>} />
          <Route path="/quotes/:id/edit" element={<AL><QuoteEdit /></AL>} />
          <Route path="/jobs" element={<AL><Jobs /></AL>} />
          <Route path="/jobs/calendar" element={<AL><JobCalendar /></AL>} />
          <Route path="/jobs/new" element={<AL><JobNew /></AL>} />
          <Route path="/jobs/:id" element={<AL><JobDetail /></AL>} />
          <Route path="/jobs/:id/edit" element={<AL><JobEdit /></AL>} />
          <Route path="/invoices" element={<AL><Invoices /></AL>} />
          <Route path="/invoices/new" element={<AL><InvoiceNew /></AL>} />
          <Route path="/invoices/:id" element={<AL><InvoiceDetail /></AL>} />
          <Route path="/invoices/:id/edit" element={<AL><InvoiceEdit /></AL>} />
          <Route path="/export" element={<AL><Export /></AL>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
