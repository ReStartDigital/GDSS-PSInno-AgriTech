import { useState, useEffect } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import { Icon } from '../Icon'
import type { IconName } from '../Icon'

// ── Nav item definition ────────────────────────────────────────────────────────

interface NavItem {
  to: string
  label: string
  icon: IconName
  exact?: boolean
}

/** Returns role-specific nav items with proper labels */
function getRoleNav(role: string | undefined): NavItem[] {
  const base: NavItem[] = [
    { to: '/overview', label: 'Overview', icon: 'leaf' },
  ]

  switch (role) {
    case 'farmer':
      return [
        ...base,
        { to: '/listings', label: 'My Listings', icon: 'bag' },
        { to: '/orders', label: 'My Orders', icon: 'shopping' },
        { to: '/profile', label: 'Profile', icon: 'user' },
      ]
    case 'buyer':
      return [
        ...base,
        { to: '/marketplace', label: 'Marketplace', icon: 'shopping' },
        { to: '/orders', label: 'My Orders', icon: 'bag' },
        { to: '/profile', label: 'Profile', icon: 'user' },
      ]
    case 'transporter':
      return [
        ...base,
        { to: '/jobs', label: 'Available Jobs', icon: 'truck' },
        { to: '/orders', label: 'My Deliveries', icon: 'bag' },
        { to: '/profile', label: 'Profile', icon: 'user' },
      ]
    case 'agent':
      return [
        ...base,
        { to: '/clients', label: 'My Farmers', icon: 'user' },
        { to: '/marketplace', label: 'Marketplace',     icon: 'shopping' },
        { to: '/profile',     label: 'Profile',         icon: 'shield'   },
      ]
    default:
      return [
        ...base,
        { to: '/marketplace', label: 'Marketplace', icon: 'shopping' },
        { to: '/orders', label: 'Orders', icon: 'bag' },
        { to: '/profile', label: 'Profile', icon: 'user' },
      ]
  }
}



function getPageTitle(path: string, role?: string): string {
  if (path === '/') return 'Home'
  if (path === '/overview') return 'Overview'
  if (path.startsWith('/admin')) return 'Admin Operations'
  if (path.startsWith('/marketplace')) return 'Marketplace'
  if (path.startsWith('/listings')) return role === 'agent' ? 'Client Listings' : 'My Listings'
  if (path.startsWith('/clients')) return 'My Farmers'
  if (path.startsWith('/jobs')) return 'Available Jobs'
  if (path.startsWith('/orders')) return role === 'transporter' ? 'My Deliveries' : 'My Orders'
  if (path.startsWith('/profile')) return 'Profile'
  if (path.startsWith('/auth')) return 'Authentication'
  return 'VegeLink Ghana'
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
  return phone
}

// ── Role accent colors ─────────────────────────────────────────────────────────

const ROLE_ACCENT: Record<string, string> = {
  farmer: '#d6ffcd',
  buyer: '#bfdbfe',
  transporter: '#fde68a',
  agent: '#fca5a5',
}

const ROLE_ICON: Record<string, IconName> = {
  farmer: 'leaf',
  buyer: 'shopping',
  transporter: 'truck',
  agent: 'shield',
}

// ── Layout ────────────────────────────────────────────────────────────────────

