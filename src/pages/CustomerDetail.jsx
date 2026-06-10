import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function CustomerDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCustomer() {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        navigate('/customers')
        return
      }

      setCustomer(data)
      setLoading(false)
    }
    loadCustomer()
  }, [id, user.id, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <svg className="animate-spin w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    )
  }

  const addressParts = [customer.address, [customer.postal_code, customer.city].filter(Boolean).join(' ')].filter(Boolean)
  const fullAddress = addressParts.join(', ')

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Sticky header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate('/customers')}
          className="text-gray-500 hover:text-gray-800 transition-colors p-1 -ml-1 rounded-lg"
          aria-label="Tillbaka"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h1 className="font-bold text-gray-800 text-lg flex-1 truncate">{customer.name}</h1>

        <button
          onClick={() => navigate(`/customers/${id}/edit`)}
          className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-lg"
          aria-label="Redigera kund"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
          </svg>
        </button>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Contact card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-gray-50">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Kontaktuppgifter</h2>
          </div>

          {/* Name row */}
          <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-50">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">{customer.name[0].toUpperCase()}</span>
            </div>
            <span className="font-semibold text-gray-800">{customer.name}</span>
          </div>

          {/* Phone */}
          {customer.phone && (
            <a
              href={`tel:${customer.phone}`}
              className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">{customer.phone}</span>
            </a>
          )}

          {/* Email */}
          {customer.email && (
            <a
              href={`mailto:${customer.email}`}
              className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm text-gray-700">{customer.email}</span>
            </a>
          )}

          {/* Address */}
          {fullAddress && (
            <div className="flex items-start gap-4 px-5 py-4 border-b border-gray-50">
              <div className="w-9 h-9 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-sm text-gray-700 leading-relaxed">{fullAddress}</span>
            </div>
          )}

          {/* Notes */}
          {customer.notes && (
            <div className="flex items-start gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <span className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{customer.notes}</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate(`/jobs/new?customer_id=${id}`)}
          className="w-full bg-primary hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 rounded-xl transition-colors duration-150 shadow-sm"
        >
          Skapa jobb
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-gray-50">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function PlaceholderRows({ emptyText }) {
  return (
    <div className="px-5 py-8 flex items-center justify-center">
      <p className="text-sm text-gray-400">{emptyText}</p>
    </div>
  )
}
