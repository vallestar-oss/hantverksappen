// Activity timeline — vertical line with dots, shown at the bottom of detail
// pages. Events are derived from existing created_at / status / paid fields.

function formatDate(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
}

// events: [{ label: string, date: ISO string, highlight?: boolean }]
export default function ActivityLog({ events = [] }) {
  const sorted = [...events]
    .filter(e => e.label)
    .sort((a, b) => new Date(a.date ?? 0) - new Date(b.date ?? 0))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Aktivitet</h2>

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-400">Ingen aktivitet ännu</p>
      ) : (
        <ol className="relative">
          {sorted.map((event, i) => (
            <li key={i} className="relative pl-6 pb-5 last:pb-0">
              {/* vertical line */}
              {i < sorted.length - 1 && (
                <span aria-hidden="true" className="absolute left-[5px] top-4 bottom-0 w-px bg-gray-200" />
              )}
              {/* dot */}
              <span
                aria-hidden="true"
                className={`absolute left-0 top-1 w-[11px] h-[11px] rounded-full border-2 ${
                  i === sorted.length - 1
                    ? 'bg-primary border-primary'
                    : 'bg-white border-gray-300'
                }`}
              />
              <p className="text-sm font-medium text-gray-800 leading-snug">{event.label}</p>
              {event.date && (
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(event.date)}</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
