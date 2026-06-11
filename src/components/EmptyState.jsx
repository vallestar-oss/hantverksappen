import { Plus } from 'lucide-react'

// Custom empty-state illustrations — clean lines, minimal color, no cartoon.
// Palette is locked to the design system: #111111, #E5E5E5, #F0F0F0, #0055FF.

const STROKE = '#111111'
const LIGHT = '#E5E5E5'
const FILL = '#F0F0F0'
const BLUE = '#0055FF'

function CustomersIllustration() {
  return (
    <svg viewBox="0 0 160 110" fill="none" className="w-40 h-auto" aria-hidden="true">
      {/* back person */}
      <circle cx="102" cy="38" r="13" fill={FILL} stroke={LIGHT} strokeWidth="2" />
      <path d="M78 92c0-14 10-24 24-24s24 10 24 24" fill={FILL} stroke={LIGHT} strokeWidth="2" />
      {/* front person */}
      <circle cx="62" cy="42" r="15" fill="#FFFFFF" stroke={STROKE} strokeWidth="2.5" />
      <path d="M34 96c0-16 12-27 28-27s28 11 28 27" fill="#FFFFFF" stroke={STROKE} strokeWidth="2.5" />
      {/* blue accent: plus badge */}
      <circle cx="88" cy="78" r="11" fill={BLUE} />
      <path d="M88 73v10M83 78h10" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

function QuotesIllustration() {
  return (
    <svg viewBox="0 0 160 110" fill="none" className="w-40 h-auto" aria-hidden="true">
      {/* back sheet */}
      <rect x="58" y="8" width="56" height="74" rx="6" fill={FILL} stroke={LIGHT} strokeWidth="2" />
      {/* front sheet */}
      <rect x="44" y="20" width="60" height="80" rx="6" fill="#FFFFFF" stroke={STROKE} strokeWidth="2.5" />
      <path d="M54 36h28M54 48h40M54 60h40M54 72h24" stroke={LIGHT} strokeWidth="3" strokeLinecap="round" />
      {/* blue accent: signature line */}
      <path d="M54 86c5-5 8 3 13-2s8 2 13-2" stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

function InvoicesIllustration() {
  return (
    <svg viewBox="0 0 160 110" fill="none" className="w-40 h-auto" aria-hidden="true">
      {/* receipt with zigzag base */}
      <path
        d="M50 12h60v82l-7.5-6-7.5 6-7.5-6-7.5 6-7.5-6-7.5 6-7.5-6-7.5 6V12z"
        fill="#FFFFFF" stroke={STROKE} strokeWidth="2.5" strokeLinejoin="round"
      />
      <path d="M60 28h26M60 42h40M60 54h40" stroke={LIGHT} strokeWidth="3" strokeLinecap="round" />
      {/* blue accent: total row */}
      <path d="M60 70h16" stroke={BLUE} strokeWidth="3" strokeLinecap="round" />
      <path d="M86 70h14" stroke={BLUE} strokeWidth="3" strokeLinecap="round" opacity="0.45" />
    </svg>
  )
}

function JobsIllustration() {
  return (
    <svg viewBox="0 0 160 110" fill="none" className="w-40 h-auto" aria-hidden="true">
      {/* toolbox */}
      <rect x="38" y="44" width="84" height="48" rx="7" fill="#FFFFFF" stroke={STROKE} strokeWidth="2.5" />
      <path d="M38 64h84" stroke={STROKE} strokeWidth="2.5" />
      <path d="M64 44v-8a8 8 0 0 1 8-8h16a8 8 0 0 1 8 8v8" stroke={STROKE} strokeWidth="2.5" />
      {/* blue accent: handle latch */}
      <rect x="72" y="58" width="16" height="12" rx="3" fill={BLUE} />
      {/* ground shadow */}
      <path d="M30 100h100" stroke={LIGHT} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

function StartIllustration() {
  return (
    <svg viewBox="0 0 160 110" fill="none" className="w-40 h-auto" aria-hidden="true">
      {/* house outline — clean Scandinavian gable */}
      <path d="M44 56 80 26l36 30" stroke={STROKE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M52 52v44h56V52" stroke={STROKE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="#FFFFFF" />
      <rect x="72" y="70" width="16" height="26" fill={FILL} stroke={LIGHT} strokeWidth="2" />
      {/* blue accent: roof ridge */}
      <path d="M38 60 80 25l42 35" stroke={BLUE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <path d="M30 100h100" stroke={LIGHT} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

const ILLUSTRATIONS = {
  customers: CustomersIllustration,
  quotes: QuotesIllustration,
  invoices: InvoicesIllustration,
  jobs: JobsIllustration,
  start: StartIllustration,
}

export default function EmptyState({ illustration = 'start', title, text, ctaLabel, onCta }) {
  const Illustration = ILLUSTRATIONS[illustration] ?? StartIllustration
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <Illustration />
      <p className="text-gray-900 font-bold text-base mt-6">{title}</p>
      {text && <p className="text-gray-400 text-sm mt-1.5 max-w-xs leading-relaxed">{text}</p>}
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="btn-lift mt-6 inline-flex items-center gap-2 bg-primary hover:bg-primary-dark active:bg-primary-darker text-white font-semibold h-11 px-6 rounded-xl text-sm"
        >
          <Plus className="w-4 h-4" />
          {ctaLabel}
        </button>
      )}
    </div>
  )
}
