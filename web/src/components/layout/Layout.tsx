import { NavLink, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import { Icon } from '../Icon'

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: 'home' as const, exact: true },
  { to: '/overview', label: 'Overview', icon: 'leaf' as const },
  { to: '/marketplace', label: 'Marketplace', icon: 'shopping' as const },
  { to: '/listings', label: 'Listings', icon: 'bag' as const },
  { to: '/clients', label: 'My Clients', icon: 'user' as const },
  { to: '/jobs', label: 'Transport Jobs', icon: 'truck' as const },
  { to: '/orders', label: 'Orders', icon: 'truck' as const },
  { to: '/profile', label: 'Profile', icon: 'user' as const },
]

function getPageTitle(path: string): string {
  if (path === '/') return 'Home'
  if (path === '/overview') return 'Platform Overview'
  if (path.startsWith('/marketplace')) return 'Marketplace'
  if (path.startsWith('/listings')) return 'My Listings'
  if (path.startsWith('/clients')) return 'My Clients'
  if (path.startsWith('/jobs')) return 'Transport Jobs'
  if (path.startsWith('/orders')) return 'Orders'
  if (path.startsWith('/profile')) return 'Profile'
  if (path.startsWith('/auth')) return 'Authentication'
  return 'VegeLink Ghana'
}

export function Layout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const role = user?.role
  const location = useLocation()

  const visibleNav = NAV_ITEMS.filter((item) => {
    if (item.to === '/overview' && !user) return false
    if (item.to === '/listings' && role !== 'farmer' && role !== 'agent') return false
    if (item.to === '/clients' && role !== 'agent') return false
    if (item.to === '/jobs' && role !== 'transporter') return false
    if (item.to === '/marketplace' && role === 'farmer') return false
    return true
  })

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="VegeLink primary navigation">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true"><Icon name="leaf" /></div>
          <div>
            <p className="eyebrow">VegeLink Ghana</p>
            <h1>Fresh trade, built for the field.</h1>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Platform sections">
          {visibleNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => isActive ? 'active' : undefined}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-panel">
          <p className="panel-label">Session</p>
          <h2>{user ? `${role} account` : 'Not logged in'}</h2>
          <p>{user ? `Phone: ${user.phone}` : 'Log in to access the full platform.'}</p>
          <div className="mini-badges">
            {user ? (
              <><span>Authenticated</span><span>{role}</span></>
            ) : (
              <span>Guest</span>
            )}
          </div>
        </div>
      </aside>

      <main className="content" id="main">
        <header className="topbar">
          <div>
            <h2>{getPageTitle(location.pathname)}</h2>
          </div>
          <div className="topbar-actions">
            <div className="avatar" aria-hidden="true">{user?.phone?.slice(-2) ?? 'VG'}</div>
          </div>
        </header>

        {children}

        <nav className="mobile-nav" aria-label="Mobile shortcuts">
          {visibleNav.slice(0, 4).map((item) => (
            <NavLink key={item.to} to={item.to} end={item.exact}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </main>
    </div>
  )
}
