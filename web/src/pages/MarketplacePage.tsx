import { useState, useMemo } from 'react'
import { useAllListings } from '../hooks/useListings'
import { usePlaceOrder } from '../hooks/useOrders'
import { useAuthStore } from '../store/auth.store'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { placeOrderSchema, type PlaceOrderFormData } from '../schemas'
import type { Listing } from '../types/api'
import { getApiErrorMessage } from '../lib/errors'
import { Icon } from '../components/Icon'
import { Spinner, ErrorAlert, EmptyState } from '../components/ui/Feedback'
import { Field } from '../components/ui/Field'
import { Modal } from '../components/ui/Modal'
import { FormActions } from '../components/ui/FormActions'

// ── Crop visual config ────────────────────────────────────────────────────────
const CROP_CONFIG: Record<string, { emoji: string; tint: string; accent: string }> = {
  tomatoes: { emoji: '🍅', tint: 'rgba(220,38,38,0.08)',   accent: '#DC2626' },
  pepper:   { emoji: '🌶️', tint: 'rgba(239,68,68,0.08)',   accent: '#EF4444' },
  onions:   { emoji: '🧅', tint: 'rgba(217,119,6,0.08)',   accent: '#D97706' },
  yam:      { emoji: '🥔', tint: 'rgba(180,83,9,0.08)',    accent: '#B45309' },
  okra:     { emoji: '🥦', tint: 'rgba(22,101,52,0.08)',   accent: '#166534' },
  cabbage:  { emoji: '🥬', tint: 'rgba(4,120,87,0.08)',    accent: '#047857' },
  default:  { emoji: '🌿', tint: 'rgba(38,65,35,0.06)',    accent: '#264123' },
}

function getCropConfig(name: string) {
  const key = name.trim().toLowerCase()
  return CROP_CONFIG[key] ?? CROP_CONFIG.default
}

