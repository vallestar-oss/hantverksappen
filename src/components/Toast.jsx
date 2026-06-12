import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

// Global toast notifications — bottom right on desktop, bottom center on mobile.
// Types: success | error | warning | info. Auto-dismiss after 4s, manual X.

const ToastContext = createContext(null)

const TYPE_CONFIG = {
  success: { border: '#16A34A', Icon: CheckCircle,   iconColor: 'text-success' },
  error:   { border: '#DC2626', Icon: AlertCircle,   iconColor: 'text-danger' },
  warning: { border: '#D97706', Icon: AlertTriangle, iconColor: 'text-warning' },
  info:    { border: '#0055FF', Icon: Info,          iconColor: 'text-primary' },
}

const TOAST_CSS = `
@keyframes toast-in {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes toast-out {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(8px); }
}
.toast-enter { animation: toast-in 200ms ease both; }
.toast-exit  { animation: toast-out 200ms ease both; }
`

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef({})

  const dismissToast = useCallback(id => {
    // Trigger exit animation, then remove
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 200)
    clearTimeout(timersRef.current[id])
    delete timersRef.current[id]
  }, [])

  const showToast = useCallback((message, type = 'success') => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev.slice(-2), { id, message, type, exiting: false }])
    timersRef.current[id] = setTimeout(() => dismissToast(id), 4000)
  }, [dismissToast])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <style>{TOAST_CSS}</style>
      <div
        className="fixed inset-x-0 bottom-20 md:inset-x-auto md:bottom-6 md:right-6 z-50 flex flex-col items-center md:items-end gap-2 px-4 md:px-0 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map(({ id, message, type, exiting }) => {
          const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.info
          const Icon = cfg.Icon
          return (
            <div
              key={id}
              className={`${exiting ? 'toast-exit' : 'toast-enter'} pointer-events-auto flex items-center gap-3 bg-white rounded-xl px-4 py-3 w-full md:w-auto md:min-w-[280px] md:max-w-sm`}
              style={{
                borderLeft: `4px solid ${cfg.border}`,
                boxShadow: '0 4px 16px rgba(17,17,17,0.10), 0 1px 3px rgba(17,17,17,0.06)',
              }}
              role="status"
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${cfg.iconColor}`} />
              <p className="flex-1 text-sm font-medium text-gray-800">{message}</p>
              <button
                onClick={() => dismissToast(id)}
                className="text-gray-300 hover:text-gray-600 transition-colors flex-shrink-0 p-0.5 rounded-lg"
                aria-label="Stäng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

// Safe outside the provider (e.g. login pages) — falls back to a no-op.
export function useToast() {
  return useContext(ToastContext) ?? (() => {})
}
