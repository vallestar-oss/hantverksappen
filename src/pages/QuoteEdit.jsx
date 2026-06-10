import { useNavigate, useParams } from 'react-router-dom'

export default function QuoteEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate(`/quotes/${id}`)}
          className="text-gray-500 hover:text-gray-800 transition-colors p-1 -ml-1 rounded-lg"
          aria-label="Tillbaka"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-bold text-gray-800 text-lg">Redigera offert</h1>
      </header>
      <div className="flex items-center justify-center py-20 px-4">
        <p className="text-gray-400 text-sm">Redigering av offert är inte tillgänglig ännu.</p>
      </div>
    </div>
  )
}
