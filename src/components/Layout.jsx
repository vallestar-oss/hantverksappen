import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Users, FileText, Briefcase, Receipt, Settings, LogOut, Calendar, Wrench } from 'lucide-react'
import { supabase } from '../lib/supabase'
import BottomNav from './BottomNav'

const NAV_ITEMS = [
  { label: 'Hem',      path: '/dashboard',     Icon: Home },
  { label: 'Kunder',   path: '/customers',     Icon: Users },
  { label: 'Offerter', path: '/quotes',        Icon: FileText },
  { label: 'Jobb',     path: '/jobs',          Icon: Briefcase },
  { label: 'Kalender', path: '/jobs/calendar', Icon: Calendar },
  { label: 'Fakturor', path: '/invoices',      Icon: Receipt },
]

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()

  function isActive(path) {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    if (path === '/jobs') return location.pathname.startsWith('/jobs') && !location.pathname.startsWith('/jobs/calendar')
    return location.pathname.startsWith(path)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-[#F8F8F8]">
      {/* ── Sidebar — desktop only ─────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-[240px] z-30 select-none"
        style={{ background: '#111111' }}
      >
        {/* Logo */}
        <div className="px-5 h-[64px] flex items-center gap-2.5 flex-shrink-0" style={{ borderBottom: '1px solid #333333' }}>
          <Wrench className="w-[18px] h-[18px] text-[#5599FF] flex-shrink-0" strokeWidth={2.5} />
          <span className="font-bold text-white text-[16px] tracking-tight">
            Hantverksappen
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
          {NAV_ITEMS.map(({ label, path, Icon }) => {
            const active = isActive(path)
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-all relative ${
                  active
                    ? 'bg-[#0055FF]/[0.12] text-[#5599FF]'
                    : 'text-gray-400 hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#0055FF] rounded-full" />
                )}
                <Icon
                  className="w-[17px] h-[17px] flex-shrink-0"
                  strokeWidth={active ? 2.5 : 2}
                />
                {label}
              </button>
            )
          })}
        </nav>

        {/* Bottom — settings + logout */}
        <div className="px-2 pb-5 pt-3 border-t border-white/[0.07] space-y-0.5 flex-shrink-0">
          <button
            onClick={() => navigate('/settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-all ${
              location.pathname === '/settings'
                ? 'bg-[#0055FF]/[0.12] text-[#5599FF]'
                : 'text-gray-400 hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            <Settings className="w-[17px] h-[17px] flex-shrink-0" strokeWidth={2} />
            Inställningar
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium text-gray-400 hover:bg-white/[0.05] hover:text-red-400 transition-all"
          >
            <LogOut className="w-[17px] h-[17px] flex-shrink-0" strokeWidth={2} />
            Logga ut
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="flex-1 md:ml-[240px] flex flex-col min-h-screen pb-16 md:pb-0 bg-[#F8F8F8]">
        {children}
      </div>

      {/* ── Bottom nav — mobile only ──────────────────────────────────── */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  )
}
