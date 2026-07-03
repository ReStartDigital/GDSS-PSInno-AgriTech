import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { useMyOrders } from '../hooks/useOrders'
import { useMyListings } from '../hooks/useListings'
import { Icon } from '../components/Icon'
import { Spinner, StatusBadge } from '../components/ui/Feedback'

const PLATFORM_STATS = [
  { value: '4', label: 'User roles', sub: 'Farmer, buyer, transporter, agent' },
  { value: '20%', label: 'GDP contribution', sub: 'Ghana agriculture sector' },
  { value: '$3B', label: 'Annual losses', sub: 'Post-harvest, addressable' },
  { value: '15km', label: 'Match radius', sub: 'PostGIS transporter matching' },
]

const ROLES = [
  {
    id: 'farmer',
    label: 'Farmer',
    icon: 'leaf' as const,
    color: '#264123',
    bg: 'rgba(214,255,205,0.35)',
    border: '#e5e7eb',
    actions: ['List produce', 'Confirm orders via SMS', 'Receive MoMo payment'],
  },
  {
    id: 'buyer',
    label: 'Buyer',
    icon: 'shopping' as const,
    color: '#264123',
    bg: 'rgba(214,255,205,0.2)',
    border: '#e5e7eb',
    actions: ['Browse marketplace', 'Place & pay orders', 'Track delivery live'],
  },
  {
    id: 'transporter',
    label: 'Transporter',
    icon: 'truck' as const,
    color: '#264123',
    bg: 'rgba(143,188,143,0.2)',
    border: '#e5e7eb',
    actions: ['View nearby jobs', 'Accept deliveries', 'Update live status'],
  },
  {
    id: 'agent',
    label: 'Agent',
    icon: 'user' as const,
    color: '#264123',
    bg: 'rgba(38,65,35,0.06)',
    border: '#e5e7eb',
    actions: ['Register farmers', 'Manage listings', 'Confirm orders on behalf'],
  },
]

const WORKFLOW = [
  { step: '01', title: 'Register & Verify', detail: 'Phone number + OTP via Arkesel SMS. No email required.' },
  { step: '02', title: 'List or Browse', detail: 'Farmers list produce with GPS + photo. Buyers browse and filter.' },
  { step: '03', title: 'Order & Confirm', detail: 'Buyer places order. Farmer confirms via app, SMS reply, or agent.' },
  { step: '04', title: 'Transport & Deliver', detail: 'Nearest transporter matched via PostGIS. Live status updates.' },
  { step: '05', title: 'Pay via MoMo', detail: 'Paystack handles MTN, Telecel, AirtelTigo. SMS receipt to both parties.' },
]

