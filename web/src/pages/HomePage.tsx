import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'
import { useAllListings } from '../hooks/useListings'
import type { ListingResponse } from '../types/api'
import { Icon } from '../components/Icon'
import { Spinner, ErrorAlert, EmptyState } from '../components/ui/Feedback'
import { getCropConfig, AgriRing, FreshnessBar, OrderModal, PRODUCE_FILTERS } from '../lib/produceUtils'

const TRUST_VALS = [
  { emoji: '🚜', title: 'Direct Farm Sourcing', desc: 'No middleman price hikes. Sourced straight from local growers in Kumasi.' },
  { emoji: '🛡️', title: 'Quality & Freshness Graded', desc: 'Calculated AgriScore & freshness scale based on harvest timing.' },
  { emoji: '💰', title: 'Seamless Mobile Money', desc: 'Integrated checkout supporting MTN MoMo, Telecel Cash, and AirtelTigo.' },
]

export default function HomePage() {
  const [filter, setFilter]     = useState('All')
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState<ListingResponse | null>(null)

  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const params = filter !== 'All' ? { vegetable_type: filter } : undefined
  const { data, isLoading, error } = useAllListings(params)

  const listings = useMemo(() => {
    const all: ListingResponse[] = Array.isArray(data) ? data : []
    if (!search.trim()) return all
    return all.filter((l) =>
      l.vegetableType.toLowerCase().includes(search.toLowerCase()) ||
      l.farmer?.firstName?.toLowerCase().includes(search.toLowerCase())
    )
  }, [data, search])


  return (
    <div className="page-stack">
      {/* ── Commerce Hero Section ── */}
      <section className="overview-hero" style={{ padding: '48px 36px', background: 'linear-gradient(135deg, #264123 0%, #152613 100%)', border: 'none', color: '#f8faf5' }}>
        <div className="overview-hero-copy" style={{ flex: 1.2 }}>
          <span className="status-pill" style={{ alignSelf: 'flex-start', background: 'rgba(214,255,205,0.18)', color: '#d6ffcd', border: '1px solid rgba(214,255,205,0.25)' }}>
            Ghana Sourced Fresh Vegetables
          </span>
          <h2 className="overview-hero-title" style={{ color: '#f8faf5', fontSize: '2.5rem', lineHeight: 1.15, marginTop: 14 }}>
            Direct-to-Market Produce Sourcing
          </h2>
          <p className="overview-hero-sub" style={{ color: 'rgba(248, 250, 245, 0.8)', fontSize: '1rem', marginTop: 12, marginBottom: 28, maxWidth: 520 }}>
            Connect directly with verified local growers in the Kumasi Vegetable Belt. Secure trade, clear pricing, and matched transport logistics.
          </p>

          {/* Integrated Search Bar inside Hero */}
          <div className="mp-search-wrap" style={{ maxWidth: 440, margin: 0, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <span className="mp-search-icon" style={{ color: '#d6ffcd' }}><Icon name="search" /></span>
            <input
              className="mp-search"
              type="search"
              placeholder="Search tomatoes, onions, carrots, peppers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ color: '#f8faf5' }}
            />
          </div>
        </div>

        <div className="overview-hero-visual" style={{ flex: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: 30, borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)', width: '100%', maxWidth: 320 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: '0.78rem', color: '#d6ffcd', fontWeight: 600 }}>🔥 Trending Sourcing</span>
              <span style={{ fontSize: '0.78rem', opacity: 0.7 }}>Ashanti Region</span>
            </div>
            {['Tomatoes', 'Pepper', 'Garden Eggs'].map((c) => {
              const cfg = getCropConfig(c)
              return (
                <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: '1.4rem' }}>{cfg.emoji}</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{c}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#d6ffcd' }}>Sourced Direct</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Shop by Category ── */}
      <section className="section-card" style={{ padding: '24px 28px' }}>
        <div className="section-heading" style={{ marginBottom: 14 }}>
          <div>
            <p className="eyebrow" style={{ color: '#6b7280' }}>Categories</p>
            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Browse by Vegetables</h3>
          </div>
        </div>
        <div className="mp-filter-strip" style={{ paddingBottom: 6 }}>
          {PRODUCE_FILTERS.map((f) => {
            const isActive = filter === f
            return (
              <button
                key={f}
                type="button"
                className={`mp-filter-chip ${isActive ? 'active' : ''}`}
                onClick={() => setFilter(f)}
                style={{ fontSize: '0.88rem', padding: '8px 16px' }}
              >
                {f !== 'All' && <span style={{ marginRight: 6 }}>{getCropConfig(f).emoji}</span>}
                {f}
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Trust value propositions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {TRUST_VALS.map((t) => (
          <div key={t.title} className="section-card" style={{ padding: '20px 24px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <span style={{ fontSize: '2rem', lineHeight: 1 }}>{t.emoji}</span>
            <div>
              <h4 style={{ color: '#264123', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 4px' }}>{t.title}</h4>
              <p style={{ color: '#6b7280', fontSize: '0.82rem', lineHeight: 1.45, margin: 0 }}>{t.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Listings Grid ── */}
      <section className="section-card">
        <div className="section-heading" style={{ marginBottom: 16 }}>
          <div>
            <p className="eyebrow" style={{ color: '#6b7280' }}>Listed Today</p>
            <h3 style={{ margin: 0 }}>Fresh Produce Stock</h3>
          </div>
          {search && (
            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              Showing {listings.length} matches
            </span>
          )}
        </div>

        {isLoading && <Spinner />}
        {error && <ErrorAlert message="Could not load produce listings." />}
        {!isLoading && !error && listings.length === 0 && (
          <EmptyState message={search ? `No listings matching "${search}"` : 'No active listings matching this category.'} />
        )}

        {listings.length > 0 && (
          <div className="mp-card-grid">
            {listings.map((listing) => {
              const cfg = getCropConfig(listing.vegetableType)
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
                    <h3 className="mp-card-name">{listing.vegetableType}</h3>
                    {listing.farmer && (
                      <p className="mp-card-farmer">
                        <span style={{ opacity: 0.5, marginRight: 4 }}>by</span>
                        {listing.farmer.firstName}
                      </p>
                    )}
                    <div className="mp-card-meta">
                      <div>
                        <span className="mp-card-price">GH₵ {listing.pricePerKgGhs}</span>
                        <span className="mp-card-per"> /kg</span>
                      </div>
                      <div className="mp-card-qty">
                        <span>{listing.quantityKg} kg</span>
                      </div>
                    </div>
                    {listing.harvestDate && (
                      <p className="mp-card-date">
                        <span style={{ opacity: 0.55 }}>Harvest:</span>{' '}
                        {new Date(listing.harvestDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
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

      {/* ── Sub Footer links ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center', background: '#f8faf5', padding: '16px 24px', borderRadius: 16, border: '1px solid #e5e7eb' }}>
        <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
          VegeLink Ghana © {new Date().getFullYear()}. Built for local crop logistics.
        </span>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link to="/how-it-works" style={{ fontSize: '0.85rem', color: '#264123', fontWeight: 600, textDecoration: 'none' }}>How it Works</Link>
          <Link to="/about" style={{ fontSize: '0.85rem', color: '#264123', fontWeight: 600, textDecoration: 'none' }}>About & Coverage</Link>
        </div>
      </div>

      {selected && (
        <OrderModal listing={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
