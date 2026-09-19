import { useEffect, useRef } from 'react'

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Radera',
  cancelLabel = 'Avbryt',
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null)

  // Move focus into the dialog, starting on the safe action.
  useEffect(() => {
    if (isOpen) cancelRef.current?.focus()
  }, [isOpen])

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return
    function onKey(e) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  return (
    <div
      className="fade-in fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby={message ? 'confirm-message' : undefined}
        className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4"
      >
        <div>
          <h2 id="confirm-title" className="font-bold text-lg" style={{ color: '#111111' }}>{title}</h2>
          {message && (
            <p id="confirm-message" className="text-sm mt-2 leading-relaxed" style={{ color: '#666666' }}>{message}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="h-11 px-6 rounded-xl border font-semibold text-sm transition-all duration-200 hover:bg-gray-50 active:bg-gray-100"
            style={{ color: '#111111', borderColor: '#111111' }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-11 px-6 rounded-xl font-semibold text-sm text-white transition-all duration-200"
            style={{ backgroundColor: '#DC2626' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#B91C1C'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#DC2626'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

    </div>
  )
}
