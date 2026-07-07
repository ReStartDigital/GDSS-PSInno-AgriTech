import { NavLink, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import { Icon } from '../Icon'

const NAV_ITEMS = [
  { to: '/',           label: 'Home',           icon: 'home'     as const, exact: true },
  { to: '/overview',   label: 'Overview',        icon: 'leaf'     as const },
  { to: '/marketplace',label: 'Marketplace',     icon: 'shopping' as const },
  { to: '/listings',   label: 'Listings',        icon: 'bag'      as const },
  { to: '/clients',    label: 'My Clients',      icon: 'user'     as const },
  { to: '/jobs',       label: 'Transport Jobs',  icon: 'truck'    as const },
  { to: '/orders',     label: 'Orders',          icon: 'bag'      as const },
  { to: '/profile',    label: 'Profile',         icon: 'shield'   as const },
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

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatPhone(phone: string) {
  // Format 10-digit Ghana phone: 0244 123 456
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
  return phone
}

export function Layout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const role = user?.role
  const location = useLocation()

  const visibleNav = NAV_ITEMS.filter((item) => {
    if (item.to === '/' && user) return false
    if (item.to === '/overview' && !user) return false
    if (item.to === '/listings' && role !== 'farmer' && role !== 'agent') return false
    if (item.to === '/clients' && role !== 'agent') return false
    if (item.to === '/jobs' && role !== 'transporter') return false
    if (item.to === '/marketplace' && role === 'farmer') return false
    return true
  })

  // Mobile nav shows max 4 items BUT always ensures Profile is included
  const mobileNav = (() => {
    if (visibleNav.length <= 4) return visibleNav
    const profileItem = visibleNav.find(i => i.to === '/profile')
    const rest = visibleNav.filter(i => i.to !== '/profile').slice(0, 3)
    return profileItem ? [...rest, profileItem] : visibleNav.slice(0, 4)
  })()

  return (
    <div className={`app-shell ${!user ? 'guest-shell' : ''}`}>
      {user && (
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
                <span className="sidebar-nav-icon" aria-hidden="true"><Icon name={item.icon} /></span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-panel">
            <p className="panel-label">Session</p>
            <h2>{capitalize(role ?? 'guest')} account</h2>
            <p>{user.phone ? formatPhone(user.phone) : ''}</p>
            <div className="mini-badges">
              <span>Authenticated</span>
              <span>{capitalize(role ?? '')}</span>
            </div>
          </div>
        </aside>
      )}

      <main className="content" id="main">
        <header className="topbar">
          {!user ? (
            <Link to="/" className="topbar-brand" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div className="brand-mark" style={{ width: 36, height: 36, borderRadius: 8, background: '#264123', color: '#d6ffcd', display: 'grid', placeItems: 'center' }} aria-hidden="true">
                <Icon name="leaf" />
              </div>
              <span style={{ fontWeight: 800, color: '#f8faf5', fontSize: '1.25rem', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em' }}>VegeLink</span>
            </Link>
          ) : (
            <div className="topbar-title">
              <h2>{getPageTitle(location.pathname)}</h2>
            </div>
          )}
          {location.pathname === '/' && (
            <nav className="topbar-nav" aria-label="Homepage sections">
              <a href="#hero"     className="topbar-nav-link">Home</a>
              <a href="#browse"   className="topbar-nav-link">Browse</a>
              <a href="#about"    className="topbar-nav-link">About</a>
              <a href="#workflow" className="topbar-nav-link">How it Works</a>
              <a href="#coverage" className="topbar-nav-link">Coverage</a>
            </nav>
          )}
          <div className="topbar-actions">
            {!user ? (
              <>
                <Link to="/auth/login"    className="secondary-button" style={{ minHeight: 38, padding: '0 16px', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', borderRadius: 10 }}>Log In</Link>
                <Link to="/auth/register" className="primary-button"   style={{ minHeight: 38, padding: '0 16px', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', borderRadius: 10 }}>Register</Link>
              </>
            ) : (
              <Link to="/profile" className="avatar" aria-label="Profile" style={{ textDecoration: 'none' }}>
                {user?.phone?.slice(-2) ?? 'VG'}
              </Link>
            )}
          </div>
        </header>

        {children}

        {user && (
          <nav className="mobile-nav" aria-label="Mobile shortcuts">
            {mobileNav.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.exact}>
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        )}
      </main>
    </div>
  )
}