const FILTERS = ['All', 'Tomatoes', 'Pepper', 'Onions', 'Yam', 'Okra', 'Cabbage']

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [filter, setFilter]       = useState('All')
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState<Listing | null>(null)
  const user = useAuthStore((s) => s.user)

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

        {/* Search */}
        <div className="mp-search-wrap">
          <span className="mp-search-icon"><Icon name="shopping" /></span>
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
        {FILTERS.map((f) => (
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

// ── Produce Card — mobile-style ───────────────────────────────────────────────

function ProduceCard({
  listing,
  canOrder,
  onOrder,
}: {
  listing: Listing
  canOrder: boolean
  onOrder: () => void
}) {
  const cfg = getCropConfig(listing.vegetable_type)

  return (
    <article className="mp-card">
      {/* Visual band */}
      <div className="mp-card-visual" style={{ background: cfg.tint }}>
        <span className="mp-card-emoji">{cfg.emoji}</span>

        {/* AgriScore ring — top right */}
        {listing.agriScore && (
          <div className="mp-agriscore" title={`AgriScore: ${listing.agriScore}`}>
            <AgriRing score={listing.agriScore} />
          </div>
        )}

        {/* Urgent badge — top left */}
        {listing.isUrgent && (
          <span className="mp-urgent-badge">🔥 Urgent</span>
        )}
      </div>

      {/* Body */}
      <div className="mp-card-body">
        {/* Freshness */}
        {listing.freshness && (
          <div style={{ marginBottom: 8 }}>
            <FreshnessBar freshness={listing.freshness} />
          </div>
        )}

        {/* Crop name */}
        <h3 className="mp-card-name">{listing.vegetable_type}</h3>

        {/* Farmer */}
        {listing.farmer && (
          <p className="mp-card-farmer">
            <span style={{ opacity: 0.5, marginRight: 4 }}>by</span>
            {listing.farmer.firstName}
          </p>
        )}

        {/* Price + quantity row */}
        <div className="mp-card-meta">
          <div>
            <span className="mp-card-price">GH₵ {listing.price_per_kg_ghs}</span>
            <span className="mp-card-per"> /kg</span>
          </div>
          <div className="mp-card-qty">
            <span>{listing.quantity_kg} kg</span>
          </div>
        </div>

        {/* Harvest date */}
        {listing.harvest_date && (
          <p className="mp-card-date">
            <span style={{ opacity: 0.55 }}>Harvest:</span>{' '}
            {new Date(listing.harvest_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        )}

        {/* Order button */}
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

// ── AgriScore ring ────────────────────────────────────────────────────────────

function AgriRing({ score }: { score: number }) {
  const r = 13, sw = 3, circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 85 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ position: 'relative', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="34" height="34" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="17" cy="17" r={r} stroke="rgba(255,255,255,0.3)" strokeWidth={sw} fill="none" />
        <circle cx="17" cy="17" r={r} stroke={color} strokeWidth={sw} fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span style={{ position: 'absolute', fontSize: '0.6rem', fontWeight: 800, color }}>{score}</span>
    </div>
  )
}

// ── Freshness bar ─────────────────────────────────────────────────────────────

function FreshnessBar({ freshness }: { freshness: 'High' | 'Medium' | 'Low' }) {
  const map = {
    High:   { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  fill: 100, label: 'High freshness' },
    Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  fill: 60,  label: 'Medium freshness' },
    Low:    { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   fill: 28,  label: 'Low freshness' },
  }[freshness]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, borderRadius: 99, background: map.bg, overflow: 'hidden' }}>
        <div style={{ width: `${map.fill}%`, height: '100%', borderRadius: 99, background: map.color, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: map.color, whiteSpace: 'nowrap' }}>{map.label}</span>
    </div>
  )
}

// ── Order Modal ───────────────────────────────────────────────────────────────

function OrderModal({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const cfg = getCropConfig(listing.vegetable_type)
  const { mutate, isPending, error, isSuccess } = usePlaceOrder(listing.id)
  const { register, handleSubmit, formState: { errors } } = useForm<PlaceOrderFormData, unknown, PlaceOrderFormData>({
    resolver: zodResolver(placeOrderSchema) as never,
    defaultValues: { mode: 'delivery' },
  })
  const onSubmit = (data: PlaceOrderFormData) => mutate(data, { onSuccess: onClose })
  const apiError = getApiErrorMessage(error)

  return (
    <Modal onClose={onClose} maxWidth={480}>
      {/* Modal produce header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 20px 16px', borderBottom: '1px solid #f0f2f4' }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: cfg.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
          {cfg.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9ca3af', fontWeight: 600 }}>Place Order</p>
          <h3 style={{ margin: '2px 0 0', color: '#264123', fontFamily: 'Poppins, sans-serif', fontSize: '1.15rem', fontWeight: 700 }}>{listing.vegetable_type}</h3>
          <p style={{ margin: '2px 0 0', color: cfg.accent, fontWeight: 800, fontSize: '0.95rem' }}>GH₵ {listing.price_per_kg_ghs}/kg</p>
        </div>
        <button type="button" onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
      </div>

      <div style={{ padding: '20px' }}>
        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
            <h3 style={{ color: '#264123', margin: '0 0 6px', fontFamily: 'Poppins, sans-serif' }}>Order placed!</h3>
            <p style={{ color: '#6b7280', margin: 0 }}>You'll receive an update when the farmer confirms.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: 14 }}>
            <Field label="Quantity (kg)" type="number" min="1" placeholder="e.g. 50" error={errors.quantity_kg} {...register('quantity_kg')} />
            <Field label="Delivery Address" placeholder="e.g. Kumasi Central Market" error={errors.delivery_address} {...register('delivery_address')} />

            <div>
              <p style={{ margin: '0 0 10px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#374151', fontWeight: 600 }}>Fulfillment</p>
              <div style={{ display: 'flex', gap: 10 }}>
                {(['delivery', 'pickup'] as const).map((m) => (
                  <label key={m} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', border: '1.5px solid #e5e7eb', borderRadius: 12, cursor: 'pointer', background: '#f9fafb' }}>
                    <input type="radio" value={m} {...register('mode')} style={{ accentColor: cfg.accent }} />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'capitalize', color: '#374151' }}>{m}</span>
                  </label>
                ))}
              </div>
            </div>

            {apiError && <ErrorAlert message={apiError} />}
            <FormActions onCancel={onClose} submitLabel="Confirm Order" pendingLabel="Placing…" isPending={isPending} />
          </form>
        )}
      </div>
    </Modal>
  )
}
