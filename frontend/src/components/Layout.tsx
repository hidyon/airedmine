import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchConfig } from '../api/client'
import type { ConfigResponse } from '../api/types'

const NAV_ITEMS = [
  { to: '/developer/chat', icon: '💬', label: 'Chat', section: 'developer' },
  { to: '/developer/dashboard', icon: '📋', label: 'Dashboard', section: 'developer' },
  { to: '/pm', icon: '🎯', label: 'PM View', section: 'management' },
  { to: '/audit', icon: '📝', label: 'Audit', section: 'management' },
]

const VIEW_LABELS: Record<string, string> = {
  '/developer/chat': 'Developer Chat',
  '/developer/dashboard': 'Developer Dashboard',
  '/pm': 'PM View',
  '/audit': 'Audit',
}

export default function Layout() {
  const { pathname } = useLocation()
  const [config, setConfig] = useState<ConfigResponse | null>(null)

  useEffect(() => {
    fetchConfig().then(setConfig).catch(() => null)
  }, [])

  const viewTitle = VIEW_LABELS[pathname] ?? 'AIRedmine'
  const mode = config?.mode

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className="w-56 flex-shrink-0 bg-slate-800 flex flex-col overflow-y-auto">
        <div className="px-4 py-5 border-b border-slate-700">
          <p className="text-white font-bold text-[15px] tracking-wide m-0">AIRedmine</p>
          <p className="text-slate-400 text-[11px] mt-0.5 m-0">
            {mode === 'mock' ? 'Mock mode' : mode === 'redmine' ? 'Redmine' : '…'}
          </p>
        </div>
        <nav className="p-2 flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-2 pt-3 pb-1">
            Developer
          </span>
          {NAV_ITEMS.slice(0, 2).map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-[13.5px] font-medium no-underline transition-colors ${
                  isActive
                    ? 'bg-slate-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`
              }
            >
              <span className="text-[15px] w-5 text-center">{icon}</span>
              {label}
            </NavLink>
          ))}
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-2 pt-3 pb-1">
            Management
          </span>
          {NAV_ITEMS.slice(2).map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-[13.5px] font-medium no-underline transition-colors ${
                  isActive
                    ? 'bg-slate-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`
              }
            >
              <span className="text-[15px] w-5 text-center">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-12 flex-shrink-0 border-b border-slate-200 bg-white flex items-center px-5 gap-3">
          <span className="text-sm font-semibold text-slate-800">{viewTitle}</span>
          {mode && (
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                mode === 'mock'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {mode === 'mock' ? 'Mock' : 'Redmine'}
            </span>
          )}
        </header>
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
