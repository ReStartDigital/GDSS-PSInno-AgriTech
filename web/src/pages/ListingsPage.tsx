import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMyListings, useCreateListing, useDeleteListing } from '../hooks/useListings'
import { useMyClients } from '../hooks/useClients'
import { createListingSchema } from '../schemas'
import { useAuthStore } from '../store/auth.store'
import { getApiErrorMessage } from '../lib/errors'
import { Spinner, ErrorAlert, EmptyState } from '../components/ui/Feedback'
import { Field } from '../components/ui/Field'
import { PageHero } from '../components/ui/PageHero'
import { FormActions } from '../components/ui/FormActions'
import { getCropConfig } from '../lib/produceUtils'
import { toast } from 'sonner'

export default function ListingsPage() {
  const [showForm, setShowForm] = useState(false)
  const user = useAuthStore((s) => s.user)
  const isAgent = user?.role === 'agent'
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>('')

  // If agent, fetch represented farmers so they can select or view client-specific listings
  const { data: clients } = useMyClients()
  const activeFarmerId = isAgent ? selectedFarmerId || undefined : undefined

  const { data: listings, isLoading, error } = useMyListings(activeFarmerId)
  const { mutate: deleteListing } = useDeleteListing()

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to cancel this listing? This action cannot be undone.')) {
      deleteListing(id, {
        onSuccess: () => {
          toast.success('Listing cancelled successfully')
        },
        onError: (err) => {
          toast.error(getApiErrorMessage(err) || 'Failed to cancel listing')
        },
      })
    }
  }

  return (
    <div className="page-stack">
      <PageHero
        eyebrow={isAgent ? "Agent Field Operations" : "Farmer Dashboard"}
        title={isAgent ? "Client Produce Listings" : "Your Listed Produce"}
        description={isAgent 
          ? "Manage, update, and publish fresh crop listings on behalf of your represented local farmers."
          : "View, list, and monitor your active fresh produce in the marketplace."}
        action={
          <button type="button" className="primary-button" onClick={() => setShowForm(true)}>
            + Create New Listing
          </button>
        }
      />

      {isAgent && clients && clients.length > 0 && (
        <div className="section-card" style={{ padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#264123' }}>Filter by Client:</span>
          <select 
            className="input-field" 
            style={{ width: 'auto', minWidth: 200, padding: '6px 12px', fontSize: '0.85rem' }}
            value={selectedFarmerId}
            onChange={(e) => setSelectedFarmerId(e.target.value)}
          >
            <option value="">All represented farmers</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
            ))}
          </select>
        </div>
      )}

      {showForm && (
        <CreateListingForm 
          onClose={() => setShowForm(false)} 
          representedFarmers={isAgent ? clients || [] : []}
        />
      )}

      {isLoading && <Spinner />}
      {error && <ErrorAlert message="Could not load produce listings." />}
      {!isLoading && !error && (!listings || listings.length === 0) && (
        <EmptyState message="No active listings found. Use the button above to publish your first crop!" />
      )}

      {!isLoading && !error && listings && listings.length > 0 && (
        <div className="mp-card-grid">
          {listings.map((listing) => {
            const cfg = getCropConfig(listing.vegetableType)
            return (
              <article key={listing.id} className="mp-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div className="mp-card-visual" style={{ background: cfg.tint, height: 160 }}>
                  <span className="mp-card-emoji">{cfg.emoji}</span>
                  <span className={`status-badge ${listing.status === 'active' ? 'active' : 'inactive'}`} style={{ position: 'absolute', top: 12, left: 12 }}>
                    {listing.status}
                  </span>
                </div>
                <div className="mp-card-body" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 className="mp-card-name" style={{ margin: '0 0 4px' }}>{listing.vegetableType}</h3>
                  {isAgent && listing.farmer && (
                    <p className="mp-card-farmer" style={{ margin: '0 0 12px', fontSize: '0.8rem', opacity: 0.8 }}>
                      by <strong>{listing.farmer.firstName} {listing.farmer.lastName}</strong>
                    </p>
                  )}
                  
                  <div className="mp-card-meta" style={{ marginTop: 'auto', borderTop: '1px solid #f0f2f4', paddingTop: 12 }}>
                    <div>
                      <span className="mp-card-price">GH₵ {listing.pricePerKgGhs}</span>
                      <span className="mp-card-per"> /kg</span>
                    </div>
                    <div className="mp-card-qty" style={{ fontWeight: 600 }}>{listing.quantityKg} kg</div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <button 
                      type="button" 
                      onClick={() => handleDelete(listing.id)}
                      className="primary-button" 
                      style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', padding: '6px 12px', fontSize: '0.8rem', flex: 1 }}
                    >
                      Cancel Listing
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface CreateListingFormProps {
  onClose: () => void
  representedFarmers: Array<{ id: string; firstName: string; lastName: string }>
}

function CreateListingForm({ onClose, representedFarmers }: CreateListingFormProps) {
  const { mutate: createListing, isPending, error } = useCreateListing()
  const user = useAuthStore((s) => s.user)
  const isAgent = user?.role === 'agent'

  const { register, handleSubmit, formState: { errors } } = useForm<any>({
    resolver: zodResolver(createListingSchema) as any,
    defaultValues: {
      vegetable_type: '',
      quantity_kg: 0,
      price_per_kg_ghs: 0,
      harvest_date: new Date().toISOString().split('T')[0],
      location: {
        lat: 6.6745, // Defaults to Kumasi region coordinates
        lng: -1.6190,
      },
      supports_delivery: true,
      supports_pickup: true,
      images: [],
    }
  })

  const onSubmit = (data: any) => {
    createListing(data, {
      onSuccess: () => {
        toast.success('Listing created successfully!')
        onClose()
      },
      onError: (err) => {
        toast.error(getApiErrorMessage(err) || 'Failed to create listing')
      },
    })
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-container" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <h3 className="modal-title">Publish Crop Listing</h3>
          <button type="button" className="modal-close-button" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="page-stack" style={{ padding: 24 }}>
          {error && <ErrorAlert message={getApiErrorMessage(error) || 'An error occurred'} />}

          {isAgent && representedFarmers.length > 0 && (
            <Field label="Publish for Farmer Client" error={errors.farmer_id as any} {...register('farmer_id')}>
              <select className="input-field" {...register('farmer_id')}>
                <option value="">Select a farmer client...</option>
                {representedFarmers.map((f) => (
                  <option key={f.id} value={f.id}>{f.firstName} {f.lastName}</option>
                ))}
              </select>
            </Field>
          )}

          <div style={{ display: 'grid', gap: 6 }}>
            <span className="form-field-label">Vegetable/Crop Type</span>
            <select className="form-input" {...register('vegetable_type')}>
              <option value="">Select crop...</option>
              <option value="Tomatoes">Tomatoes 🍅</option>
              <option value="Pepper">Pepper 🌶️</option>
              <option value="Onions">Onions 🧅</option>
              <option value="Yam">Yam 🥔</option>
              <option value="Okra">Okra 🥦</option>
              <option value="Cabbage">Cabbage 🥬</option>
            </select>
            {errors.vegetable_type && (
              <span className="form-field-error">{(errors.vegetable_type as any).message}</span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Quantity (kg)" error={errors.quantity_kg as any} {...register('quantity_kg', { valueAsNumber: true })} />
            <Field label="Price (GH₵ per kg)" error={errors.price_per_kg_ghs as any} {...register('price_per_kg_ghs', { valueAsNumber: true })} />
          </div>

          <Field label="Expected Harvest Date" error={errors.harvest_date as any} {...register('harvest_date')} />

          <div style={{ display: 'flex', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 600 }}>
              <input type="checkbox" {...register('supports_delivery')} />
              Supports Delivery
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 600 }}>
              <input type="checkbox" {...register('supports_pickup')} />
              Supports Pickup
            </label>
          </div>

          <FormActions
            onCancel={onClose}
            submitLabel="Publish Listing"
            isPending={isPending}
          />
        </form>
      </div>
    </div>
  )
}
