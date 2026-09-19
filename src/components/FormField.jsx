import { AlertCircle, CheckCircle, ChevronLeft, Trash2 } from 'lucide-react'
import { cn } from '../lib/utils'

// Shared form primitives. Wrapping the control in <label> associates the two
// for screen readers without needing generated ids.

export const inputClass =
  'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all'

export const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5'

export function Field({ label, children, className }) {
  return (
    <label className={cn('block', className)}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  )
}

/** White bordered section with a small uppercase heading. */
export function Card({ title, subtitle, children, className }) {
  return (
    <section className={cn('bg-white rounded-xl border border-gray-200 p-5 space-y-4', className)}>
      {(title || subtitle) && (
        <div>
          {title && <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</h2>}
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  )
}

/** Label/value row used in totals and detail summaries. */
export function SummaryRow({ label, value, valueClass = 'text-gray-700', className }) {
  return (
    <div className={cn('flex justify-between items-baseline', className)}>
      <span className="text-gray-500">{label}</span>
      <span className={cn('font-medium tabular-nums', valueClass)}>{value}</span>
    </div>
  )
}

export function Toggle({ checked, onChange, label, name }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div className="relative">
        <input
          name={name}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only peer"
          role="switch"
        />
        <div className="w-10 h-6 bg-gray-200 peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 rounded-full transition-colors duration-150" />
        <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-150 peer-checked:translate-x-4" />
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
  )
}

export function FormError({ children }) {
  if (!children) return null
  return (
    <div role="alert" className="flex items-center gap-2 bg-red-50 text-danger rounded-xl px-3 py-2.5">
      <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <p className="text-sm">{children}</p>
    </div>
  )
}

export function FormSuccess({ children }) {
  if (!children) return null
  return (
    <div role="status" className="flex items-center gap-2 bg-green-50 text-green-700 rounded-xl px-3 py-2.5">
      <CheckCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
      <p className="text-sm font-medium">{children}</p>
    </div>
  )
}

/** Sticky white page header with a back arrow, used by the simple form pages. */
export function FormHeader({ title, onBack }) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
      <button
        type="button"
        onClick={onBack}
        className="text-gray-500 hover:text-gray-800 transition-colors p-1.5 -ml-1 rounded-xl hover:bg-gray-100"
        aria-label="Tillbaka"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <h1 className="font-bold text-gray-900 text-lg">{title}</h1>
    </header>
  )
}

export function SubmitButton({ busy, disabled, children, busyLabel = 'Sparar…' }) {
  return (
    <button
      type="submit"
      disabled={busy || disabled}
      className="w-full bg-primary hover:bg-primary-dark active:bg-primary-darker disabled:opacity-60 text-white font-semibold h-12 rounded-xl transition-all"
    >
      {busy ? busyLabel : children}
    </button>
  )
}

export function DeleteButton({ busy, disabled, onClick, children, busyLabel = 'Raderar…' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      className="w-full flex items-center justify-center gap-2 bg-white border border-danger/25 hover:bg-red-50 active:bg-red-100 disabled:opacity-60 text-danger font-semibold h-12 rounded-xl transition-all"
    >
      <Trash2 className="w-4 h-4" aria-hidden="true" />
      {busy ? busyLabel : children}
    </button>
  )
}
