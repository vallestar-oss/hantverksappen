import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-6xl mb-6">🔧</div>

        <h1 className="text-4xl font-bold text-primary mb-3 tracking-tight">
          Hantverksappen
        </h1>

        <p className="text-gray-500 text-lg mb-8">
          Enkel administration för hantverkare
        </p>

        <button
          onClick={() => navigate('/login')}
          className="w-full bg-primary hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-150 shadow-sm"
        >
          Kom igång
        </button>
      </div>
    </div>
  )
}
