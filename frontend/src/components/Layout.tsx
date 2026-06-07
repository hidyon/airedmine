import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchConfig } from '../api/client'
import type { ConfigResponse } from '../api/types'
import styles from './Layout.module.css'

const NAV_ITEMS = [
  { to: '/developer/chat', icon: '💬', label: 'Chat' },
  { to: '/developer/dashboard', icon: '📋', label: 'Dashboard' },
  { to: '/pm', icon: '🎯', label: 'PM View' },
  { to: '/audit', icon: '📝', label: 'Audit' },
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
  const mode = config?.mode ?? 'loading'

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <p className={styles.sidebarTitle}>AIRedmine</p>
          <p className={styles.sidebarMode}>{mode === 'mock' ? 'Mock mode' : mode === 'redmine' ? 'Redmine' : '…'}</p>
        </div>
        <nav className={styles.nav}>
          <span className={styles.navSection}>Developer</span>
          {NAV_ITEMS.slice(0, 2).map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `${styles.navLink}${isActive ? ' ' + styles.active : ''}`}
            >
              <span className={styles.navIcon}>{icon}</span>
              {label}
            </NavLink>
          ))}
          <span className={styles.navSection}>Management</span>
          {NAV_ITEMS.slice(2).map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `${styles.navLink}${isActive ? ' ' + styles.active : ''}`}
            >
              <span className={styles.navIcon}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <span className={styles.topbarTitle}>{viewTitle}</span>
          {config && (
            <span className={`${styles.topbarBadge}${mode === 'mock' ? ' ' + styles.topbarBadgeMock : ''}`}>
              {mode === 'mock' ? 'Mock' : 'Redmine'}
            </span>
          )}
        </header>
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
