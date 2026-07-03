import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { useAuthStore } from './store/auth.store'
import { RequireAuth, RedirectIfAuth } from './components/RequireAuth'
import { Icon } from './components/Icon'

import HomePage from './pages/HomePage'
import MarketplacePage from './pages/MarketplacePage'
import ListingsPage from './pages/ListingsPage'
import OrdersPage from './pages/OrdersPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import VerifyPage from './pages/auth/VerifyPage'
import SetPinPage from './pages/auth/SetPinPage'

import './App.css'

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: 'leaf' as const, exact: true },
  { to: '/marketplace', label: 'Marketplace', icon: 'shopping' as const },
  { to: '/listings', label: 'Listings', icon: 'bag' as const },
  { to: '/orders', label: 'Orders', icon: 'truck' as const },
  { to: '/profile', label: 'Profile', icon: 'user' as const },
]

function Layout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const role = user?.role
  const location = useLocation()

  const visibleNav = NAV_ITEMS.filter((item) => {
    if (item.to === '/listings' && role !== 'farmer') return false
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

function getPageTitle(path: string): string {
  if (path === '/') return 'Platform overview'
  if (path.startsWith('/marketplace')) return 'Marketplace'
  if (path.startsWith('/listings')) return 'My Listings'
  if (path.startsWith('/orders')) return 'Orders'
  if (path.startsWith('/profile')) return 'Profile'
  if (path.startsWith('/auth')) return 'Authentication'
  return 'VegeLink Ghana'
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Auth routes — redirect away if already logged in */}
          <Route element={<RedirectIfAuth />}>
            <Route path="/auth/login" element={<Layout><LoginPage /></Layout>} />
            <Route path="/auth/register" element={<Layout><RegisterPage /></Layout>} />
            <Route path="/auth/verify" element={<Layout><VerifyPage /></Layout>} />
            <Route path="/auth/set-pin" element={<Layout><SetPinPage /></Layout>} />
          </Route>

          {/* Public routes */}
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/marketplace" element={<Layout><MarketplacePage /></Layout>} />
          <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />

          {/* Protected routes */}
          <Route element={<RequireAuth />}>
            <Route path="/listings" element={<Layout><ListingsPage /></Layout>} />
            <Route path="/orders" element={<Layout><OrdersPage /></Layout>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
