import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMyClients, useRegisterClient, useUnassignClient, type Client } from '../hooks/useClients'
import { getApiErrorMessage } from '../lib/errors'
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
        <div className="mp-card-grid">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  )
}

function ClientCard({ client }: { client: Client }) {
  const { mutate: unassign, isPending } = useUnassignClient()

  // Avatar color based on first letter
  const initials = `${client.firstName[0]}${client.lastName[0]}`.toUpperCase()
  const tint = 'rgba(214,255,205,0.35)'

  return (
    <article className="mp-card">
      {/* Visual band — person avatar */}
      <div className="mp-card-visual" style={{ background: tint }}>
        <span className="mp-card-emoji" style={{ fontSize: '2.6rem' }}>👤</span>

        {/* "Farmer Client" badge — top left */}
        <span className="mp-urgent-badge" style={{ background: 'linear-gradient(135deg, #166534 0%, #15803d 100%)' }}>
          Farmer Client
        </span>

        {/* Initials badge — top right */}
        <div className="mp-agriscore" style={{
          background: '#264123', borderRadius: 12,
          width: 34, height: 34,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#d6ffcd' }}>{initials}</span>
        </div>
      </div>

      {/* Body */}
      <div className="mp-card-body">
        <h3 className="mp-card-name">{client.firstName} {client.lastName}</h3>

        <p className="mp-card-farmer">
          <span style={{ opacity: 0.5, marginRight: 4 }}>📞</span>
          {client.phone}
        </p>

        {/* Region + language meta */}
        <div className="mp-card-meta" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
          {client.region && (
            <span style={{ fontSize: '0.82rem', color: '#374151' }}>
              📍 {client.region}
            </span>
          )}
          {client.language && (
            <span style={{ fontSize: '0.82rem', color: '#374151', textTransform: 'capitalize' }}>
              🗣 {client.language}
            </span>
          )}
          {client.email && (
            <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
              ✉️ {client.email}
            </span>
          )}
        </div>

        {/* Unassign action */}
        <button
          type="button"
          className="mp-order-btn"
          disabled={isPending}
          onClick={() => {
            if (confirm(`Unassign ${client.firstName} ${client.lastName}?`)) unassign(client.id)
          }}
          style={{ background: isPending ? '#9ca3af' : 'rgba(239,68,68,0.85)', marginTop: 'auto' }}
        >
          {isPending ? 'Unassigning…' : 'Unassign Client'}
        </button>
      </div>
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
              className="form-select dark"
              style={errors.region ? { borderColor: '#ef4444' } : undefined}
            >
              <option value="">Select Region</option>
              {REGIONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
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
              className="form-select dark"
              style={errors.language ? { borderColor: '#ef4444' } : undefined}
            >
              <option value="">Select Language</option>
              {LANGUAGES.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
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
