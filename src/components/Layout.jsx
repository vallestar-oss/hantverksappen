import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Users, FileText, Briefcase, Receipt, Settings, LogOut, Calendar, Wrench, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import BottomNav from './BottomNav'
import GlobalSearch from './GlobalSearch'
import { ToastProvider } from './Toast'

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
  const [searchOpen, setSearchOpen] = useState(false)

  const closeSearch = useCallback(() => setSearchOpen(false), [])

  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(open => !open)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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
    <ToastProvider>
      <div className="min-h-screen flex bg-[#F4F3F1]">

        {/* ── Sidebar — desktop only ─────────────────────────────────────── */}
        <aside
          className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-[248px] z-30 select-none"
          style={{ background: '#111111', borderRight: '1px solid rgba(255,255,255,0.04)' }}
        >
          {/* Logo */}
          <div className="px-5 h-[64px] flex items-center gap-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#0055FF' }}>
              <Wrench className="w-[14px] h-[14px] text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-white text-[15px] tracking-tight">
              Hantverksappen
            </span>
          </div>

          {/* Global search trigger */}
          <div className="px-3 pt-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all"
              style={{ color: '#666666' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#AAAAAA' }}
              onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#666666' }}
            >
              <Search className="w-[15px] h-[15px] flex-shrink-0" strokeWidth={2} />
              <span className="flex-1 text-left">Sök</span>
              <kbd className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ color: '#555555', border: '1px solid rgba(255,255,255,0.08)', lineHeight: 1.5 }}>
                ⌃K
              </kbd>
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 py-2 px-3 overflow-y-auto" style={{ gap: 2, display: 'flex', flexDirection: 'column' }}>
            {NAV_ITEMS.map(({ label, path, Icon }) => {
              const active = isActive(path)
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className="group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all relative"
                  style={{
                    color: active ? '#FFFFFF' : '#666666',
                    background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#AAAAAA' } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#666666' } }}
                >
                  {active && (
                    <span
                      className="absolute left-0 rounded-r-full"
                      style={{ top: 6, bottom: 6, width: 3, background: '#0055FF' }}
                    />
                  )}
                  <Icon
                    className="flex-shrink-0"
                    style={{ width: 15, height: 15 }}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  {label}
                </button>
              )
            })}
          </nav>

          {/* Bottom — settings + logout */}
          <div className="px-3 pb-5 pt-2 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={() => navigate('/settings')}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all"
              style={{
                color: location.pathname === '/settings' ? '#FFFFFF' : '#666666',
                background: location.pathname === '/settings' ? 'rgba(255,255,255,0.08)' : 'transparent',
              }}
              onMouseEnter={e => { if (location.pathname !== '/settings') { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#AAAAAA' } }}
              onMouseLeave={e => { if (location.pathname !== '/settings') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#666666' } }}
            >
              <Settings style={{ width: 15, height: 15, flexShrink: 0 }} strokeWidth={2} />
              Inställningar
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all mt-0.5"
              style={{ color: '#666666' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#EF4444' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#666666' }}
            >
              <LogOut style={{ width: 15, height: 15, flexShrink: 0 }} strokeWidth={2} />
              Logga ut
            </button>
          </div>
        </aside>

        {/* ── Main content ──────────────────────────────────────────────── */}
        <div className="flex-1 md:ml-[248px] flex flex-col min-h-screen pb-[62px] md:pb-0 bg-[#F4F3F1]">
          {children}
        </div>

        {/* ── Bottom nav — mobile only ──────────────────────────────────── */}
        <div className="md:hidden">
          <BottomNav onSearch={() => setSearchOpen(true)} />
        </div>

        {/* ── Global search modal ───────────────────────────────────────── */}
        <GlobalSearch open={searchOpen} onClose={closeSearch} />
      </div>
    </ToastProvider>
  )
}
