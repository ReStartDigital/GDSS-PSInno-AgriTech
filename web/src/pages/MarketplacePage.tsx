import { useState } from 'react'
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
import { PageHero } from '../components/ui/PageHero'
import { ModalHeader } from '../components/ui/ModalHeader'
import { FormActions } from '../components/ui/FormActions'

const FILTERS = ['All', 'Tomatoes', 'Pepper', 'Onions', 'Garden Eggs', 'Okra']

export default function MarketplacePage() {
  const [filter, setFilter] = useState('All')
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const user = useAuthStore((s) => s.user)

  const params = filter !== 'All' ? { vegetable_type: filter } : undefined
  const { data, isLoading, error } = useAllListings(params)
  const listings = data ?? []

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Marketplace"
        title="Fresh produce from Kumasi farms."
        description="Browse available listings, check prices, and place orders directly with farmers."
      />

      <section className="section-card">
        <div className="section-heading">
          <div><p className="eyebrow">Filters</p><h3>Browse by crop type.</h3></div>
        </div>
        <div className="filter-row">
          {FILTERS.map((f) => (
            <button key={f} type="button" className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
      </section>

      {isLoading && <Spinner />}
      {error && <ErrorAlert message="Could not load listings. Is the backend running?" />}
      {!isLoading && !error && listings.length === 0 && <EmptyState message="No listings available right now." />}

      {listings.length > 0 && (
        <section className="listing-grid">
          {listings.map((listing) => (
            <article key={listing.id} className="listing-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '280px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e5e7eb', padding: '20px', boxShadow: '0 4px 6px -1px rgba(38, 65, 35, 0.06)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: 600, color: '#264123' }}>{listing.vegetable_type}</h3>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 14, height: 14, display: 'inline-flex' }}><Icon name="user" /></span> {listing.farmer?.firstName ?? 'Farmer'}
                    </p>
                  </div>
                  {listing.agriScore && <AgriScoreCircle score={listing.agriScore} />}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {listing.isUrgent && <UrgentSaleBadge />}
                  {listing.freshness && <FreshnessBadge freshness={listing.freshness} />}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: '#f8faf5', padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#6b7280', display: 'block', letterSpacing: '0.05em' }}>Price</span>
                    <strong style={{ fontSize: '0.95rem', color: '#264123' }}>GH₵ {listing.price_per_kg_ghs}/kg</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#6b7280', display: 'block', letterSpacing: '0.05em' }}>Available</span>
                    <strong style={{ fontSize: '0.95rem', color: '#264123' }}>{listing.quantity_kg} kg</strong>
                  </div>
                </div>

                {listing.harvest_date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: '0.8rem', marginBottom: 12 }}>
                    <span style={{ width: 14, height: 14, display: 'inline-flex' }}><Icon name="clock" /></span>
                    <span>Harvest: {new Date(listing.harvest_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                )}
              </div>

              {user?.role === 'buyer' && (
                <button
                  type="button"
                  className="primary-button"
                  style={{ width: '100%', justifyContent: 'center', borderRadius: '12px', minHeight: '44px', fontWeight: 600 }}
                  onClick={() => setSelectedListing(listing)}
                >
                  Place Order
                </button>
              )}
            </article>
          ))}
        </section>
      )}

      {selectedListing && (
        <OrderModal listing={selectedListing} onClose={() => setSelectedListing(null)} />
      )}
    </div>
  )
}

function OrderModal({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const { mutate, isPending, error, isSuccess } = usePlaceOrder(listing.id)
  const { register, handleSubmit, formState: { errors } } = useForm<PlaceOrderFormData, unknown, PlaceOrderFormData>({
    resolver: zodResolver(placeOrderSchema) as never,
    defaultValues: { mode: 'delivery' },
  })

  const onSubmit = (data: PlaceOrderFormData) => {
    mutate(data, { onSuccess: onClose })
  }

  const apiError = getApiErrorMessage(error)

  return (
    <Modal onClose={onClose} maxWidth={480}>
      <ModalHeader
        eyebrow="Place Order"
        title={listing.vegetable_type}
        subtitle={<p style={{ margin: '4px 0 0', color: '#374151' }}>GH₵ {listing.price_per_kg_ghs}/kg</p>}
        onClose={onClose}
      />

      {isSuccess ? (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <p style={{ fontSize: '2rem' }}>✅</p>
          <p style={{ color: '#264123', fontWeight: 600 }}>Order placed successfully!</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: 14 }}>
          <Field label="Quantity (kg)" type="number" min="1" placeholder="e.g. 50" error={errors.quantity_kg} {...register('quantity_kg')} />
          <Field label="Delivery Address" placeholder="e.g. Kumasi Central Market" error={errors.delivery_address} {...register('delivery_address')} />
          <div>
            <span style={{ color: '#374151', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Fulfillment</span>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['delivery', 'pickup'] as const).map((m) => (
                <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="radio" value={m} {...register('mode')} />
                  <span style={{ textTransform: 'capitalize' }}>{m}</span>
                </label>
              ))}
            </div>
          </div>
          {apiError && <ErrorAlert message={apiError} />}
          <FormActions
            onCancel={onClose}
            submitLabel="Confirm Order"
            pendingLabel="Placing…"
            isPending={isPending}
          />
        </form>
      )}
    </Modal>
  )
}

function AgriScoreCircle({ score }: { score: number }) {
  const radius = 14
  const strokeWidth = 3
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36 }} title={`AgriScore: ${score}%`}>
      <svg width="36" height="36" style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx="18"
          cy="18"
          r={radius}
          stroke="rgba(38,65,35,0.08)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx="18"
          cy="18"
          r={radius}
          stroke="url(#agriScoreGradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="agriScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>
      </svg>
      <span style={{ position: 'absolute', fontSize: '0.65rem', fontWeight: 800, color: '#047857' }}>
        {score}
      </span>
    </div>
  )
}

function FreshnessBadge({ freshness }: { freshness: 'High' | 'Medium' | 'Low' }) {
  const styles = {
    High: { bg: 'rgba(16, 185, 129, 0.08)', color: '#047857', border: 'rgba(16, 185, 129, 0.15)' },
    Medium: { bg: 'rgba(245, 158, 11, 0.08)', color: '#b45309', border: 'rgba(245, 158, 11, 0.15)' },
    Low: { bg: 'rgba(239, 68, 68, 0.08)', color: '#b91c1c', border: 'rgba(239, 68, 68, 0.15)' },
  }[freshness]

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '4px 10px',
      borderRadius: '999px',
      fontSize: '0.7rem',
      fontWeight: 600,
      background: styles.bg,
      color: styles.color,
      border: `1px solid ${styles.border}`
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: styles.color }} />
      Freshness: {freshness}
    </span>
  )
}

function UrgentSaleBadge() {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 8px',
      borderRadius: '6px',
      fontSize: '0.68rem',
      fontWeight: 700,
      background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
      color: '#ffffff',
      letterSpacing: '0.03em',
      textTransform: 'uppercase',
      boxShadow: '0 2px 4px rgba(239, 68, 68, 0.15)'
    }}>
      🔥 Urgent
    </span>
  )
}
