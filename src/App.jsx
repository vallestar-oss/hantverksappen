import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
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

function P({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<P><Dashboard /></P>} />
          <Route path="/settings" element={<P><Settings /></P>} />
          <Route path="/customers" element={<P><Customers /></P>} />
          <Route path="/customers/new" element={<P><CustomerNew /></P>} />
          <Route path="/customers/:id" element={<P><CustomerDetail /></P>} />
          <Route path="/customers/:id/edit" element={<P><CustomerEdit /></P>} />
          <Route path="/quotes" element={<P><Quotes /></P>} />
          <Route path="/quotes/new" element={<P><QuoteNew /></P>} />
          <Route path="/quotes/:id" element={<P><QuoteDetail /></P>} />
          <Route path="/quotes/:id/edit" element={<P><QuoteEdit /></P>} />
          <Route path="/jobs" element={<P><Jobs /></P>} />
          <Route path="/jobs/calendar" element={<P><JobCalendar /></P>} />
          <Route path="/jobs/new" element={<P><JobNew /></P>} />
          <Route path="/jobs/:id" element={<P><JobDetail /></P>} />
          <Route path="/jobs/:id/edit" element={<P><JobEdit /></P>} />
          <Route path="/invoices" element={<P><Invoices /></P>} />
          <Route path="/invoices/new" element={<P><InvoiceNew /></P>} />
          <Route path="/invoices/:id" element={<P><InvoiceDetail /></P>} />
          <Route path="/invoices/:id/edit" element={<P><InvoiceEdit /></P>} />
          <Route path="/export" element={<P><Export /></P>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
