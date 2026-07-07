import { useState } from 'react'
import { useMyListings, useCreateListing, useDeleteListing } from '../hooks/useListings'
import { useMyClients } from '../hooks/useClients'
import { useAuthStore } from '../store/auth.store'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createListingSchema, type CreateListingFormData } from '../schemas'
import type { Listing } from '../types/api'
import { getApiErrorMessage } from '../lib/errors'
import { Spinner, ErrorAlert, EmptyState } from '../components/ui/Feedback'
import { Field } from '../components/ui/Field'
import { PageHero } from '../components/ui/PageHero'
import { FormActions } from '../components/ui/FormActions'
import { getCropConfig } from '../lib/produceUtils'

const UNIT_OPTIONS = ['kg', 'crate', 'basket', 'bunch', 'sack', 'head'] as const

export default function ListingsPage() {
  const user = useAuthStore((s) => s.user)
  const isAgent = user?.role === 'agent'
  
  const { data: clients = [], isLoading: clientsLoading } = useMyClients()
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>('')
  
  const [showForm, setShowForm] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }
  
  if (isAgent && !selectedFarmerId && clients.length > 0) {
    setSelectedFarmerId(clients[0].id)
  }

  const { data, isLoading, error } = useMyListings(isAgent ? selectedFarmerId : undefined)
  const listings = data ?? []

  const activeClientName = isAgent 
    ? clients.find(c => c.id === selectedFarmerId)?.firstName ?? 'Selected Farmer'
    : ''

  return (
    <div className="page-stack">
      <PageHero
        eyebrow={isAgent ? `Agent client: ${activeClientName}` : 'My Listings'}
        title={isAgent ? 'Manage client listings.' : 'Your produce inventory.'}
        description={isAgent 
          ? 'View and manage listings on behalf of your onboarded farmers.' 
          : 'Manage your active listings, prices, and availability.'
        }
        action={
          (!isAgent || clients.length > 0) ? (
            <button type="button" className="primary-button" onClick={() => setShowForm(true)}>
              + New Listing
            </button>
          ) : null
        }
      />

      {isAgent && (
        <section className="section-card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>Select Client:</span>
            {clientsLoading ? (
              <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Loading clients...</span>
            ) : clients.length === 0 ? (
              <span style={{ fontSize: '0.85rem', color: '#ef4444' }}>No clients registered yet. Please register a farmer first.</span>
            ) : (
              <select 
                value={selectedFarmerId} 
                onChange={(e) => setSelectedFarmerId(e.target.value)}
                className="form-select"
                style={{ maxWidth: 300, minHeight: 40 }}
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.phone})</option>
                ))}
              </select>
            )}
          </div>
        </section>
      )}

      {showForm && (
        <CreateListingForm
          onClose={() => setShowForm(false)}
          isAgent={isAgent}
          clients={clients}
          selectedFarmerId={selectedFarmerId}
          onSuccess={(name) => showToast(`"${name}" listing created successfully!`)}
        />
      )}

      {/* Success toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#264123', color: '#d6ffcd', padding: '12px 24px',
          borderRadius: 12, fontWeight: 600, fontSize: '0.92rem',
          boxShadow: '0 8px 24px rgba(38,65,35,0.2)', zIndex: 100,
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'fadeSlideUp 0.25s ease',
        }}>
          ✅ {toastMsg}
        </div>
      )}

      {isLoading && <Spinner />}
      {error && <ErrorAlert message="Could not load listings. Make sure the backend is running." />}
      {!isLoading && !error && listings.length === 0 && (
        <EmptyState message={isAgent 
          ? 'This farmer client has no listings yet. Click "+ New Listing" to create one.' 
          : 'You have no listings yet. Create your first one above.'
        } />
      )}

      {listings.length > 0 && (
        <div className="mp-card-grid">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

    </div>
  )
}

function ListingCard({ listing }: { listing: Listing }) {
  const { mutate: deleteListing, isPending } = useDeleteListing()
  const cfg = getCropConfig(listing.vegetable_type)

  return (
    <article className="mp-card">
      {/* Visual band — same as marketplace */}
      <div className="mp-card-visual" style={{ background: cfg.tint }}>
        <span className="mp-card-emoji">{cfg.emoji}</span>

        {/* Status badge — top left */}
        <span className="mp-urgent-badge" style={{
          background: listing.status === 'active'
            ? 'linear-gradient(135deg, #166534 0%, #15803d 100%)'
            : listing.status === 'sold'
            ? 'linear-gradient(135deg, #374151 0%, #4b5563 100%)'
            : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
        }}>
          {listing.status}
        </span>

        {/* AgriScore ring — top right */}
        {listing.agriScore && (
          <div className="mp-agriscore" title={`AgriScore: ${listing.agriScore}`}>
            <AgriScoreCircle score={listing.agriScore} />
          </div>
        )}

        {/* Urgent badge — below status if both exist */}
        {listing.isUrgent && (
          <span className="mp-urgent-badge" style={{
            top: 'auto', bottom: 12, left: 12,
            background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
          }}>🔥 Urgent</span>
        )}
      </div>

      {/* Card body */}
      <div className="mp-card-body">
        {listing.freshness && (
          <div style={{ marginBottom: 8 }}>
            <FreshnessBadge freshness={listing.freshness} />
          </div>
        )}

        <h3 className="mp-card-name">{listing.vegetable_type}</h3>

        {(listing as any).description && (
          <p className="mp-card-farmer" style={{ marginBottom: 10, lineHeight: 1.5 }}>
            {(listing as any).description}
          </p>
        )}

        {/* Price + quantity meta row */}
        <div className="mp-card-meta">
          <div>
            <span className="mp-card-price">GH₵ {listing.price_per_kg_ghs}</span>
            <span className="mp-card-per"> /{(listing as any).unit_of_measure ?? 'kg'}</span>
          </div>
          <div className="mp-card-qty">
            {listing.quantity_kg} {(listing as any).unit_of_measure ?? 'kg'}
          </div>
        </div>

        {listing.harvest_date && (
          <p className="mp-card-date">
            <span style={{ opacity: 0.55 }}>Harvest:</span>{' '}
            {new Date(listing.harvest_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        )}

        {/* Delete action */}
        <button
          type="button"
          className="mp-order-btn"
          disabled={isPending}
          onClick={() => { if (confirm('Delete this listing?')) deleteListing(listing.id) }}
          style={{ background: isPending ? '#9ca3af' : 'rgba(239,68,68,0.85)', marginTop: 'auto' }}
        >
          {isPending ? 'Deleting…' : 'Delete Listing'}
        </button>
      </div>
    </article>
  )
}


