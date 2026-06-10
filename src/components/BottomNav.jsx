import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Users, FileText, Briefcase, Receipt } from 'lucide-react'

const tabs = [
  { label: 'Hem',      path: '/dashboard', Icon: Home },
  { label: 'Kunder',   path: '/customers', Icon: Users },
  { label: 'Offerter', path: '/quotes',    Icon: FileText },
  { label: 'Jobb',     path: '/jobs',      Icon: Briefcase },
  { label: 'Fakturor', path: '/invoices',  Icon: Receipt },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  function isActive(path) {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-20 h-16">
      {tabs.map(({ label, path, Icon }) => {
        const active = isActive(path)
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors"
          >
            {/* Active pill background */}
            {active && (
              <span className="absolute inset-x-1.5 top-1.5 bottom-1.5 bg-blue-50 rounded-xl" />
            )}
            <Icon
              className={`w-5 h-5 relative z-10 transition-colors ${active ? 'text-primary' : 'text-gray-400'}`}
              strokeWidth={active ? 2.5 : 2}
            />
            <span className={`text-[10px] font-semibold relative z-10 transition-colors ${active ? 'text-primary' : 'text-gray-400'}`}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
