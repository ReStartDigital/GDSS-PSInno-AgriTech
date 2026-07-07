import { useJobs, useAcceptJob, useUpdateJobStatus, type Job } from '../hooks/useJobs'
import { Icon } from '../components/Icon'
import { Spinner, ErrorAlert, EmptyState, StatusBadge } from '../components/ui/Feedback'
import { PageHero } from '../components/ui/PageHero'

export default function JobsPage() {
  const { data, isLoading, error } = useJobs()
  const jobs = data ?? []

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Logistics Operations"
        title="Find deliveries near you."
        description="Claim available shipping jobs, manage transport routes, and update shipment status."
      />

      {isLoading && <Spinner />}
      {error && <ErrorAlert message="Could not load transport jobs." />}
      {!isLoading && !error && jobs.length === 0 && (
        <EmptyState message="No transport jobs available at the moment." />
      )}

      {jobs.length > 0 && (
        <section className="listing-grid">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </section>
      )}
    </div>
  )
}

function JobCard({ job }: { job: Job }) {
  const { mutate: accept, isPending: accepting } = useAcceptJob()
  const { mutate: updateStatus, isPending: updating } = useUpdateJobStatus()

  return (
    <article className="listing-card wide">
      <div className="listing-top">
        <StatusBadge status={job.status} />
        <Icon name="truck" />
      </div>
      <h3>Route: {job.route}</h3>
      <div className="listing-meta" style={{ display: 'grid', gap: 4, marginTop: 8 }}>
        <span style={{ fontSize: '0.9rem', color: '#374151' }}>
          <strong>Distance:</strong> {job.distanceKm} km
        </span>
        <span style={{ fontSize: '0.9rem', color: '#374151' }}>
          <strong>Earnings:</strong> GH₵ {job.costGhs}
        </span>
        {job.order && (
          <span style={{ fontSize: '0.9rem', color: '#374151' }}>
            <strong>Produce:</strong> {job.order.listing?.vegetable_type ?? 'Vegetables'} ({job.order.quantity_kg} kg)
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        {job.status === 'pending' && (
          <button
            type="button"
            className="primary-button"
            disabled={accepting}
            onClick={() => accept(job.id)}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {accepting ? 'Claiming…' : 'Claim Job'}
          </button>
        )}

        {job.status === 'assigned' && (
          <button
            type="button"
            className="primary-button"
            disabled={updating}
            onClick={() => updateStatus({ id: job.id, status: 'in_transit' })}
            style={{ width: '100%', justifyContent: 'center', background: '#2563eb', borderColor: '#2563eb' }}
          >
            {updating ? 'Updating…' : 'Start Transit'}
          </button>
        )}

        {job.status === 'in_transit' && (
          <button
            type="button"
            className="primary-button"
            disabled={updating}
            onClick={() => updateStatus({ id: job.id, status: 'delivered' })}
            style={{ width: '100%', justifyContent: 'center', background: '#16a34a', borderColor: '#16a34a' }}
          >
            {updating ? 'Updating…' : 'Confirm Delivery'}
          </button>
        )}

        {job.status === 'delivered' && (
          <div style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            ✓ Delivered successfully
          </div>
        )}

        {job.status === 'cancelled' && (
          <div style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.9rem' }}>
            ❌ Job Cancelled
          </div>
        )}
      </div>
    </article>
  )
}
