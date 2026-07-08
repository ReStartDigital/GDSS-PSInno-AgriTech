import { useJobs, useAcceptJob, useUpdateJobStatus, type Job } from '../hooks/useJobs'
import { Spinner, ErrorAlert, EmptyState } from '../components/ui/Feedback'
import { PageHero } from '../components/ui/PageHero'
import { getCropConfig } from '../lib/produceUtils'

// Job status visual config
const JOB_STATUS_CONFIG: Record<string, { emoji: string; tint: string; accent: string }> = {
  pending:    { emoji: '📍', tint: 'rgba(245,158,11,0.08)',  accent: '#d97706' },
  assigned:   { emoji: '🚚', tint: 'rgba(59,130,246,0.08)', accent: '#2563eb' },
  in_transit: { emoji: '🛣️', tint: 'rgba(16,185,129,0.08)', accent: '#059669' },
  delivered:  { emoji: '✅', tint: 'rgba(22,101,52,0.08)',  accent: '#15803d' },
  cancelled:  { emoji: '❌', tint: 'rgba(239,68,68,0.06)',  accent: '#dc2626' },
}

function getJobConfig(status: string) {
  return JOB_STATUS_CONFIG[status] ?? { emoji: '📦', tint: 'rgba(107,114,128,0.08)', accent: '#374151' }
}

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
        <div className="mp-card-grid">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Job Card — mp-card style ───────────────────────────────────────────────────

function JobCard({ job }: { job: Job }) {
  const { mutate: accept, isPending: accepting } = useAcceptJob()
  const { mutate: updateStatus, isPending: updating } = useUpdateJobStatus()

  const cfg = getJobConfig(job.status)
  const produceName = job.order?.listing?.vegetableType ?? 'Vegetables'
  const cropCfg = getCropConfig(produceName)

  return (
    <article className="mp-card">
      {/* Visual band — uses produce crop tint if available, else status tint */}
      <div className="mp-card-visual" style={{ background: job.order ? cropCfg.tint : cfg.tint }}>
        <span className="mp-card-emoji">
          {job.order ? cropCfg.emoji : cfg.emoji}
        </span>

        {/* Status badge — top left */}
        <span className="mp-urgent-badge" style={{
          background: job.status === 'delivered'
            ? 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)'
            : job.status === 'in_transit'
            ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
            : job.status === 'assigned'
            ? 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)'
            : job.status === 'cancelled'
            ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
            : 'linear-gradient(135deg, #92400e 0%, #d97706 100%)',
        }}>
          {job.status.replace('_', ' ')}
        </span>

        {/* Distance badge — top right */}
        {job.distanceKm && (
          <div className="mp-agriscore" style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 8, padding: '3px 8px', display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: cfg.accent, whiteSpace: 'nowrap' }}>
              {job.distanceKm} km
            </span>
          </div>
        )}
      </div>

      {/* Route map canvas preview */}
      <div style={{
        background: '#e5ebd9',
        borderBottom: '1px solid rgba(38,65,35,0.08)',
        height: 120,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.1, background: 'radial-gradient(circle, #264123 10%, transparent 10%)', backgroundSize: '16px 16px' }} />
        
        <svg style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 1 }}>
          <path
            d="M 50 60 Q 150 20 250 60"
            fill="none"
            stroke="#264123"
            strokeWidth="3"
            strokeDasharray="6,4"
          />
          {job.status === 'in_transit' && (
            <circle r="6" fill="#10b981">
              <animateMotion
                path="M 50 60 Q 150 20 250 60"
                dur="4s"
                repeatCount="indefinite"
              />
            </circle>
          )}
        </svg>

        <div style={{
          position: 'absolute', left: 42, top: 46, zIndex: 2,
          background: '#264123', color: '#fff', borderRadius: '50%',
          width: 22, height: 22, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800,
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}>
          A
        </div>
        
        <div style={{
          position: 'absolute', right: 42, top: 46, zIndex: 2,
          background: '#15803d', color: '#fff', borderRadius: '50%',
          width: 22, height: 22, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800,
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}>
          B
        </div>

        <span style={{ position: 'absolute', bottom: 10, left: 16, fontSize: '0.65rem', fontWeight: 700, color: '#264123', background: 'rgba(255,255,255,0.85)', padding: '2px 6px', borderRadius: 4 }}>
          {job.route.split(' to ')[0] || 'Origin'}
        </span>
        <span style={{ position: 'absolute', bottom: 10, right: 16, fontSize: '0.65rem', fontWeight: 700, color: '#15803d', background: 'rgba(255,255,255,0.85)', padding: '2px 6px', borderRadius: 4 }}>
          {job.route.split(' to ')[1] || 'Destination'}
        </span>
      </div>

      {/* Body */}
      <div className="mp-card-body">
        <h3 className="mp-card-name" style={{ fontSize: '1rem' }}>{job.route}</h3>

        {job.order && (
          <p className="mp-card-farmer">
            <span style={{ opacity: 0.5, marginRight: 4 }}>Cargo:</span>
            {produceName} · {job.order.quantity_kg} kg
          </p>
        )}

        {/* Earnings + distance meta row */}
        <div className="mp-card-meta">
          <div>
            <span className="mp-card-price">GH₵ {job.costGhs}</span>
            <span className="mp-card-per"> earnings</span>
          </div>
          {job.distanceKm && (
            <div className="mp-card-qty">{job.distanceKm} km</div>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
          {job.status === 'pending' && (
            <button type="button" className="mp-order-btn"
              disabled={accepting}
              onClick={() => accept(job.id)}
              style={{ background: '#264123' }}>
              {accepting ? 'Claiming…' : '🤝 Claim Job'}
            </button>
          )}

          {job.status === 'assigned' && (
            <button type="button" className="mp-order-btn"
              disabled={updating}
              onClick={() => updateStatus({ id: job.id, status: 'in_transit' })}
              style={{ background: '#1d4ed8' }}>
              {updating ? 'Updating…' : '🚚 Start Transit'}
            </button>
          )}

          {job.status === 'in_transit' && (
            <button type="button" className="mp-order-btn"
              disabled={updating}
              onClick={() => updateStatus({ id: job.id, status: 'delivered' })}
              style={{ background: '#059669' }}>
              {updating ? 'Updating…' : '✅ Confirm Delivery'}
            </button>
          )}

          {job.status === 'delivered' && (
            <div style={{ textAlign: 'center', padding: '8px', color: '#15803d', fontWeight: 700, fontSize: '0.85rem' }}>
              🎉 Delivered successfully
            </div>
          )}

          {job.status === 'cancelled' && (
            <div style={{ textAlign: 'center', padding: '8px', color: '#dc2626', fontWeight: 700, fontSize: '0.85rem' }}>
              ❌ Job cancelled
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
