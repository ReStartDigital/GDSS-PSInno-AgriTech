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

export default function ListingsPage() {
  const user = useAuthStore((s) => s.user)
  const isAgent = user?.role === 'agent'
  
  const { data: clients = [], isLoading: clientsLoading } = useMyClients()
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>('')
  
  const [showForm, setShowForm] = useState(false)
  
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
                  borderRadius: '6px', 
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
        />
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

      <section className="panel-grid">
        <div className="section-card">
          <div className="section-heading">
            <div><p className="eyebrow">Tips</p><h3>Listing lifecycle.</h3></div>
          </div>
          <div className="timeline">
            {['Create listing', 'Buyer places order', 'Confirm order', 'Transport assigned', 'Delivery complete', 'Payment received'].map((s) => (
              <div key={s} className="timeline-item">{s}</div>
            ))}
          </div>
        </div>
        <div className="section-card">
          <div className="section-heading">
            <div><p className="eyebrow">Status guide</p><h3>What each status means.</h3></div>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              { s: 'active', d: 'Visible to buyers in the marketplace.' },
              { s: 'sold', d: 'All quantity has been ordered and confirmed.' },
              { s: 'cancelled', d: 'Listing removed from marketplace.' },
            ].map((item) => (
              <div key={item.s} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <StatusBadge status={item.s} />
                <span style={{ color: '#374151', fontSize: '0.9rem' }}>{item.d}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function ListingCard({ listing }: { listing: Listing }) {
  const { mutate: deleteListing, isPending } = useDeleteListing()
  return (
    <article className="listing-card wide">
      <div className="listing-top">
        <StatusBadge status={listing.status} />
        <Icon name="leaf" />
      </div>
      <h3>{listing.vegetable_type}</h3>
      <div className="listing-meta">
        <span style={{ fontWeight: 700, color: '#264123' }}>GH₵ {listing.price_per_kg_ghs}/kg</span>
        <span>{listing.quantity_kg} kg</span>
      </div>
      {listing.harvest_date && (
        <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '8px 0 0' }}>
          Harvest: {new Date(listing.harvest_date).toLocaleDateString()}
        </p>
      )}
      <button
        type="button"
        className="secondary-button"
        disabled={isPending}
        onClick={() => { if (confirm('Delete this listing?')) deleteListing(listing.id) }}
        style={{ marginTop: 12, width: '100%', justifyContent: 'center', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}
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
  selectedFarmerId 
}: { 
  onClose: () => void
  isAgent: boolean
  clients: any[]
  selectedFarmerId: string
}) {
  const { mutate, isPending, error, isSuccess } = useCreateListing()
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateListingFormData, unknown, CreateListingFormData>({
    resolver: zodResolver(createListingSchema) as never,
  })
  
  const [formFarmerId, setFormFarmerId] = useState(selectedFarmerId)

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
    mutate(payload as any, { onSuccess: () => { reset(); onClose() } })
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
          <Field label="Quantity (kg)" dark type="number" min="1" placeholder="e.g. 200" error={errors.quantity_kg} {...register('quantity_kg')} />
          <Field label="Price per kg (GH₵)" dark type="number" step="0.01" min="0.01" placeholder="e.g. 4.50" error={errors.price_per_kg_ghs} {...register('price_per_kg_ghs')} />
          <Field label="Harvest Date" dark type="date" error={errors.harvest_date} {...register('harvest_date')} />
        </div>
        {apiError && <ErrorAlert message={apiError} />}
        {isSuccess && <div style={{ color: '#d6ffcd', fontWeight: 600 }}>Listing created ✓</div>}
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