export function Layout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const role = user?.role
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  const roleNav = getRoleNav(role)

  // Mobile nav: always include Profile as last item (max 4 items)
  const mobileNav = (() => {
    if (roleNav.length <= 4) return roleNav
    const profile = roleNav.find(i => i.to === '/profile')
    const rest = roleNav.filter(i => i.to !== '/profile').slice(0, 3)
    return profile ? [...rest, profile] : roleNav.slice(0, 4)
  })()

  const roleColor = ROLE_ACCENT[role ?? ''] ?? '#d6ffcd'
  const roleIconName: IconName = ROLE_ICON[role ?? ''] ?? 'leaf'

  return (
    <div className={`app-shell ${!user ? 'guest-shell' : ''}`}>
      {user && (
        <aside className="sidebar" aria-label="VegeLink primary navigation">
          {/* Brand block */}
          <div className="brand-block">
            <div className="brand-mark" aria-hidden="true"><Icon name="leaf" /></div>
            <div>
              <p className="eyebrow">VegeLink Ghana</p>
              <h1>Fresh trade, built for the field.</h1>
            </div>
          </div>

          {/* Role-labelled navigation */}
          <nav className="sidebar-nav" aria-label="Platform sections">
            {roleNav.map((item) => (
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

          {/* Session panel with role color accent */}
          <div className="sidebar-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `${roleColor}22`,
                border: `1px solid ${roleColor}44`,
                display: 'grid', placeItems: 'center',
                color: roleColor, flexShrink: 0,
              }}>
                <Icon name={roleIconName} />
              </div>
              <div>
                <p className="panel-label" style={{ margin: 0 }}>Logged in as</p>
                <h2 style={{ margin: '2px 0 0' }}>{capitalize(role ?? 'user')}</h2>
              </div>
            </div>
            <p style={{ margin: '0 0 12px' }}>{user.phone ? formatPhone(user.phone) : ''}</p>
            <div className="mini-badges">
              <span style={{ background: `${roleColor}18`, borderColor: `${roleColor}30`, color: roleColor }}>
                {capitalize(role ?? '')}
              </span>
              <span>Active</span>
            </div>
          </div>
        </aside>
      )}

      <main className="content" id="main">
        <header className="topbar">
          {/* Left: brand (guest) or page title (auth) */}
          {!user ? (
            <Link to="/" className="topbar-brand" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div className="brand-mark" style={{ width: 36, height: 36, borderRadius: 8, background: '#264123', color: '#d6ffcd', display: 'grid', placeItems: 'center' }} aria-hidden="true">
                <Icon name="leaf" />
              </div>
              <span style={{ fontWeight: 800, color: '#f8faf5', fontSize: '1.25rem', fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.02em' }}>VegeLink</span>
            </Link>
          ) : (
            <div className="topbar-title">
              <h2>{getPageTitle(location.pathname, role)}</h2>
            </div>
          )}

          {/* Center: guest nav menu (when not authenticated) */}
          {!user && (
            <nav className="topbar-nav" aria-label="Guest navigation">
              <NavLink to="/" end className={({ isActive }) => `topbar-nav-link ${isActive ? 'active' : ''}`}>Home</NavLink>
              <NavLink to="/marketplace" className={({ isActive }) => `topbar-nav-link ${isActive ? 'active' : ''}`}>Marketplace</NavLink>
              <NavLink to="/how-it-works" className={({ isActive }) => `topbar-nav-link ${isActive ? 'active' : ''}`}>How it Works</NavLink>
              <NavLink to="/about" className={({ isActive }) => `topbar-nav-link ${isActive ? 'active' : ''}`}>About</NavLink>
              {/* <NavLink to="/admin" className={({ isActive }) => `topbar-nav-link ${isActive ? 'active' : ''}`}>Admin Portal</NavLink> */}
            </nav>
          )}

          {/* Right: auth buttons (guest) or avatar (auth) */}
          <div className="topbar-actions">
            {!user ? (
              <>
                <Link to="/auth/login" className="secondary-button topbar-btn">Log In</Link>
                <Link to="/auth/register" className="primary-button topbar-btn">Register</Link>
              </>
            ) : (
              <Link
                to="/profile"
                className="avatar"
                aria-label="Profile"
                style={{ textDecoration: 'none', background: roleColor, color: '#264123', fontWeight: 800 }}
              >
                {user?.phone?.slice(-2) ?? 'VG'}
              </Link>
            )}
          </div>

          {/* Hamburger toggle button (visible only on mobile for guest view) */}
          {!user && (
            <button
              type="button"
              className="topbar-hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-label="Toggle navigation menu"
            >
              <Icon name={menuOpen ? 'close' : 'menu'} />
            </button>
          )}
        </header>

        {/* Mobile Dropdown menu (guest only, when open) */}
        {!user && menuOpen && (
          <div className="topbar-mobile-menu">
            <nav className="mobile-menu-nav">
              <NavLink to="/" end className={({ isActive }) => `mobile-menu-link ${isActive ? 'active' : ''}`}>Home</NavLink>
              <NavLink to="/marketplace" className={({ isActive }) => `mobile-menu-link ${isActive ? 'active' : ''}`}>Marketplace</NavLink>
              <NavLink to="/how-it-works" className={({ isActive }) => `mobile-menu-link ${isActive ? 'active' : ''}`}>How it Works</NavLink>
              <NavLink to="/about" className={({ isActive }) => `mobile-menu-link ${isActive ? 'active' : ''}`}>About</NavLink>
              {/* <NavLink to="/admin" className={({ isActive }) => `mobile-menu-link ${isActive ? 'active' : ''}`}>Admin Portal</NavLink> */}
            </nav>
            <div className="mobile-menu-actions">
              <Link to="/auth/login" className="secondary-button mobile-menu-btn">Log In</Link>
              <Link to="/auth/register" className="primary-button mobile-menu-btn">Register</Link>
            </div>
          </div>
        )}

        {children}

        {/* Mobile bottom nav — role-specific items, Profile always visible */}
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
