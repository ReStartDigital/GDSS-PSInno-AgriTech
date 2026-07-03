import { useEffect, useState } from 'react'
import './App.css'
import { Icon } from './components/Icon'
import { appPages, siteNavItems, type PageKey } from './content'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import ListingsPage from './pages/ListingsPage'
import MarketplacePage from './pages/MarketplacePage'
import OrdersPage from './pages/OrdersPage'
import ProfilePage from './pages/ProfilePage'

function resolvePage(hash: string): PageKey {
  const cleaned = hash.replace(/^#\/?/, '')
  return appPages.includes(cleaned as PageKey) ? (cleaned as PageKey) : 'home'
}

function App() {
  const [page, setPage] = useState<PageKey>(() => resolvePage(window.location.hash))

  useEffect(() => {
    const handleHashChange = () => setPage(resolvePage(window.location.hash))

    window.addEventListener('hashchange', handleHashChange)
    handleHashChange()

    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const navigate = (nextPage: PageKey) => {
    window.location.hash = `#/${nextPage}`
  }

  let activePage = <HomePage navigate={navigate} />

  switch (page) {
    case 'auth':
      activePage = <AuthPage navigate={navigate} />
      break
    case 'marketplace':
      activePage = <MarketplacePage navigate={navigate} />
      break
    case 'listings':
      activePage = <ListingsPage navigate={navigate} />
      break
    case 'orders':
      activePage = <OrdersPage navigate={navigate} />
      break
    case 'profile':
      activePage = <ProfilePage navigate={navigate} />
      break
    case 'home':
    default:
      activePage = <HomePage navigate={navigate} />
      break
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="VegeLink primary navigation">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            <Icon name="leaf" />
          </div>
          <div>
            <p className="eyebrow">VegeLink Ghana</p>
            <h1>Fresh trade, built for the field.</h1>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Platform sections">
          {siteNavItems.map((item) => (
            <a
              key={item.key}
              className={page === item.key ? 'active' : undefined}
              href={`#/${item.key}`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="sidebar-panel">
          <p className="panel-label">Session model</p>
          <h2>Cookie-backed refresh flow</h2>
          <p>
            The web client mirrors the backend auth contract: register, verify OTP,
            set PIN, then login with a secure refresh cookie.
          </p>
          <div className="mini-badges">
            <span>OTP SMS</span>
            <span>HttpOnly cookie</span>
            <span>Role gating</span>
          </div>
        </div>
      </aside>

      <main className="content" id="overview">
        <header className="topbar">
          <div>
            <p className="eyebrow">Design system aligned</p>
            <h2>Web pages guided by mobile and backend</h2>
          </div>

          <div className="topbar-actions" aria-label="Quick actions">
            <button type="button" className="icon-button" aria-label="Search platform data">
              <Icon name="spark" />
            </button>
            <button type="button" className="icon-button" aria-label="Notifications">
              <Icon name="shield" />
            </button>
            <div className="avatar" aria-hidden="true">
              VG
            </div>
          </div>
        </header>

        {activePage}

        <nav className="mobile-nav" aria-label="Mobile shortcuts">
          {siteNavItems.slice(0, 4).map((item) => (
            <a key={item.key} href={`#/${item.key}`}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </main>
    </div>
  )
}

export default App