import { Wrench, Loader2 } from 'lucide-react'
import { labelClass } from './FormField'

// Shared chrome for the public authentication screens (login, sign-up, reset).

export function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary mb-4">
            <Wrench className="w-8 h-8 text-white" strokeWidth={2} aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>

        {children}

        {footer && <p className="text-center text-sm text-gray-600 mt-5">{footer}</p>}
      </div>
    </main>
  )
}

/** Text input with a leading icon. Extra props go to the <input>. */
export function IconField({ label, icon: Icon, aside, ...inputProps }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between mb-1.5">
        <span className={labelClass.replace('mb-1.5', '')}>{label}</span>
        {aside}
      </span>
      <span className="relative block">
        <Icon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true" />
        <input
          {...inputProps}
          className="w-full border border-gray-200 rounded-xl pl-10 pr-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
        />
      </span>
    </label>
  )
}

export function AuthSubmit({ busy, busyLabel, children }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark active:bg-primary-darker disabled:opacity-60 text-white font-semibold h-12 rounded-xl transition-all duration-200"
    >
      {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
      {busy ? busyLabel : children}
    </button>
  )
}

/** Full-screen spinner shown while the session or a lazy route is loading. */
export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" role="status" aria-label="Laddar">
      <Loader2 className="w-6 h-6 text-gray-300 animate-spin" aria-hidden="true" />
    </div>
  )
}
