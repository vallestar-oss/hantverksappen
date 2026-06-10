import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ChevronLeft, Pencil, Phone, Mail, MapPin, StickyNote, Briefcase, Loader2 } from 'lucide-react'

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

      if (error || !data) { navigate('/customers'); return }
      setCustomer(data)
      setLoading(false)
    }
    loadCustomer()
  }, [id, user.id, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAFC' }}>
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
    )
  }

  const addressParts = [
    customer.address,
    [customer.postal_code, customer.city].filter(Boolean).join(' '),
  ].filter(Boolean)
  const fullAddress = addressParts.join(', ')

  return (
    <div className="min-h-screen pb-20" style={{ background: '#F8FAFC' }}>

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate('/customers')}
          className="text-gray-500 hover:text-gray-800 transition-colors p-1.5 -ml-1 rounded-xl hover:bg-gray-100"
          aria-label="Tillbaka"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg flex-1 truncate">{customer.name}</h1>
        <button
          onClick={() => navigate(`/customers/${id}/edit`)}
          className="text-gray-400 hover:text-gray-700 transition-colors p-1.5 rounded-xl hover:bg-gray-100"
          aria-label="Redigera kund"
        >
          <Pencil className="w-5 h-5" />
        </button>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-3">

        {/* Avatar + name banner */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-primary">{customer.name[0].toUpperCase()}</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-base">{customer.name}</p>
            {customer.city && <p className="text-sm text-gray-400 mt-0.5">{customer.city}</p>}
          </div>
        </div>

        {/* Contact details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Kontaktuppgifter</p>
          </div>

          {customer.phone && (
            <a
              href={`tel:${customer.phone}`}
              className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Telefon</p>
                <p className="text-sm text-gray-800 font-medium mt-0.5">{customer.phone}</p>
              </div>
            </a>
          )}

          {customer.email && (
            <a
              href={`mailto:${customer.email}`}
              className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">E-post</p>
                <p className="text-sm text-gray-800 font-medium mt-0.5">{customer.email}</p>
              </div>
            </a>
          )}

          {fullAddress && (
            <div className="flex items-start gap-4 px-5 py-4 border-b border-gray-50">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Adress</p>
                <p className="text-sm text-gray-800 font-medium mt-0.5 leading-relaxed">{fullAddress}</p>
              </div>
            </div>
          )}

          {customer.notes && (
            <div className="flex items-start gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <StickyNote className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Anteckningar</p>
                <p className="text-sm text-gray-800 mt-0.5 leading-relaxed whitespace-pre-wrap">{customer.notes}</p>
              </div>
            </div>
          )}

          {!customer.phone && !customer.email && !fullAddress && !customer.notes && (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-gray-400">Inga kontaktuppgifter sparade.</p>
            </div>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate(`/jobs/new?customer_id=${id}`)}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-blue-700 active:bg-blue-800 text-white font-semibold h-12 rounded-xl transition-all shadow-sm"
        >
          <Briefcase className="w-4 h-4" />
          Skapa jobb
        </button>
      </div>
    </div>
  )
}