function CreateListingForm({ 
  onClose, 
  isAgent, 
  clients,
  selectedFarmerId,
  onSuccess,
}: { 
  onClose: () => void
  isAgent: boolean
  clients: any[]
  selectedFarmerId: string
  onSuccess?: (cropName: string) => void
}) {
  const { mutate, isPending, error } = useCreateListing()
  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<CreateListingFormData, unknown, CreateListingFormData>({
    resolver: zodResolver(createListingSchema) as never,
    defaultValues: { unit_of_measure: 'kg' }
  })
  
  const [formFarmerId, setFormFarmerId] = useState(selectedFarmerId)
  const selectedUnit = watch('unit_of_measure')

  const onSubmit = (data: CreateListingFormData) => {
    const payload = {
      ...data,
      location: {
        lat: 6.6745,
        lng: -1.5644,
      },
      supports_delivery: true,
      supports_pickup: true,
      ...(isAgent ? { farmer_id: formFarmerId } : {})
    }
    mutate(payload as any, {
      onSuccess: () => {
        reset()
        onClose()
        onSuccess?.(data.vegetable_type || 'Produce')
      }
    })
  }

  const apiError = getApiErrorMessage(error)

  return (
    <section className="section-card accent-card">
      <div className="section-heading">
        <div><p className="eyebrow">New Listing</p><h3>Add produce to the marketplace.</h3></div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(248, 250, 245, 0.65)',
            fontSize: '1.6rem',
            cursor: 'pointer',
            lineHeight: 1,
            padding: '4px 8px',
            transition: 'color 150ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#f8faf5')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(248, 250, 245, 0.65)')}
        >
          ×
        </button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: 14 }}>
        {isAgent && (
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: '#fff', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Farmer Client</span>
            <select 
              value={formFarmerId}
              onChange={(e) => setFormFarmerId(e.target.value)}
              className="form-select dark"
            >
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.phone})</option>
              ))}
            </select>
          </div>
        )}
        <div className="form-grid">
          <Field label="Crop Type" dark placeholder="e.g. Tomatoes" error={errors.vegetable_type} {...register('vegetable_type')} />
          <Field label="Quantity" dark type="number" min="1" placeholder="e.g. 200" error={errors.quantity_kg} {...register('quantity_kg')} />
          <Field label="Price per unit (GH₵)" dark type="number" step="0.01" min="0.01" placeholder="e.g. 4.50" error={errors.price_per_kg_ghs} {...register('price_per_kg_ghs')} />
          <Field label="Harvest Date" dark type="date" error={errors.harvest_date} {...register('harvest_date')} />
        </div>

        {/* Unit of measure */}
        <div>
          <span style={{ color: 'rgba(248,250,245,0.86)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
            Unit of Measure
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {UNIT_OPTIONS.map((unit) => (
              <button
                key={unit}
                type="button"
                onClick={() => setValue('unit_of_measure', unit, { shouldValidate: true })}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  border: `2px solid ${selectedUnit === unit ? '#d6ffcd' : 'rgba(255,255,255,0.2)'}`,
                  background: selectedUnit === unit ? 'rgba(214,255,205,0.2)' : 'rgba(255,255,255,0.06)',
                  color: '#f8faf5',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {unit}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div style={{ display: 'grid', gap: 6 }}>
          <span style={{ color: 'rgba(248,250,245,0.86)', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Description <span style={{ opacity: 0.5 }}>(optional)</span>
          </span>
          <textarea
            {...register('description')}
            placeholder="e.g. Freshly harvested, sorted, and ready for pickup"
            rows={3}
            className="form-textarea dark"
          />
        </div>

        {apiError && <ErrorAlert message={apiError} />}
        <FormActions
          onCancel={onClose}
          submitLabel="Create Listing"
          pendingLabel="Creating…"
          isPending={isPending}
        />
      </form>
    </section>
  )
}

function AgriScoreCircle({ score }: { score: number }) {
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

function FreshnessBadge({ freshness }: { freshness: 'High' | 'Medium' | 'Low' }) {
  const styles = {
    High:   { bg: 'rgba(16, 185, 129, 0.1)', color: '#047857', border: 'rgba(16, 185, 129, 0.2)' },
    Medium: { bg: 'rgba(245, 158, 11, 0.1)',  color: '#b45309', border: 'rgba(245, 158, 11, 0.2)' },
    Low:    { bg: 'rgba(239, 68, 68, 0.1)',   color: '#b91c1c', border: 'rgba(239, 68, 68, 0.2)' },
  }[freshness]

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600, background: styles.bg, color: styles.color, border: `1px solid ${styles.border}` }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: styles.color }} />
      {freshness} freshness
    </span>
  )
}
