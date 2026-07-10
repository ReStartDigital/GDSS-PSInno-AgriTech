import { useState } from 'react'
import { toast } from 'sonner'
import { useJobs, useAcceptJob, useUpdateJobStatus, type Job } from '../hooks/useJobs'
import { Spinner, ErrorAlert, EmptyState } from '../components/ui/Feedback'
import { PageHero } from '../components/ui/PageHero'
import { getCropConfig } from '../lib/produceUtils'
import { JobsMap } from '../components/map/JobsMap'
import { RoutePreviewSvg } from '../components/map/RoutePreviewSvg'
import { Modal } from '../components/ui/Modal'
import { ModalHeader } from '../components/ui/ModalHeader'
import { getApiErrorMessage } from '../lib/errors'

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
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

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
            <JobCard key={job.id} job={job} onViewDetails={() => setSelectedJob(job)} />
          ))}
        </div>
      )}

      {selectedJob && (
        <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </div>
  )
}

// ── Job Card — mp-card style ───────────────────────────────────────────────────

export function JobCard({ job, onViewDetails }: { job: Job; onViewDetails: () => void }) {
  const cfg = getJobConfig(job.status)
  const produceName = job.order?.listing?.vegetableType ?? 'Vegetables'
  const cropCfg = getCropConfig(produceName)


  return (
    <article className="mp-card" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Visual band — uses produce crop tint if available, else status tint */}
      <div className="mp-card-visual" style={{ background: job.order ? cropCfg.tint : cfg.tint, height: 100 }}>
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

      {/* Static SVG route preview — no Leaflet, no z-index bleed */}
      <div style={{
        background: '#eef3e8',
        borderBottom: '1px solid rgba(38,65,35,0.08)',
        height: 110,
        overflow: 'hidden',
      }}>
        <RoutePreviewSvg
          distanceKm={job.distanceKm}
          accent={cfg.accent}
          route={job.route}
        />
      </div>

      {/* Body */}
      <div className="mp-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 className="mp-card-name" style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 4 }}>{job.route}</h3>

        {job.order && (
          <p className="mp-card-farmer" style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0 0 10px' }}>
            <span style={{ opacity: 0.6, marginRight: 4 }}>Cargo:</span>
            {produceName} · {job.order.quantityKg || job.order.quantity_kg || 0} kg
          </p>
        )}

        {/* Earnings + distance meta row */}
        <div className="mp-card-meta" style={{ marginTop: 'auto', marginBottom: 12 }}>
          <div>
            <span className="mp-card-price" style={{ fontSize: '1.1rem', fontWeight: 800 }}>GH₵ {job.costGhs}</span>
            <span className="mp-card-per" style={{ fontSize: '0.75rem' }}> payment</span>
          </div>
        </div>

        {/* View Details triggers details modal */}
        <button
          type="button"
          className="mp-order-btn"
          onClick={onViewDetails}
          style={{ background: '#264123', width: '100%', minHeight: 44 }}
        >
          🔎 View Details & Route
        </button>
      </div>
    </article>
  )
}

// ── Job Detail Modal ─────────────────────────────────────────────────────────

