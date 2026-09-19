import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { ToastContext } from './toastContext'

// Global toast notifications — bottom right on desktop, bottom center on mobile.
// Types: success | error | warning | info. Auto-dismiss after 4s, manual X.
// Consume with `useToast()` from '@/hooks/useToast'. Animations live in index.css.

const TYPE_CONFIG = {
  success: { border: '#16A34A', Icon: CheckCircle,   iconColor: 'text-success' },
  error:   { border: '#DC2626', Icon: AlertCircle,   iconColor: 'text-danger' },
  warning: { border: '#D97706', Icon: AlertTriangle, iconColor: 'text-warning' },
  info:    { border: '#0055FF', Icon: Info,          iconColor: 'text-primary' },
}

const VISIBLE_TOASTS = 3
const AUTO_DISMISS_MS = 4000
const EXIT_ANIMATION_MS = 200

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef(new Map())

  const dismissToast = useCallback(id => {
    // Trigger the exit animation, then remove.
    setToasts(prev => prev.map(t => (t.id === id ? { ...t, exiting: true } : t)))
    clearTimeout(timersRef.current.get(id))
    timersRef.current.set(
      id,
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
        timersRef.current.delete(id)
      }, EXIT_ANIMATION_MS),
    )
  }, [])

  const showToast = useCallback((message, type = 'success') => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev.slice(-(VISIBLE_TOASTS - 1)), { id, message, type, exiting: false }])
    timersRef.current.set(id, setTimeout(() => dismissToast(id), AUTO_DISMISS_MS))
  }, [dismissToast])

  // Clear pending timers when the provider unmounts.
  useEffect(() => {
    const timers = timersRef.current
    return () => timers.forEach(clearTimeout)
  }, [])

  const value = useMemo(() => showToast, [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed inset-x-0 bottom-20 md:inset-x-auto md:bottom-6 md:right-6 z-50 flex flex-col items-center md:items-end gap-2 px-4 md:px-0 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map(({ id, message, type, exiting }) => {
          const { border, Icon, iconColor } = TYPE_CONFIG[type] ?? TYPE_CONFIG.info
          return (
            <div
              key={id}
              className={`${exiting ? 'toast-exit' : 'toast-enter'} pointer-events-auto flex items-center gap-3 bg-white rounded-xl px-4 py-3 w-full md:w-auto md:min-w-[280px] md:max-w-sm`}
              style={{
                borderLeft: `4px solid ${border}`,
                boxShadow: '0 4px 16px rgba(17,17,17,0.10), 0 1px 3px rgba(17,17,17,0.06)',
              }}
              role={type === 'error' ? 'alert' : 'status'}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} aria-hidden="true" />
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
