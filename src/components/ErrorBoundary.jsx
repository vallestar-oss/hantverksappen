import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

// Catches render-time errors so a bug in one screen shows a recovery message
// instead of a blank page. Must be a class component — React has no hook for this.
export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div role="alert" className="max-w-sm text-center">
          <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-4" aria-hidden="true" />
          <h1 className="text-lg font-bold text-gray-900">Något gick fel</h1>
          <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
            Sidan kunde inte visas. Ladda om den – dina sparade uppgifter är oförändrade.
          </p>
          <button
            type="button"
            onClick={() => window.location.assign('/')}
            className="mt-6 inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-white font-semibold h-11 px-6 rounded-xl transition-colors"
          >
            Till startsidan
          </button>
        </div>
      </main>
    )
  }
}
