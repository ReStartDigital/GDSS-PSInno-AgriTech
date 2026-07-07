import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { useAllListings } from '../hooks/useListings'
import type { Listing } from '../types/api'
import { Icon } from '../components/Icon'
import { Spinner, ErrorAlert, EmptyState } from '../components/ui/Feedback'
import { getCropConfig, AgriRing, FreshnessBar, OrderModal, PRODUCE_FILTERS } from '../lib/produceUtils'

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

export default function HomePage() {
  const [filter, setFilter]     = useState('All')
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState<Listing | null>(null)

  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const params = filter !== 'All' ? { vegetable_type: filter } : undefined
  const { data, isLoading, error } = useAllListings(params)

  const listings = useMemo(() => {
    const all: Listing[] = Array.isArray(data) ? data : []
    if (!search.trim()) return all
    return all.filter((l) =>
      l.vegetable_type.toLowerCase().includes(search.toLowerCase()) ||
      l.farmer?.firstName?.toLowerCase().includes(search.toLowerCase())
    )
  }, [data, search])

  return (
    <div className="page-stack">
      {/* ── Hero Banner ── */}
      <section className="overview-hero" id="hero">
        <div className="overview-hero-copy">
          <span className="status-pill" style={{ alignSelf: 'flex-start' }}>Kumasi Vegetable Belt</span>
          <h2 className="overview-hero-title">VegeLink Ghana</h2>
          <p className="overview-hero-sub">
            A farmer-to-buyer digital marketplace. Direct connections, smart logistics, mobile money payments — built for the field.
          </p>
          {!user && (
            <div className="hero-actions">
              <Link to="/auth/register" className="primary-button"   style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 22px' }}>Get Started</Link>
              <Link to="/auth/login"    className="secondary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 22px' }}>Log In</Link>
            </div>
          )}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#6b7280' }}>
                <span>Active Listings</span>
                <span>Real-time GPS Match</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Grid ── */}
      <div className="stats-grid">
        {PLATFORM_STATS.map((s) => (
          <div key={s.label} className="stat-card">
            <strong>{s.value}</strong>
            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.label}</span>
            <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{s.sub}</span>
          </div>
        ))}
      </div>

      {/* ── Dynamic Produce Browser ── */}
      <section className="section-card" id="browse">
        <div className="section-heading" style={{ flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p className="eyebrow" style={{ color: '#6b7280' }}>Available now</p>
            <h3 style={{ margin: 0 }}>Browse Produce</h3>
          </div>

          {/* Search bar — uses search icon, styled for light background */}
          <div className="mp-search-wrap" style={{ minWidth: 240, flex: 1, maxWidth: 380, margin: 0 }}>
            <span className="mp-search-icon mp-search-icon--light"><Icon name="search" /></span>
            <input
              className="mp-search mp-search--light"
              type="search"
              placeholder="Search produce or farmer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Filter strip */}
        <div className="mp-filter-strip" style={{ marginTop: 10, paddingBottom: 6 }}>
          {PRODUCE_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={`mp-filter-chip ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f !== 'All' && <span>{getCropConfig(f).emoji}</span>}
              {f}
            </button>
          ))}
        </div>

        {/* Results grid */}
        {isLoading && <Spinner />}
        {error && <ErrorAlert message="Could not load produce listings." />}
        {!isLoading && !error && listings.length === 0 && (
          <EmptyState message={search ? `No results for "${search}"` : 'No listings available right now.'} />
        )}

        {listings.length > 0 && (
          <div className="mp-card-grid" style={{ marginTop: 20 }}>
            {listings.map((listing) => {
              const cfg = getCropConfig(listing.vegetable_type)
              return (
                <article key={listing.id} className="mp-card">
                  <div className="mp-card-visual" style={{ background: cfg.tint }}>
                    <span className="mp-card-emoji">{cfg.emoji}</span>
                    {listing.agriScore && (
                      <div className="mp-agriscore" title={`AgriScore: ${listing.agriScore}`}>
                        <AgriRing score={listing.agriScore} />
                      </div>
                    )}
                    {listing.isUrgent && (
                      <span className="mp-urgent-badge">🔥 Urgent</span>
                    )}
                  </div>
                  <div className="mp-card-body">
                    {listing.freshness && (
                      <div style={{ marginBottom: 8 }}>
                        <FreshnessBar freshness={listing.freshness} />
                      </div>
                    )}
                    <h3 className="mp-card-name">{listing.vegetable_type}</h3>
                    {listing.farmer && (
                      <p className="mp-card-farmer">
                        <span style={{ opacity: 0.5, marginRight: 4 }}>by</span>
                        {listing.farmer.firstName}
                      </p>
                    )}
                    <div className="mp-card-meta">
                      <div>
                        <span className="mp-card-price">GH₵ {listing.price_per_kg_ghs}</span>
                        <span className="mp-card-per"> /kg</span>
                      </div>
                      <div className="mp-card-qty">
                        <span>{listing.quantity_kg} kg</span>
                      </div>
                    </div>
                    {listing.harvest_date && (
                      <p className="mp-card-date">
                        <span style={{ opacity: 0.55 }}>Harvest:</span>{' '}
                        {new Date(listing.harvest_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}

                    {user?.role === 'buyer' ? (
                      <button
                        type="button"
                        className="mp-order-btn"
                        onClick={() => setSelected(listing)}
                        style={{ background: cfg.accent }}
                      >
                        Place Order
                      </button>
                    ) : !user ? (
                      <button
                        type="button"
                        className="mp-order-btn"
                        onClick={() => navigate('/auth/login')}
                        style={{ background: '#264123' }}
                      >
                        Log in to Order
                      </button>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Who it Serves ── */}
      <section className="section-card" id="about">
        <div className="section-heading">
          <div>
            <p className="eyebrow" style={{ color: '#6b7280' }}>Who it serves</p>
            <h3>Four roles, one platform.</h3>
          </div>
        </div>
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

      {/* ── How it Works ── */}
      <section className="section-card" id="workflow">
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
              <div><h4 style={{ marginBottom: 4 }}>{w.title}</h4><p style={{ margin: 0 }}>{w.detail}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom Info & Coverage ── */}
      <div className="overview-bottom-grid" id="coverage">
        <div className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow" style={{ color: '#6b7280' }}>Navigate</p>
              <h3>Quick access.</h3>
            </div>
          </div>
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

      {selected && (
        <OrderModal listing={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
