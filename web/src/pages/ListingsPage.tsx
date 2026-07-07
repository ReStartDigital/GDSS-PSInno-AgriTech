import { useState } from 'react'
import { useMyListings, useCreateListing, useDeleteListing } from '../hooks/useListings'
import { useMyClients } from '../hooks/useClients'
import { useAuthStore } from '../store/auth.store'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createListingSchema, type CreateListingFormData } from '../schemas'
import type { Listing } from '../types/api'
import { getApiErrorMessage } from '../lib/errors'
import { Icon } from '../components/Icon'
import { Spinner, ErrorAlert, EmptyState, StatusBadge } from '../components/ui/Feedback'
import { Field } from '../components/ui/Field'
import { PageHero } from '../components/ui/PageHero'
import { FormActions } from '../components/ui/FormActions'

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
                style={{ 
                  padding: '8px 12px', 
                  borderRadius: '12px', 
                  border: '1px solid #E5E7EB', 
                  background: '#fff',
                  fontSize: '0.9rem',
                  color: '#374151'
                }}
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
        <section className="listing-grid">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </section>
      )}

    </div>
  )
}

function ListingCard({ listing }: { listing: Listing }) {
  const { mutate: deleteListing, isPending } = useDeleteListing()
  return (
    <article className="listing-card wide" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '280px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e5e7eb', padding: '20px', boxShadow: '0 4px 6px -1px rgba(38, 65, 35, 0.06)' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <StatusBadge status={listing.status} />
              {listing.isUrgent && <UrgentSaleBadge />}
            </div>
            <h3 style={{ margin: '4px 0 0', fontSize: '1.2rem', fontWeight: 600, color: '#264123' }}>{listing.vegetable_type}</h3>
          </div>
          {listing.agriScore && <AgriScoreCircle score={listing.agriScore} />}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {listing.freshness && <FreshnessBadge freshness={listing.freshness} />}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: '#f8faf5', padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#6b7280', display: 'block', letterSpacing: '0.05em' }}>Price</span>
            <strong style={{ fontSize: '0.95rem', color: '#264123' }}>GH₵ {listing.price_per_kg_ghs}/{(listing as any).unit_of_measure ?? 'kg'}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#6b7280', display: 'block', letterSpacing: '0.05em' }}>Available</span>
            <strong style={{ fontSize: '0.95rem', color: '#264123' }}>{listing.quantity_kg} {(listing as any).unit_of_measure ?? 'kg'}</strong>
          </div>
        </div>

        {(listing as any).description && (
          <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0 0 12px', lineHeight: 1.5 }}>
            {(listing as any).description}
          </p>
        )}

        {listing.harvest_date && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: '0.8rem', marginBottom: 12 }}>
            <span style={{ width: 14, height: 14, display: 'inline-flex' }}><Icon name="clock" /></span>
            <span>Harvest: {new Date(listing.harvest_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        )}
      </div>

      <button
        type="button"
        className="secondary-button"
        disabled={isPending}
        onClick={() => { if (confirm('Delete this listing?')) deleteListing(listing.id) }}
        style={{ width: '100%', justifyContent: 'center', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)', borderRadius: '12px', minHeight: '44px', fontWeight: 600 }}
      >
        {isPending ? 'Deleting…' : 'Delete'}
      </button>
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
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#f8faf5', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: 14 }}>
        {isAgent && (
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: '#fff', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Farmer Client</span>
            <select 
              value={formFarmerId}
              onChange={(e) => setFormFarmerId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            >
              {clients.map(c => (
                <option key={c.id} value={c.id} style={{ color: '#000' }}>{c.firstName} {c.lastName} ({c.phone})</option>
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
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.1)',
              color: '#f8faf5',
              fontSize: '1rem',
              width: '100%',
              boxSizing: 'border-box',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
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
  const radius = 14
  const strokeWidth = 3
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36 }} title={`AgriScore: ${score}%`}>
      <svg width="36" height="36" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="18" cy="18" r={radius} stroke="rgba(38,65,35,0.08)" strokeWidth={strokeWidth} fill="transparent" />
        <circle cx="18" cy="18" r={radius} stroke="url(#agriScoreGradient)" strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
        <defs>
          <linearGradient id="agriScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
        </defs>
      </svg>
      <span style={{ position: 'absolute', fontSize: '0.65rem', fontWeight: 800, color: '#047857' }}>{score}</span>
    </div>
  )
}

function FreshnessBadge({ freshness }: { freshness: 'High' | 'Medium' | 'Low' }) {
  const styles = {
    High:   { bg: 'rgba(16, 185, 129, 0.08)', color: '#047857', border: 'rgba(16, 185, 129, 0.15)' },
    Medium: { bg: 'rgba(245, 158, 11, 0.08)',  color: '#b45309', border: 'rgba(245, 158, 11, 0.15)' },
    Low:    { bg: 'rgba(239, 68, 68, 0.08)',   color: '#b91c1c', border: 'rgba(239, 68, 68, 0.15)' },
  }[freshness]

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600, background: styles.bg, color: styles.color, border: `1px solid ${styles.border}` }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: styles.color }} />
      {freshness} freshness
    </span>
  )
}

function UrgentSaleBadge() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700, background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)', color: '#ffffff', letterSpacing: '0.03em', textTransform: 'uppercase', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.15)' }}>
      🔥 Urgent
    </span>
  )
}
