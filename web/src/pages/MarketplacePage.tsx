import { useState } from 'react'
import { useAllListings } from '../hooks/useListings'
import { usePlaceOrder } from '../hooks/useOrders'
import { useAuthStore } from '../store/auth.store'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { placeOrderSchema, type PlaceOrderFormData } from '../schemas'
import { Icon } from '../components/Icon'
import { Spinner, ErrorAlert, EmptyState, StatusBadge } from '../components/ui/Feedback'
import { Field } from '../components/ui/Field'

const FILTERS = ['All', 'Tomatoes', 'Pepper', 'Onions', 'Garden Eggs', 'Okra']

export default function MarketplacePage() {
  const [filter, setFilter] = useState('All')
  const [selectedListing, setSelectedListing] = useState<any>(null)
  const user = useAuthStore((s) => s.user)

  const params = filter !== 'All' ? { vegetable_type: filter } : undefined
  const { data, isLoading, error } = useAllListings(params)
  const listings = Array.isArray(data) ? data : []

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Marketplace</p>
          <h2>Fresh produce from Greater Accra farms.</h2>
          <p>Browse available listings, check prices, and place orders directly with farmers.</p>
        </div>
      </section>

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
          {listings.map((listing: any) => (
            <article key={listing.id} className="listing-card">
              <div className="listing-top">
                <StatusBadge status={listing.status ?? 'active'} />
                <Icon name="leaf" />
              </div>
              <h3>{listing.vegetable_type ?? listing.cropName}</h3>
              <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>{listing.farmer?.firstName ?? 'Farmer'}</p>
              <div className="listing-meta">
                <span style={{ fontWeight: 700, color: '#264123' }}>GH₵ {listing.price_per_kg_ghs ?? listing.pricePerUnit}/kg</span>
                <span>{listing.quantity_kg ?? listing.availableQuantity} kg available</span>
              </div>
              {user?.role === 'buyer' && (
                <button type="button" className="primary-button" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
                  onClick={() => setSelectedListing(listing)}>
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

function OrderModal({ listing, onClose }: { listing: any; onClose: () => void }) {
  const { mutate, isPending, error, isSuccess } = usePlaceOrder(listing.id)
  const { register, handleSubmit, formState: { errors } } = useForm<PlaceOrderFormData, unknown, PlaceOrderFormData>({
    resolver: zodResolver(placeOrderSchema) as any,
    defaultValues: { mode: 'delivery' },
  })

  const onSubmit = (data: PlaceOrderFormData) => {
    mutate(data, { onSuccess: onClose })
  }

  const apiError = error && (error as any).response?.data?.error?.message

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <p style={{ color: '#6b7280', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Place Order</p>
            <h3 style={{ margin: 0, color: '#264123' }}>{listing.vegetable_type ?? listing.cropName}</h3>
            <p style={{ margin: '4px 0 0', color: '#374151' }}>GH₵ {listing.price_per_kg_ghs ?? listing.pricePerUnit}/kg</p>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>×</button>
        </div>

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <p style={{ fontSize: '2rem' }}>✅</p>
            <p style={{ color: '#264123', fontWeight: 600 }}>Order placed successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: 14 }}>
            <Field label="Quantity (kg)" type="number" min="1" placeholder="e.g. 50" error={errors.quantity_kg} {...register('quantity_kg')} />
            <Field label="Delivery Address" placeholder="e.g. Madina Market, Accra" error={errors.delivery_address} {...register('delivery_address')} />
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
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="button" className="secondary-button" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button type="submit" className="primary-button" disabled={isPending} style={{ flex: 1, justifyContent: 'center' }}>
                {isPending ? 'Placing…' : 'Confirm Order'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
