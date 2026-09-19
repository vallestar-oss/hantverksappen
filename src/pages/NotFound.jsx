import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="max-w-sm text-center">
        <Compass className="w-10 h-10 text-gray-300 mx-auto mb-4" aria-hidden="true" />
        <p className="text-sm font-semibold text-primary">404</p>
        <h1 className="text-xl font-bold text-gray-900 mt-1">Sidan hittades inte</h1>
        <p className="text-sm text-gray-500 mt-1.5">Adressen finns inte, eller så har sidan flyttats.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-white font-semibold h-11 px-6 rounded-xl transition-colors"
        >
          Till startsidan
        </Link>
      </div>
    </main>
  )
}
