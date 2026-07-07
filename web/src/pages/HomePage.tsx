import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { useMyOrders } from '../hooks/useOrders'
import { useMyListings, useAllListings } from '../hooks/useListings'
import type { Order, Listing } from '../types/api'
import { Icon } from '../components/Icon'
import { Spinner, StatusBadge } from '../components/ui/Feedback'

const MARKET_PULSE = [
  { crop: 'Tomatoes', price: 'GH₵ 4.50/kg', change: '+8%', accent: '#DC2626', tint: 'rgba(220,38,38,0.08)' },
  { crop: 'Yam',      price: 'GH₵ 15/kg',   change: '+3%', accent: '#B45309', tint: 'rgba(180,83,9,0.08)' },
  { crop: 'Pepper',   price: 'GH₵ 6.00/kg', change: '-2%', accent: '#EF4444', tint: 'rgba(239,68,68,0.08)' },
  { crop: 'Onions',   price: 'GH₵ 3.50/kg', change: '+5%', accent: '#D97706', tint: 'rgba(217,119,6,0.08)' },
]

const PLATFORM_STATS = [
  { value: '4',     label: 'User roles',       sub: 'Farmer · Buyer · Transporter · Agent' },
  { value: '20%',   label: 'GDP contribution', sub: 'Ghana agriculture sector' },
  { value: '$ 3B',  label: 'Annual losses',    sub: 'Post-harvest, addressable' },
  { value: '15 km', label: 'Match radius',     sub: 'PostGIS transporter matching' },
]

const ROLES = [
  { id: 'farmer',      label: 'Farmer',      icon: 'leaf'     as const, bg: 'rgba(214,255,205,0.35)', actions: ['List produce', 'Confirm orders via SMS', 'Receive MoMo payment'] },
  { id: 'buyer',       label: 'Buyer',       icon: 'shopping' as const, bg: 'rgba(214,255,205,0.2)',  actions: ['Browse marketplace', 'Place & pay orders', 'Track delivery live'] },
  { id: 'transporter', label: 'Transporter', icon: 'truck'    as const, bg: 'rgba(143,188,143,0.2)',  actions: ['View nearby jobs', 'Accept deliveries', 'Update live status'] },
  { id: 'agent',       label: 'Agent',       icon: 'user'     as const, bg: 'rgba(38,65,35,0.06)',   actions: ['Register farmers', 'Manage listings', 'Confirm orders on behalf'] },
]

