import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMyClients, useRegisterClient, useUnassignClient, type Client } from '../hooks/useClients'
import { getApiErrorMessage } from '../lib/errors'
import { Icon } from '../components/Icon'
import { Spinner, ErrorAlert, EmptyState } from '../components/ui/Feedback'
import { Field } from '../components/ui/Field'
import { PageHero } from '../components/ui/PageHero'
import { FormActions } from '../components/ui/FormActions'
import { REGIONS, LANGUAGES } from './auth/RegisterPage'

const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(/^(\+233|0)\d{9}$/, 'Enter a valid Ghanaian phone number e.g. 0244123456')

const registerClientSchema = z.object({
  phone: phoneSchema,
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  region: z.string().min(1, 'Region is required'),
  language: z.string().min(1, 'Preferred language is required'),
})

type RegisterClientFormData = z.infer<typeof registerClientSchema>

export default function ClientsPage() {
  const [showForm, setShowForm] = useState(false)
  const { data, isLoading, error } = useMyClients()
  const clients = data ?? []

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Agent Management"
        title="Your represented farmers."
        description="Register and manage farmer clients under your field-operations representation."
        action={
          <button type="button" className="primary-button" onClick={() => setShowForm(true)}>
            + Register Farmer
          </button>
        }
      />

      {showForm && <RegisterClientForm onClose={() => setShowForm(false)} />}

      {isLoading && <Spinner />}
      {error && <ErrorAlert message="Could not load your clients. Make sure the backend is running." />}
      {!isLoading && !error && clients.length === 0 && (
        <EmptyState message="You represent no farmers yet. Register your first farmer above." />
      )}

      {clients.length > 0 && (
        <section className="listing-grid">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </section>
      )}
    </div>
  )
}

function ClientCard({ client }: { client: Client }) {
  const { mutate: unassign, isPending } = useUnassignClient()
  return (
    <article className="listing-card wide">
      <div className="listing-top">
        <span className="status-pill">Farmer Client</span>
        <Icon name="user" />
      </div>
      <h3>{client.firstName} {client.lastName}</h3>
      <div className="listing-meta" style={{ display: 'grid', gap: 4, marginTop: 8 }}>
        <span style={{ fontSize: '0.9rem', color: '#374151' }}>
          <strong>Phone:</strong> {client.phone}
        </span>
        {client.email && (
          <span style={{ fontSize: '0.9rem', color: '#374151' }}>
            <strong>Email:</strong> {client.email}
          </span>
        )}
        {client.region && (
          <span style={{ fontSize: '0.9rem', color: '#374151' }}>
            <strong>Region:</strong> {client.region}
          </span>
        )}
        {client.language && (
          <span style={{ fontSize: '0.9rem', color: '#374151' }}>
            <strong>Preferred Language:</strong> <span style={{ textTransform: 'capitalize' }}>{client.language}</span>
          </span>
        )}
      </div>
      <button
        type="button"
        className="secondary-button"
        disabled={isPending}
        onClick={() => {
          if (confirm(`Are you sure you want to unassign ${client.firstName} ${client.lastName}?`)) {
            unassign(client.id)
          }
        }}
        style={{ marginTop: 16, width: '100%', justifyContent: 'center', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}
      >
        {isPending ? 'Unassigning…' : 'Unassign Client'}
      </button>
    </article>
  )
}

function RegisterClientForm({ onClose }: { onClose: () => void }) {
  const { mutate, isPending, error, isSuccess } = useRegisterClient()
  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<RegisterClientFormData>({
    resolver: zodResolver(registerClientSchema),
  })

  const selectedRegion = watch('region')

  useEffect(() => {
    if (selectedRegion) {
      const regionObj = REGIONS.find(r => r.value === selectedRegion)
      if (regionObj) {
        setValue('language', regionObj.defaultLang, { shouldValidate: true })
      }
    }
  }, [selectedRegion, setValue])

  const onSubmit = (data: RegisterClientFormData) => {
    // clean email if it's empty string
    const payload = {
      ...data,
      email: data.email || undefined,
    }
    mutate(payload, {
      onSuccess: () => {
        reset()
        onClose()
      },
    })
  }

  const apiError = getApiErrorMessage(error)

  return (
    <section className="section-card accent-card">
      <div className="section-heading">
        <div><p className="eyebrow">Onboard Farmer</p><h3>Register a new client.</h3></div>
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#f8faf5', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: 14 }}>
        <div className="form-grid">
          <Field label="First Name" dark placeholder="e.g. Abena" error={errors.firstName} {...register('firstName')} />
          <Field label="Last Name" dark placeholder="e.g. Mensah" error={errors.lastName} {...register('lastName')} />
          <Field label="Phone Number" dark placeholder="e.g. 0244123456" error={errors.phone} {...register('phone')} />
          <Field label="Email Address (Optional)" dark placeholder="e.g. abena@gmail.com" error={errors.email} {...register('email')} />

          <div style={{ display: 'grid', gap: 6 }}>
            <span style={{ color: 'rgba(248,250,245,0.86)', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Region
            </span>
            <select
              {...register('region')}
              style={{
                minHeight: 50, padding: '0 14px', borderRadius: 12,
                border: `1px solid ${errors.region ? '#ef4444' : 'rgba(255,255,255,0.14)'}`,
                background: 'rgba(255,255,255,0.1)',
                color: '#f8faf5',
                fontSize: '1rem', width: '100%', boxSizing: 'border-box',
                outline: 'none',
              }}
            >
              <option value="" style={{ background: '#264123', color: '#f8faf5' }}>Select Region</option>
              {REGIONS.map(r => (
                <option key={r.value} value={r.value} style={{ background: '#264123', color: '#f8faf5' }}>{r.label}</option>
              ))}
            </select>
            {errors.region && (
              <span style={{ color: '#fca5a5', fontSize: '0.78rem' }}>{errors.region.message}</span>
            )}
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            <span style={{ color: 'rgba(248,250,245,0.86)', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Preferred Language
            </span>
            <select
              {...register('language')}
              style={{
                minHeight: 50, padding: '0 14px', borderRadius: 12,
                border: `1px solid ${errors.language ? '#ef4444' : 'rgba(255,255,255,0.14)'}`,
                background: 'rgba(255,255,255,0.1)',
                color: '#f8faf5',
                fontSize: '1rem', width: '100%', boxSizing: 'border-box',
                outline: 'none',
              }}
            >
              <option value="" style={{ background: '#264123', color: '#f8faf5' }}>Select Language</option>
              {LANGUAGES.map(l => (
                <option key={l.value} value={l.value} style={{ background: '#264123', color: '#f8faf5' }}>{l.label}</option>
              ))}
            </select>
            {errors.language && (
              <span style={{ color: '#fca5a5', fontSize: '0.78rem' }}>{errors.language.message}</span>
            )}
          </div>
        </div>
        {apiError && <ErrorAlert message={apiError} />}
        {isSuccess && <div style={{ color: '#d6ffcd', fontWeight: 600 }}>Farmer onboarded ✓</div>}
        <FormActions
          onCancel={onClose}
          submitLabel="Register Farmer"
          pendingLabel="Registering…"
          isPending={isPending}
        />
      </form>
    </section>
  )
}