export default function HomePage() {
  const user = useAuthStore((s) => s.user)
  const role = user?.role

  return (
    <div className="page-stack">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="overview-hero">
        <div className="overview-hero-copy">
          <span className="status-pill" style={{ alignSelf: 'flex-start' }}>
            {role ? `Signed in as ${role}` : 'Greater Accra Vegetable Belt'}
          </span>
          <h2 className="overview-hero-title">
            VegeLink Ghana
          </h2>
          <p className="overview-hero-sub">
            A farmer-to-buyer digital marketplace for the Greater Accra Vegetable Belt.
            Direct connections, smart logistics, mobile money payments — built for the field.
          </p>
          <div className="hero-actions">
            {!role && (
              <>
                <Link to="/auth/register" className="primary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 22px' }}>
                  Get Started
                </Link>
                <Link to="/auth/login" className="secondary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 22px' }}>
                  Log In
                </Link>
              </>
            )}
            {role === 'farmer' && (
              <>
                <Link to="/listings" className="primary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 22px' }}>
                  My Listings
                </Link>
                <Link to="/orders" className="secondary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 22px' }}>
                  View Orders
                </Link>
              </>
            )}
            {role === 'buyer' && (
              <>
                <Link to="/marketplace" className="primary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 22px' }}>
                  Browse Marketplace
                </Link>
                <Link to="/orders" className="secondary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 22px' }}>
                  My Orders
                </Link>
              </>
            )}
            {(role === 'transporter' || role === 'agent') && (
              <Link to="/orders" className="primary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 22px' }}>
                View Orders
              </Link>
            )}
          </div>
        </div>

        <div className="overview-hero-visual" aria-hidden="true">
          <div className="overview-mockup">
            <div className="mockup-bar">
              <span className="mockup-dot" style={{ background: '#ff5f57' }} />
              <span className="mockup-dot" style={{ background: '#febc2e' }} />
              <span className="mockup-dot" style={{ background: '#28c840' }} />
              <span style={{ marginLeft: 'auto', fontSize: '0.72rem', opacity: 0.5 }}>vegelink.app</span>
            </div>
            <div className="mockup-body">
              <div className="mockup-row">
                <span className="mockup-badge green">Live</span>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Fresh Tomatoes</span>
                <span style={{ marginLeft: 'auto', color: '#264123', fontWeight: 700 }}>GH₵ 28/kg</span>
              </div>
              <div className="mockup-row">
                <span className="mockup-badge blue">In Transit</span>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Garden Eggs</span>
                <span style={{ marginLeft: 'auto', color: '#264123', fontWeight: 700 }}>GH₵ 18/kg</span>
              </div>
              <div className="mockup-row">
                <span className="mockup-badge green">Live</span>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Onions — Dodowa</span>
                <span style={{ marginLeft: 'auto', color: '#264123', fontWeight: 700 }}>GH₵ 36/kg</span>
              </div>
              <div className="mockup-divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#6b7280' }}>
                <span>3 active listings</span>
                <span>2 orders pending</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Platform Stats ───────────────────────────────────────────── */}
      <div className="stats-grid">
        {PLATFORM_STATS.map((s) => (
          <div key={s.label} className="stat-card">
            <strong>{s.value}</strong>
            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.label}</span>
            <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{s.sub}</span>
          </div>
        ))}
      </div>

      {/* ── Live Dashboard (authenticated users only) ────────────────── */}
      {role && <DashboardSummary role={role} />}

      {/* ── Roles ────────────────────────────────────────────────────── */}
      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow" style={{ color: '#6b7280' }}>Who it serves</p>
            <h3>Four roles, one platform.</h3>
          </div>
        </div>
        <div className="roles-grid">
          {ROLES.map((r) => (
            <div key={r.id} className="role-card" style={{ background: r.bg, borderColor: r.border }}>
              <div className="role-card-icon" style={{ background: '#264123' }}>
                <Icon name={r.icon} />
              </div>
              <h4 style={{ color: '#264123', margin: '4px 0 4px', fontFamily: 'Poppins, sans-serif', fontSize: '1rem', fontWeight: 600 }}>{r.label}</h4>
              <ul className="role-card-list">
                {r.actions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Workflow ─────────────────────────────────────────────────── */}
      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow" style={{ color: '#6b7280' }}>How it works</p>
            <h3>End-to-end produce journey.</h3>
          </div>
        </div>
        <div className="workflow-list">
          {WORKFLOW.map((w) => (
            <div className="workflow-step" key={w.step}>
              <div className="step-index">{w.step}</div>
              <div>
                <h4 style={{ marginBottom: 4 }}>{w.title}</h4>
                <p style={{ margin: 0 }}>{w.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom row: Quick Links + Coverage ────────────────────── */}
      <div className="overview-bottom-grid">
        <div className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow" style={{ color: '#6b7280' }}>Navigate</p>
              <h3>Quick access.</h3>
            </div>
          </div>
          <div className="quick-links">
            <Link to="/marketplace" className="quick-link" style={{ textDecoration: 'none' }}><Icon name="shopping" /> Marketplace</Link>
            <Link to="/listings" className="quick-link" style={{ textDecoration: 'none' }}><Icon name="bag" /> Listings</Link>
            <Link to="/orders" className="quick-link" style={{ textDecoration: 'none' }}><Icon name="truck" /> Orders</Link>
            <Link to="/profile" className="quick-link" style={{ textDecoration: 'none' }}><Icon name="user" /> Profile</Link>
          </div>
        </div>

        <div className="section-card" style={{ background: 'rgba(214,255,205,0.25)' }}>
          <p className="eyebrow" style={{ color: '#6b7280', marginBottom: 8 }}>Coverage</p>
          <h3 style={{ margin: '0 0 8px', color: '#264123', fontFamily: 'Poppins, sans-serif' }}>Greater Accra Belt</h3>
          <p style={{ margin: '0 0 16px', color: '#4b5563', fontSize: '0.9rem' }}>
            Dawhenya · Afienya · Dodowa · Madina · Tema West · Shai Osudoku
          </p>
          <div className="mini-badges" style={{ marginTop: 0 }}>
            <span>MTN MoMo</span>
            <span>Telecel Cash</span>
            <span>AirtelTigo</span>
          </div>
        </div>
      </div>

    </div>
  )
}

function DashboardSummary({ role }: { role: string }) {
  const { data: orders, isLoading: ordersLoading } = useMyOrders()
  const { data: listings, isLoading: listingsLoading } = useMyListings()

  const recentOrders = Array.isArray(orders) ? orders.slice(0, 3) : []
  const recentListings = Array.isArray(listings) ? listings.slice(0, 3) : []

  return (
    <section className="section-card" style={{ background: 'linear-gradient(135deg, rgba(38,65,35,0.04), rgba(255,255,255,0.95))' }}>
      <div className="section-heading">
        <div>
          <p className="eyebrow" style={{ color: '#6b7280' }}>Your activity</p>
          <h3>Dashboard summary.</h3>
        </div>
        <Link to="/orders" className="secondary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 40, padding: '0 16px', fontSize: '0.85rem' }}>
          View all orders
        </Link>
      </div>

      <div className="dashboard-grid">
        {(role === 'farmer' || role === 'buyer' || role === 'transporter') && (
          <div className="dashboard-panel">
            <p className="dashboard-panel-label">Recent Orders</p>
            {ordersLoading ? <Spinner /> : recentOrders.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '0.9rem', padding: '12px 0' }}>No orders yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {recentOrders.map((o: any) => (
                  <Link to={`/orders/${o.id}`} key={o.id} style={{ textDecoration: 'none' }}>
                    <div className="dashboard-row">
                      <StatusBadge status={o.status} />
                      <span style={{ color: '#374151', fontWeight: 600, fontSize: '0.88rem' }}>
                        GH₵ {o.total_ghs ?? o.totalAmount}
                      </span>
                      <span style={{ color: '#9ca3af', fontSize: '0.8rem', marginLeft: 'auto' }}>
                        {o.quantity_kg ?? o.quantityOrdered} kg
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {role === 'farmer' && (
          <div className="dashboard-panel">
            <p className="dashboard-panel-label">My Listings</p>
            {listingsLoading ? <Spinner /> : recentListings.length === 0 ? (
              <div style={{ padding: '12px 0' }}>
                <p style={{ color: '#9ca3af', fontSize: '0.9rem', margin: '0 0 12px' }}>No listings yet.</p>
                <Link to="/listings" className="primary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 40, padding: '0 16px', fontSize: '0.85rem' }}>
                  Create first listing
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {recentListings.map((l: any) => (
                  <div key={l.id} className="dashboard-row">
                    <StatusBadge status={l.status ?? 'active'} />
                    <span style={{ color: '#374151', fontWeight: 600, fontSize: '0.88rem' }}>
                      {l.vegetable_type ?? l.cropName}
                    </span>
                    <span style={{ color: '#9ca3af', fontSize: '0.8rem', marginLeft: 'auto' }}>
                      GH₵ {l.price_per_kg_ghs ?? l.pricePerUnit}/kg
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {role === 'buyer' && (
          <div className="dashboard-panel">
            <p className="dashboard-panel-label">Marketplace</p>
            <p style={{ color: '#4b5563', fontSize: '0.9rem', margin: '0 0 16px' }}>
              Browse fresh produce from farmers across the Greater Accra Vegetable Belt.
            </p>
            <Link to="/marketplace" className="primary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 40, padding: '0 16px', fontSize: '0.85rem' }}>
              Browse now
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
