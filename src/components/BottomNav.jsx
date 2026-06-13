import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Users, FileText, Briefcase, Receipt, Search } from 'lucide-react'

const tabs = [
  { label: 'Hem',      path: '/dashboard', Icon: Home },
  { label: 'Kunder',   path: '/customers', Icon: Users },
  { label: 'Offerter', path: '/quotes',    Icon: FileText },
  { label: 'Jobb',     path: '/jobs',      Icon: Briefcase },
  { label: 'Fakturor', path: '/invoices',  Icon: Receipt },
]

export default function BottomNav({ onSearch }) {
  const location = useLocation()
  const navigate = useNavigate()

  function isActive(path) {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(path)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex z-20 h-[62px]"
      style={{
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(0,0,0,0.07)',
      }}
    >
      {tabs.map(({ label, path, Icon }) => {
        const active = isActive(path)
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="flex-1 flex flex-col items-center justify-center gap-[3px] h-full transition-opacity active:opacity-60"
            aria-label={label}
          >
            <div className="relative flex items-center justify-center">
              {active && (
                <span
                  className="absolute -top-[18px] left-1/2 rounded-full"
                  style={{ width: 20, height: 2, background: '#0055FF', transform: 'translateX(-50%)' }}
                />
              )}
              <Icon
                style={{ width: 20, height: 20, color: active ? '#0055FF' : '#BBBBBB' }}
                strokeWidth={active ? 2.5 : 2}
              />
            </div>
            <span
              className="text-[10px] leading-none"
              style={{
                color: active ? '#0055FF' : '#BBBBBB',
                fontWeight: active ? 600 : 500,
              }}
            >
              {label}
            </span>
          </button>
        )
      })}

      {/* Global search */}
      {onSearch && (
        <button
          onClick={onSearch}
          className="flex-1 flex flex-col items-center justify-center gap-[3px] h-full transition-opacity active:opacity-60"
          aria-label="Sök"
        >
          <Search style={{ width: 20, height: 20, color: '#BBBBBB' }} strokeWidth={2} />
          <span className="text-[10px] leading-none font-medium" style={{ color: '#BBBBBB' }}>Sök</span>
        </button>
      )}
    </nav>
  )
}