export function JobDetailModal({ job, onClose }: { job: Job; onClose: () => void }) {
  const { mutate: accept, isPending: accepting } = useAcceptJob()
  const { mutate: updateStatus, isPending: updating } = useUpdateJobStatus()
  const [verificationPin, setVerificationPin] = useState('')

  const cfg = getJobConfig(job.status)
  const produceName = job.order?.listing?.vegetableType ?? 'Vegetables'

  const pickup = job.pickupLocation?.coordinates
    ? { lat: job.pickupLocation.coordinates[1], lng: job.pickupLocation.coordinates[0] }
    : { lat: 5.6037, lng: -0.1870 }

  const dropoff = job.dropoffLocation?.coordinates
    ? { lat: job.dropoffLocation.coordinates[1], lng: job.dropoffLocation.coordinates[0] }
    : { lat: 6.6666, lng: -1.6163 }

  const pickupCoords: [number, number] = [pickup.lat, pickup.lng]
  const dropoffCoords: [number, number] = [dropoff.lat, dropoff.lng]

  const isClaimed = job.status !== 'pending'

  const handleAccept = () => {
    accept(job.id, {
      onSuccess: () => {
        toast.success('Job claimed successfully! Pick-up details unlocked.')
        onClose()
      },
      onError: (err: any) => {
        toast.error(getApiErrorMessage(err) || 'Failed to claim job')
      }
    })
  }

  const handleArrive = () => {
    updateStatus(
      { id: job.id, status: 'in_transit' },
      {
        onSuccess: () => {
          toast.success('Status updated! You have marked arrived at the doorstep.')
          onClose()
        },
        onError: (err: any) => {
          toast.error(getApiErrorMessage(err) || 'Failed to update job status')
        }
      }
    )
  }

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!verificationPin.trim()) {
      toast.error('Please enter the delivery verification pin')
      return
    }

    updateStatus(
      { id: job.id, status: 'delivered', pin: verificationPin.trim() },
      {
        onSuccess: () => {
          toast.success('Delivery verified successfully! Funds released from escrow.')
          setVerificationPin('')
          onClose()
        },
        onError: (err: any) => {
          toast.error(getApiErrorMessage(err) || 'Invalid or incorrect verification PIN')
        }
      }
    )
  }

  return (
    <Modal onClose={onClose}>
      <ModalHeader
        eyebrow="Transport Request details"
        title={job.route}
        subtitle={<span style={{ color: cfg.accent, fontWeight: 700 }}>{job.status.toUpperCase()}</span>}
        onClose={onClose}
      />

      {/* Interactive Leaflet Map — keyed by job.id so it fully remounts per job */}
      <div style={{
        height: 240,
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid rgba(38,65,35,0.08)',
        marginBottom: 16,
        position: 'relative'
      }}>
        <JobsMap key={job.id} pickup={pickupCoords} dropoff={dropoffCoords} interactive={true} />
        <div style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          background: 'rgba(255,255,255,0.92)',
          padding: '4px 10px',
          borderRadius: 8,
          fontSize: '0.7rem',
          fontWeight: 700,
          color: '#374151',
          zIndex: 400,
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          🗺️ Zoom & drag to explore route
        </div>
      </div>

      {/* Pricing and cargo breakdown */}
      <div className="detail-grid" style={{ marginBottom: 16 }}>
        {[
          { label: 'Cargo Produce', value: produceName },
          { label: 'Consignment Weight', value: `${job.order?.quantityKg || job.order?.quantity_kg || 0} kg` },
          { label: 'Trip Earnings', value: `GH₵ ${job.costGhs}` },
          { label: 'Distance', value: `${job.distanceKm} km` },
        ].map((item) => (
          <div key={item.label} className="detail-card">
            <strong>{item.label}</strong>
            <p>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Locked Contact Details (Unlocked only after accepting transport job) */}
      <div style={{
        padding: 16,
        borderRadius: 16,
        background: isClaimed ? 'rgba(214,255,205,0.15)' : '#f9fafb',
        border: isClaimed ? '1px solid #d6ffcd' : '1px dashed #e5e7eb',
        marginBottom: 20
      }}>
        <strong style={{ fontSize: '0.8rem', color: isClaimed ? '#264123' : '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
          {isClaimed ? '🔓 Unlocked Customer & Producer Contacts' : '🔒 Claim Job to Unlock Contact Info'}
        </strong>

        {isClaimed ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: '0.85rem' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#374151' }}>Sender (Farmer)</p>
              <p style={{ margin: '4px 0 0', color: '#6b7280' }}>
                {job.order?.listing?.farmer?.firstName || 'Local Producer'}
              </p>
              <p style={{ margin: '2px 0 0', color: '#264123', fontWeight: 600 }}>
                📞 {job.order?.listing?.farmer?.phone || '0244000111'}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#374151' }}>Recipient (Buyer)</p>
              <p style={{ margin: '4px 0 0', color: '#6b7280' }}>
                {job.order?.buyer?.firstName || 'Local Merchant'} {job.order?.buyer?.lastName || ''}
              </p>
              <p style={{ margin: '2px 0 0', color: '#1d4ed8', fontWeight: 600 }}>
                📞 {job.order?.buyer?.phone || '0244111222'}
              </p>
              {job.order?.deliveryAddress && (
                <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                  📍 {job.order.deliveryAddress}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
            For logistics safety and privacy, detailed phone numbers and exact destination addresses are hidden until the job is assigned to you.
          </p>
        )}
      </div>

      {/* Action panel depends on state */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {job.status === 'pending' && (
          <button
            type="button"
            className="primary-button"
            onClick={handleAccept}
            disabled={accepting}
            style={{ width: '100%', justifyContent: 'center', minHeight: 44 }}
          >
            {accepting ? 'Claiming…' : '🤝 Claim Delivery Job'}
          </button>
        )}

        {job.status === 'assigned' && (
          <button
            type="button"
            className="primary-button"
            onClick={handleArrive}
            disabled={updating}
            style={{ width: '100%', justifyContent: 'center', minHeight: 44, background: '#1d4ed8' }}
          >
            {updating ? 'Updating…' : '🚚 Mark Arrived at Destination'}
          </button>
        )}

        {(job.status === 'in_transit' || (job.status as string) === 'arrived') && (
          <div style={{ padding: '14px', borderRadius: 12, background: 'rgba(21,128,61,0.04)', border: '1px solid rgba(21,128,61,0.15)', display: 'grid', gap: 10 }}>
            <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#15803d' }}>
              🔑 Secure Handover Delivery OTP Verification
            </p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>
              You have arrived! Ask the buyer for the 6-digit delivery verification OTP PIN they received via SMS.
            </p>
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#4b5563' }}>Buyer Delivery OTP</label>
                <input
                  type="text"
                  className="input-field"
                  value={verificationPin}
                  onChange={(e) => setVerificationPin(e.target.value)}
                  placeholder="6-digit PIN"
                  maxLength={10}
                  required
                />
              </div>
              <button
                type="submit"
                className="primary-button"
                disabled={updating}
                style={{ background: '#15803d', minHeight: 44, padding: '0 16px' }}
              >
                {updating ? 'Verifying…' : 'Verify OTP'}
              </button>
            </form>
          </div>
        )}

        {job.status === 'delivered' && (
          <div style={{ padding: '12px', borderRadius: 12, background: 'rgba(22,101,52,0.06)', color: '#15803d', fontWeight: 800, fontSize: '0.85rem', textAlign: 'center' }}>
            🎉 Shipment Handed Over & Financial settlements finalized!
          </div>
        )}

        <button
          type="button"
          className="secondary-button"
          onClick={onClose}
          style={{ width: '100%', justifyContent: 'center', minHeight: 44 }}
        >
          Close Panel
        </button>
      </div>
    </Modal>
  )
}
