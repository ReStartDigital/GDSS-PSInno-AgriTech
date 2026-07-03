import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { useMyOrders } from '../hooks/useOrders'
import { useMyListings } from '../hooks/useListings'
import { Icon } from '../components/Icon'
import { Spinner, StatusBadge } from '../components/ui/Feedback'

export default function HomePage() {
  const user = useAuthStore((s) => s.user)
  const role = user?.role

  return (
    <div className="page-stack">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="status-pill">{role ? `Logged in as ${role}` : 'VegeLink Ghana'}</span>
          <h2>
            {role === 'farmer' && 'Manage your listings and orders.'}
            {role === 'buyer' && 'Browse fresh produce from local farms.'}
            {role === 'transporter' && 'Find and accept delivery jobs.'}
            {role === 'agent' && 'Manage your farmers and pending orders.'}
            {!role && 'Fresh trade, built for the field.'}
          </h2>
          <p>Greater Accra Vegetable Belt — connecting farms to tables.</p>
          <div className="hero-actions">
            {role === 'farmer' && <Link to="/listings/new" className="primary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 18px', borderRadius: 18 }}>Create Listing</Link>}
            {role === 'buyer' && <Link to="/marketplace" className="primary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 18px', borderRadius: 18 }}>Browse Marketplace</Link>}
            {role === 'transporter' && <Link to="/orders" className="primary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 18px', borderRadius: 18 }}>View Jobs</Link>}
            {!role && <Link to="/auth/login" className="primary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 18px', borderRadius: 18 }}>Get Started</Link>}
            <Link to="/orders" className="secondary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 18px', borderRadius: 18 }}>View Orders</Link>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="device-card device-card-large">
            <div className="device-header"><span>Live marketplace</span><span className="dot" /></div>
            <div className="metric-row"><strong>Fresh tomatoes</strong><span>GH₵ 28 / crate</span></div>
            <div className="visual-strip" />
          </div>
          <div className="device-card device-card-small">
            <span className="mini-title">Platform</span>
            <strong>4 roles supported</strong>
            <p>Farmer, buyer, transporter, agent.</p>
          </div>
        </div>
      </section>

      {role && <DashboardSummary role={role} />}

      <section className="section-card">
        <div className="section-heading">
          <div><p className="eyebrow">Quick access</p><h3>Jump to a section.</h3></div>
        </div>
        <div className="quick-links">
          <Link to="/marketplace" className="quick-link" style={{ textDecoration: 'none' }}><Icon name="shopping" /> Marketplace</Link>
          <Link to="/listings" className="quick-link" style={{ textDecoration: 'none' }}><Icon name="bag" /> Listings</Link>
          <Link to="/orders" className="quick-link" style={{ textDecoration: 'none' }}><Icon name="truck" /> Orders</Link>
          <Link to="/profile" className="quick-link" style={{ textDecoration: 'none' }}><Icon name="user" /> Profile</Link>
        </div>
      </section>
    </div>
  )
}

function DashboardSummary({ role }: { role: string }) {
  const { data: orders, isLoading: ordersLoading } = useMyOrders()
  const { data: listings, isLoading: listingsLoading } = useMyListings()

  const recentOrders = Array.isArray(orders) ? orders.slice(0, 3) : []
  const recentListings = Array.isArray(listings) ? listings.slice(0, 3) : []

  return (
    <section className="panel-grid">
      {(role === 'farmer' || role === 'buyer') && (
        <div className="section-card">
          <div className="section-heading">
            <div><p className="eyebrow">Recent</p><h3>Your orders.</h3></div>
            <Link to="/orders" className="section-note" style={{ textDecoration: 'none' }}>View all</Link>
          </div>
          {ordersLoading ? <Spinner /> : recentOrders.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No orders yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {recentOrders.map((o: any) => (
                <Link to={`/orders/${o.id}`} key={o.id} style={{ textDecoration: 'none' }}>
                  <div className="listing-card" style={{ padding: '14px 16px' }}>
                    <div className="listing-top">
                      <StatusBadge status={o.status} />
                      <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{o.id?.slice(0, 8)}…</span>
                    </div>
                    <div className="listing-meta" style={{ marginTop: 8 }}>
                      <span style={{ fontWeight: 600 }}>GH₵ {o.total_ghs ?? o.totalAmount}</span>
                      <span>{o.quantity_kg ?? o.quantityOrdered} kg</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {role === 'farmer' && (
        <div className="section-card">
          <div className="section-heading">
            <div><p className="eyebrow">Inventory</p><h3>Your listings.</h3></div>
            <Link to="/listings" className="section-note" style={{ textDecoration: 'none' }}>View all</Link>
          </div>
          {listingsLoading ? <Spinner /> : recentListings.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No listings yet. <Link to="/listings/new">Create one</Link></p>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {recentListings.map((l: any) => (
                <div key={l.id} className="listing-card" style={{ padding: '14px 16px' }}>
                  <div className="listing-top">
                    <StatusBadge status={l.status} />
                    <Icon name="leaf" />
                  </div>
                  <div style={{ fontWeight: 600, marginTop: 8 }}>{l.vegetable_type ?? l.cropName}</div>
                  <div className="listing-meta">
                    <span>GH₵ {l.price_per_kg_ghs ?? l.pricePerUnit}/kg</span>
                    <span>{l.quantity_kg ?? l.availableQuantity} kg</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