const WORKFLOW = [
  { step: '01', title: 'Register & Verify',   detail: 'Phone number + OTP via Arkesel SMS. No email required.' },
  { step: '02', title: 'List or Browse',      detail: 'Farmers list produce with GPS + photo. Buyers browse and filter.' },
  { step: '03', title: 'Order & Confirm',     detail: 'Buyer places order. Farmer confirms via app, SMS reply, or agent.' },
  { step: '04', title: 'Transport & Deliver', detail: 'Nearest transporter matched via PostGIS. Live status updates.' },
  { step: '05', title: 'Pay via MoMo',        detail: 'Paystack handles MTN, Telecel, AirtelTigo. SMS receipt to both parties.' },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function HomePage() {
  const user = useAuthStore((s) => s.user)
  return user?.role
    ? <AuthenticatedHome role={user.role} firstName={user.fullName?.split(' ')[0] ?? null} />
    : <GuestHome />
}

// ── Authenticated dashboard ───────────────────────────────────────────────────

function AuthenticatedHome({ role, firstName }: { role: string; firstName: string | null }) {
  return (
    <div className="page-stack">
      <AuthHeroBanner role={role} firstName={firstName} />
      <MarketPulseWidget />
      <RoleDashboard role={role} />
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
              {recentListings.map((l: Listing) => (
                <div key={l.id} className="dashboard-row">
                  <StatusBadge status={l.status} />
                  <span style={{ color: '#374151', fontWeight: 600, fontSize: '0.88rem' }}>{l.vegetable_type}</span>
                  <span style={{ color: '#9ca3af', fontSize: '0.8rem', marginLeft: 'auto' }}>GH₵ {l.price_per_kg_ghs}/kg</span>
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

// ── Guest landing ─────────────────────────────────────────────────────────────

function GuestHome() {
  const { data } = useAllListings()
  const listings: Listing[] = Array.isArray(data) ? data.slice(0, 4) : []
  const TINTS   = ['rgba(220,38,38,0.07)', 'rgba(180,83,9,0.07)', 'rgba(22,101,52,0.07)', 'rgba(29,78,216,0.07)']
  const ACCENTS = ['#DC2626', '#B45309', '#166534', '#1D4ED8']

  return (
    <div className="page-stack">
      <section className="overview-hero">
        <div className="overview-hero-copy">
          <span className="status-pill" style={{ alignSelf: 'flex-start' }}>Kumasi Vegetable Belt</span>
          <h2 className="overview-hero-title">VegeLink Ghana</h2>
          <p className="overview-hero-sub">A farmer-to-buyer digital marketplace. Direct connections, smart logistics, mobile money payments — built for the field.</p>
          <div className="hero-actions">
            <Link to="/auth/register" className="primary-button"   style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 22px' }}>Get Started</Link>
            <Link to="/auth/login"    className="secondary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 22px' }}>Log In</Link>
          </div>
        </div>
        <div className="overview-hero-visual" aria-hidden="true">
          <div className="overview-mockup">
            <div className="mockup-bar">
              <span className="mockup-dot" style={{ background: '#ff5f57' }} /><span className="mockup-dot" style={{ background: '#febc2e' }} /><span className="mockup-dot" style={{ background: '#28c840' }} />
              <span style={{ marginLeft: 'auto', fontSize: '0.72rem', opacity: 0.5 }}>vegelink.app</span>
            </div>
            <div className="mockup-body">
              {[{ badge: 'green', label: 'Live', name: 'Fresh Tomatoes', price: 'GH₵ 4.50/kg' }, { badge: 'blue', label: 'In Transit', name: 'Garden Eggs', price: 'GH₵ 18/kg' }, { badge: 'green', label: 'Live', name: 'Onions — Dodowa', price: 'GH₵ 36/kg' }].map((r) => (
                <div key={r.name} className="mockup-row">
                  <span className={`mockup-badge ${r.badge}`}>{r.label}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.name}</span>
                  <span style={{ marginLeft: 'auto', color: '#264123', fontWeight: 700 }}>{r.price}</span>
                </div>
              ))}
              <div className="mockup-divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#6b7280' }}><span>3 active listings</span><span>2 orders pending</span></div>
            </div>
          </div>
        </div>
      </section>

      <div className="stats-grid">
        {PLATFORM_STATS.map((s) => (
          <div key={s.label} className="stat-card">
            <strong>{s.value}</strong>
            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.label}</span>
            <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{s.sub}</span>
          </div>
        ))}
      </div>

      {listings.length > 0 && (
        <section className="section-card">
          <div className="section-heading">
            <div><p className="eyebrow" style={{ color: '#6b7280' }}>Available now</p><h3>Fresh Today</h3></div>
            <Link to="/marketplace" className="secondary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 40, padding: '0 16px', fontSize: '0.85rem' }}>See all →</Link>
          </div>
          <div className="produce-card-grid">
            {listings.map((l, i) => (
              <div key={l.id} className="produce-card">
                <div className="produce-card-visual" style={{ background: TINTS[i % TINTS.length] }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: ACCENTS[i % ACCENTS.length], boxShadow: `0 4px 12px ${ACCENTS[i % ACCENTS.length]}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
                  </div>
                </div>
                <div className="produce-card-body">
                  <p className="produce-card-name">{l.vegetable_type}</p>
                  <p className="produce-card-price">GH₵{l.price_per_kg_ghs}<span className="produce-card-unit"> /kg</span></p>
                  {l.farmer && <p className="produce-card-farmer">{l.farmer.firstName}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section-card">
        <div className="section-heading"><div><p className="eyebrow" style={{ color: '#6b7280' }}>Who it serves</p><h3>Four roles, one platform.</h3></div></div>
        <div className="roles-grid">
          {ROLES.map((r) => (
            <div key={r.id} className="role-card" style={{ background: r.bg, borderColor: '#e5e7eb' }}>
              <div className="role-card-icon" style={{ background: '#264123' }}><Icon name={r.icon} /></div>
              <h4 style={{ color: '#264123', margin: '4px 0', fontFamily: 'Poppins, sans-serif', fontSize: '1rem', fontWeight: 600 }}>{r.label}</h4>
              <ul className="role-card-list">{r.actions.map((a) => <li key={a}>{a}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      <section className="section-card">
        <div className="section-heading"><div><p className="eyebrow" style={{ color: '#6b7280' }}>How it works</p><h3>End-to-end produce journey.</h3></div></div>
        <div className="workflow-list">
          {WORKFLOW.map((w) => (
            <div className="workflow-step" key={w.step}>
              <div className="step-index">{w.step}</div>
              <div><h4 style={{ marginBottom: 4 }}>{w.title}</h4><p style={{ margin: 0 }}>{w.detail}</p></div>
            </div>
          ))}
        </div>
      </section>

      <div className="overview-bottom-grid">
        <div className="section-card">
          <div className="section-heading"><div><p className="eyebrow" style={{ color: '#6b7280' }}>Navigate</p><h3>Quick access.</h3></div></div>
          <div className="quick-links">
            <Link to="/marketplace"   className="quick-link" style={{ textDecoration: 'none' }}><Icon name="shopping" /> Marketplace</Link>
            <Link to="/auth/register" className="quick-link" style={{ textDecoration: 'none' }}><Icon name="user" />     Register</Link>
            <Link to="/auth/login"    className="quick-link" style={{ textDecoration: 'none' }}><Icon name="shield" />   Log In</Link>
          </div>
        </div>
        <div className="section-card" style={{ background: 'rgba(214,255,205,0.25)' }}>
          <p className="eyebrow" style={{ color: '#6b7280', marginBottom: 8 }}>Coverage</p>
          <h3 style={{ margin: '0 0 8px', color: '#264123', fontFamily: 'Poppins, sans-serif' }}>Kumasi Belt</h3>
          <p style={{ margin: '0 0 16px', color: '#374151', fontSize: '0.9rem' }}>Kumasi · Ejisu · Asante Mampong · Offinso · Kwabre East · Bosomtwe</p>
          <div className="mini-badges" style={{ marginTop: 0 }}><span>MTN MoMo</span><span>Telecel Cash</span><span>AirtelTigo</span></div>
        </div>
      </div>
    </div>
  )
}
// Refreshed to trigger language server re-parse
