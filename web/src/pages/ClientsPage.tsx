import { useState } from 'react'
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

const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(/^(\+233|0)\d{9}$/, 'Enter a valid Ghanaian phone number e.g. 0244123456')

const registerClientSchema = z.object({
  phone: phoneSchema,
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
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
  const { register, handleSubmit, formState: { errors }, reset } = useForm<RegisterClientFormData>({
    resolver: zodResolver(registerClientSchema),
  })

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
