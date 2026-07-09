import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { useMyOrders } from '../hooks/useOrders'
import { useMyListings } from '../hooks/useListings'
import type { Order, ListingResponse } from '../types/api'
import { Icon } from '../components/Icon'
import { Spinner, StatusBadge } from '../components/ui/Feedback'
import { MARKET_PULSE } from '../lib/produceUtils'


function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function OverviewPage() {
  const user = useAuthStore((s) => s.user)
  
  if (!user || !user.role) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: '#9ca3af' }}>Please log in to view your overview dashboard.</p>
        <Link to="/auth/login" className="primary-button" style={{ textDecoration: 'none', display: 'inline-flex', marginTop: 14 }}>Log In</Link>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <AuthHeroBanner role={user.role} firstName={user.fullName?.split(' ')[0] ?? null} />
      <MarketPulseWidget />
      <RoleDashboard role={user.role} />
    </div>
  )
}

function AuthHeroBanner({ role, firstName }: { role: string; firstName: string | null }) {
  const tiles: { label: string; icon: Parameters<typeof Icon>[0]['name']; to: string; bg: string; color: string }[] = [
    { label: 'Marketplace', icon: 'shopping', to: '/marketplace', bg: '#ECFDF3', color: '#166534' },
    { label: 'My Orders',   icon: 'truck',    to: '/orders',      bg: '#FFF8E1', color: '#92400E' },
    { label: 'Listings',    icon: 'bag',      to: '/listings',    bg: '#EFF6FF', color: '#1D4ED8' },
    { label: 'Profile',     icon: 'user',     to: '/profile',     bg: '#FFF1F2', color: '#BE123C' },
  ]
  return (
    <section className="auth-hero-banner">
      <div className="auth-hero-circle auth-hero-circle--1" />
      <div className="auth-hero-circle auth-hero-circle--2" />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <span className="status-pill" style={{ alignSelf: 'flex-start', background: 'rgba(214,255,205,0.2)', borderColor: 'rgba(214,255,205,0.3)', color: '#d6ffcd' }}>
          {role.charAt(0).toUpperCase() + role.slice(1)} account
        </span>
        <h2 style={{ margin: '12px 0 4px', color: '#fff', fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800 }}>
          {getGreeting()}{firstName ? `, ${firstName}` : ''}
        </h2>
        <p style={{ margin: 0, color: 'rgba(214,255,205,0.8)', fontSize: '0.95rem' }}>Welcome back to VegeLink Ghana</p>
      </div>
      <div className="quick-actions-row">
        {tiles.map((a) => (
          <Link key={a.label} to={a.to} className="quick-action-tile" style={{ textDecoration: 'none' }}>
            <div className="quick-action-icon" style={{ background: a.bg }}>
              <span style={{ color: a.color, display: 'flex' }}><Icon name={a.icon} /></span>
            </div>
            <span className="quick-action-label">{a.label}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function MarketPulseWidget() {
  return (
    <section className="section-card">
      <div className="section-heading">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(249,115,22,0.1)', display: 'grid', placeItems: 'center' }}><Icon name="pulse" /></div>
          <div><p className="eyebrow" style={{ color: '#6b7280' }}>Live prices</p><h3 style={{ margin: 0 }}>Market Pulse</h3></div>
        </div>
        <span style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: 600 }}>Today</span>
      </div>
      <div className="pulse-grid">
        {MARKET_PULSE.map((item) => (
          <div key={item.crop} className="pulse-card" style={{ borderColor: item.accent + '22', background: item.tint }}>
            <div className="pulse-dot" style={{ background: item.accent }} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#1f2937' }}>{item.crop}</p>
              <p style={{ margin: '2px 0 0', fontWeight: 800, fontSize: '1.05rem', color: '#264123' }}>{item.price}</p>
            </div>
            <span className={`pulse-change ${item.change.startsWith('+') ? 'up' : 'down'}`}>{item.change}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function RoleDashboard({ role }: { role: string }) {
  const { data: orders, isLoading: ordersLoading } = useMyOrders()
  const { data: listings, isLoading: listingsLoading } = useMyListings()
  const recentOrders   = Array.isArray(orders)   ? orders.slice(0, 5)   : []
  const recentListings = Array.isArray(listings) ? listings.slice(0, 5) : []

  return (
    <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
      {/* Orders — all roles */}
      <div className="dashboard-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <p className="dashboard-panel-label" style={{ margin: 0 }}>Recent Orders</p>
          <Link to="/orders" style={{ fontSize: '0.78rem', color: '#264123', fontWeight: 700, textDecoration: 'none' }}>View all →</Link>
        </div>
        {ordersLoading ? <Spinner /> : recentOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ color: '#9ca3af', fontSize: '0.9rem', margin: '0 0 14px' }}>No orders yet.</p>
            {role === 'buyer' && <Link to="/marketplace" className="primary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 40, padding: '0 16px', fontSize: '0.85rem' }}>Browse Produce</Link>}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {recentOrders.map((o: Order) => (
              <Link to="/orders" key={o.id} style={{ textDecoration: 'none' }}>
                <div className="dashboard-row">
                  <StatusBadge status={o.status} />
                  <span style={{ color: '#374151', fontWeight: 600, fontSize: '0.88rem' }}>GH₵ {o.total_ghs}</span>
                  <span style={{ color: '#9ca3af', fontSize: '0.8rem', marginLeft: 'auto' }}>{o.quantity_kg} kg</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {role === 'farmer' && (
        <div className="dashboard-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p className="dashboard-panel-label" style={{ margin: 0 }}>My Listings</p>
            <Link to="/listings" style={{ fontSize: '0.78rem', color: '#264123', fontWeight: 700, textDecoration: 'none' }}>Manage →</Link>
          </div>
          {listingsLoading ? <Spinner /> : recentListings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: '#9ca3af', fontSize: '0.9rem', margin: '0 0 14px' }}>No listings yet.</p>
              <Link to="/listings" className="primary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 40, padding: '0 16px', fontSize: '0.85rem' }}>Create first listing</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {recentListings.map((l: ListingResponse) => (
                <div key={l.id} className="dashboard-row">
                  <StatusBadge status={l.status} />
                  <span style={{ color: '#374151', fontWeight: 600, fontSize: '0.88rem' }}>{l.vegetableType}</span>
                  <span style={{ color: '#9ca3af', fontSize: '0.8rem', marginLeft: 'auto' }}>GH₵ {l.pricePerKgGhs}/kg</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {role === 'buyer' && (
        <div className="dashboard-panel" style={{ background: 'rgba(214,255,205,0.18)', borderColor: 'rgba(38,65,35,0.12)' }}>
          <p className="dashboard-panel-label">Browse Produce</p>
          <p style={{ color: '#374151', fontSize: '0.9rem', margin: '0 0 16px', lineHeight: 1.6 }}>Fresh produce from farmers across the Kumasi Vegetable Belt — order direct.</p>
          <Link to="/marketplace" className="primary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 40, padding: '0 16px', fontSize: '0.85rem' }}>Browse now</Link>
        </div>
      )}

      {role === 'transporter' && (
        <div className="dashboard-panel" style={{ background: 'rgba(239,246,255,0.6)', borderColor: 'rgba(29,78,216,0.12)' }}>
          <p className="dashboard-panel-label">Transport Jobs</p>
          <p style={{ color: '#374151', fontSize: '0.9rem', margin: '0 0 16px', lineHeight: 1.6 }}>Available delivery jobs near you — claim a job, start transit, confirm delivery.</p>
          <Link to="/jobs" className="primary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 40, padding: '0 16px', fontSize: '0.85rem' }}>View Jobs</Link>
        </div>
      )}

      {role === 'agent' && (
        <div className="dashboard-panel">
          <p className="dashboard-panel-label">Client Management</p>
          <p style={{ color: '#374151', fontSize: '0.9rem', margin: '0 0 16px', lineHeight: 1.6 }}>Register and manage farmer clients, create listings on their behalf.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/clients"  className="primary-button"   style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 40, padding: '0 16px', fontSize: '0.85rem' }}>My Clients</Link>
            <Link to="/listings" className="secondary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 40, padding: '0 16px', fontSize: '0.85rem' }}>Client Listings</Link>
          </div>
        </div>
      )}
    </div>
  )
}
