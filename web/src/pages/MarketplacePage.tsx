import { useState, useMemo } from 'react'
import { useAllListings } from '../hooks/useListings'
import { useAuthStore } from '../store/auth.store'
import type { Listing } from '../types/api'
import { Icon } from '../components/Icon'
import { Spinner, ErrorAlert, EmptyState } from '../components/ui/Feedback'
import { getCropConfig, AgriRing, FreshnessBar, OrderModal, PRODUCE_FILTERS } from '../lib/produceUtils'

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [filter, setFilter]       = useState('All')
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState<Listing | null>(null)
  const user = useAuthStore((s) => s.user)

  const params = filter !== 'All' ? { vegetableType: filter } : undefined
  const { data, isLoading, error } = useAllListings(params)

  const listings = useMemo(() => {
    const all: Listing[] = Array.isArray(data) ? data : []
    if (!search.trim()) return all
    return all.filter((l) =>
      l.vegetableType.toLowerCase().includes(search.toLowerCase()) ||
      l.farmer?.firstName?.toLowerCase().includes(search.toLowerCase())
    )
  }, [data, search])

  return (
    <div className="page-stack">

      {/* ── Header ── */}
      <section className="mp-header">
        <div>
          <p className="eyebrow" style={{ color: 'rgba(214,255,205,0.7)' }}>Marketplace</p>
          <h2 style={{ margin: '6px 0 4px', color: '#fff', fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontWeight: 800 }}>
            Fresh Produce
          </h2>
          <p style={{ margin: 0, color: 'rgba(214,255,205,0.75)', fontSize: '0.92rem' }}>
            Direct from farms in the Kumasi Vegetable Belt
          </p>
        </div>

        {/* Search — uses magnifier icon, styled for dark header */}
        <div className="mp-search-wrap">
          <span className="mp-search-icon"><Icon name="search" /></span>
          <input
            className="mp-search"
            type="search"
            placeholder="Search produce or farmer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      {/* ── Filter strip ── */}
      <div className="mp-filter-strip">
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

      {/* ── Results ── */}
      {isLoading && <Spinner />}
      {error    && <ErrorAlert message="Could not load listings." />}
      {!isLoading && !error && listings.length === 0 && (
        <EmptyState message={search ? `No results for "${search}"` : 'No listings available right now.'} />
      )}

      {listings.length > 0 && (
        <div className="mp-card-grid">
          {listings.map((listing) => (
            <ProduceCard
              key={listing.id}
              listing={listing}
              canOrder={user?.role === 'buyer'}
              onOrder={() => setSelected(listing)}
            />
          ))}
        </div>
      )}

      {selected && (
        <OrderModal listing={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

// ── Produce Card ───────────────────────────────────────────────────────────────

function ProduceCard({
  listing,
  canOrder,
  onOrder,
}: {
  listing: Listing
  canOrder: boolean
  onOrder: () => void
}) {
  const cfg = getCropConfig(listing.vegetableType)

  return (
    <article className="mp-card">
      {/* Visual band */}
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

      {/* Body */}
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

        {canOrder && (
          <button
            type="button"
            className="mp-order-btn"
            onClick={onOrder}
            style={{ background: cfg.accent }}
          >
            Place Order
          </button>
        )}
      </div>
    </article>
  )
}
