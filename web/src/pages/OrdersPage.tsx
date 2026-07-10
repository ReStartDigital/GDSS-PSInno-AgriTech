import { useState } from 'react'
import { toast } from 'sonner'
import {
  useMyOrders,
  useConfirmOrder,
  useCancelOrder,
  useNegotiateOrder,
  useReadyPickupOrder,
  useVerifyPickupOrder
} from '../hooks/useOrders'
import { useAuthStore } from '../store/auth.store'
import { getApiErrorMessage } from '../lib/errors'
import { Spinner, ErrorAlert, EmptyState, StatusBadge } from '../components/ui/Feedback'
import { Modal } from '../components/ui/Modal'
import { PageHero } from '../components/ui/PageHero'
import { ModalHeader } from '../components/ui/ModalHeader'
import { Icon } from '../components/Icon'
import type { Order } from '../types/api'
import { useMyTransporterJobs, type Job } from '../hooks/useJobs'
import { JobCard, JobDetailModal } from './JobsPage'

// Status-based visual config for order cards
const ORDER_STATUS_CONFIG: Record<string, { emoji: string; tint: string; accent: string }> = {
  pending:     { emoji: '⏳', tint: 'rgba(245,158,11,0.08)',   accent: '#d97706' },
  negotiating: { emoji: '🤝', tint: 'rgba(99,102,241,0.08)',  accent: '#6366f1' },
  confirmed:   { emoji: '✅', tint: 'rgba(22,101,52,0.08)',   accent: '#166534' },
  packed:      { emoji: '📦', tint: 'rgba(59,130,246,0.08)',  accent: '#2563eb' },
  in_transit:  { emoji: '🚛', tint: 'rgba(16,185,129,0.08)',  accent: '#059669' },
  delivered:   { emoji: '🎉', tint: 'rgba(214,255,205,0.35)', accent: '#15803d' },
  cancelled:   { emoji: '❌', tint: 'rgba(239,68,68,0.06)',   accent: '#dc2626' },
  pending_agent_confirmation: { emoji: '🕵️', tint: 'rgba(139,92,246,0.08)', accent: '#8b5cf6' },
  pending_sms_confirmation:   { emoji: '💬', tint: 'rgba(16,185,129,0.08)', accent: '#059669' },
}

function getOrderConfig(status: string) {
  return ORDER_STATUS_CONFIG[status] ?? { emoji: '📋', tint: 'rgba(107,114,128,0.08)', accent: '#374151' }
}

function TransporterDeliveriesPage() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const { data, isLoading, error } = useMyTransporterJobs()
  const jobs = data ?? []

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Deliveries"
        title="Your active deliveries."
        description="Track active transport routes, view customer locations, and complete verification."
      />

      {isLoading && <Spinner />}
      {error && <ErrorAlert message="Could not load deliveries. Is the backend running?" />}
      {!isLoading && !error && jobs.length === 0 && (
        <EmptyState message="No active or completed deliveries assigned to you yet." />
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

export default function OrdersPage() {
  const user = useAuthStore((s) => s.user)
  const isTransporter = user?.role === 'transporter'
  console.log(user)

  if (isTransporter) {
    return <TransporterDeliveriesPage />
  }

  const [selected, setSelected] = useState<Order | null>(null)
  const { data, isLoading, error } = useMyOrders()
  const orders = data ?? []

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Orders"
        title="Your order history."
        description="Track status, confirm deliveries, and manage your order lifecycle."
      />

      {isLoading && <Spinner />}
      {error && <ErrorAlert message="Could not load orders. Is the backend running?" />}
      {!isLoading && !error && orders.length === 0 && <EmptyState message="No orders yet." />}

      {orders.length > 0 && (
        <div className="mp-card-grid">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={() => setSelected(order)}
            />
          ))}
        </div>
      )}

      {selected && <OrderDetail order={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

// ── Order Card — mp-card style ─────────────────────────────────────────────────

function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const cfg = getOrderConfig(order.status)

  return (
    <article className="mp-card" onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Visual band */}
      <div className="mp-card-visual" style={{ background: cfg.tint }}>
        <span className="mp-card-emoji">{cfg.emoji}</span>

        {/* Status badge — top left */}
        <div style={{ position: 'absolute', top: 12, left: 12 }}>
          <StatusBadge status={order.status} />
        </div>

        {/* Mode badge — top right */}
        {order.mode && (
          <div style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'rgba(255,255,255,0.9)',
            borderRadius: 8,
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
          }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: cfg.accent, whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
              {order.mode}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="mp-card-body">
        <h3 className="mp-card-name">#{order.id.slice(0, 8)}</h3>
        <p className="mp-card-farmer">
          <span style={{ opacity: 0.5, marginRight: 4 }}>Placed</span>
          {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>

        {/* Price + quantity meta */}
        <div className="mp-card-meta">
          <div>
            <span className="mp-card-price">GH₵ {order.total_ghs}</span>
            <span className="mp-card-per"> total</span>
          </div>
          <div className="mp-card-qty">{order.quantity_kg} kg</div>
        </div>

        {order.delivery_address && (
          <p className="mp-card-date">
            <span style={{ opacity: 0.55 }}>To:</span>{' '}
            {order.delivery_address}
          </p>
        )}

        {/* CTA */}
        <button
          type="button"
          className="mp-order-btn"
          style={{ background: cfg.accent, marginTop: 'auto' }}
        >
          View Details
        </button>
      </div>
    </article>
  )
}

// ── Order Detail Modal ─────────────────────────────────────────────────────────

function OrderDetail({ order, onClose }: { order: Order; onClose: () => void }) {
  const user = useAuthStore((s) => s.user)
  const { mutate: confirm, isPending: confirming } = useConfirmOrder()
  const { mutate: cancel, isPending: cancelling } = useCancelOrder()
  const { mutate: negotiate, isPending: negotiating } = useNegotiateOrder()
  const { mutate: readyPickup, isPending: markingReady } = useReadyPickupOrder()
  const { mutate: verifyPickup, isPending: verifyingPickup } = useVerifyPickupOrder()

  const [counterPrice, setCounterPrice] = useState('')
  const [verificationPin, setVerificationPin] = useState('')
  const [paymentStep, setPaymentStep] = useState<'none' | 'form' | 'processing' | 'prompt' | 'success'>('none')
  const [momoNumber, setMomoNumber] = useState(user?.mobileMoneyNumber || '')
  const [momoNetwork, setMomoNetwork] = useState(user?.mobileMoneyNetwork || 'mtn')

  const isBuyer = user?.role === 'buyer'
  const isFarmerOrAgent = user?.role === 'farmer' || user?.role === 'agent'

  const canConfirm = isFarmerOrAgent && order.status === 'pending'
  const canCancel = (order.status === 'pending' || order.status === 'confirmed' || order.status === 'negotiating')
  const canNegotiate = (order.status === 'pending' || order.status === 'negotiating')
  const canReadyPickup = isFarmerOrAgent && order.status === 'packed' && order.mode === 'pickup'
  const canVerifyPickup = isFarmerOrAgent && order.status === 'packed' && order.mode === 'pickup'

  // We can track if this order was paid locally in this session to show nice status
  const [isLocallyPaid, setIsLocallyPaid] = useState(false)

  const handleNegotiateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const price = parseFloat(counterPrice)
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price greater than 0')
      return
    }

    negotiate(
      { id: order.id, counterPricePerKgGhs: price },
      {
        onSuccess: () => {
          toast.success('Counter-offer submitted successfully!')
          setCounterPrice('')
          onClose()
        },
        onError: (err: any) => {
          toast.error(getApiErrorMessage(err) || 'Failed to submit counter-offer')
        },
      }
    )
  }

  const handleReadyPickupSubmit = () => {
    readyPickup(order.id, {
      onSuccess: () => {
        toast.success('Order packed! Collection OTP sent to buyer.')
        onClose()
      },
      onError: (err: any) => {
        toast.error(getApiErrorMessage(err) || 'Failed to update order status')
      },
    })
  }

  const handleVerifyPickupSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!verificationPin.trim()) {
      toast.error('Please enter the verification PIN')
      return
    }

    verifyPickup(
      { id: order.id, pin: verificationPin.trim() },
      {
        onSuccess: () => {
          toast.success('Pickup verified! Funds released from escrow.')
          setVerificationPin('')
          onClose()
        },
        onError: (err: any) => {
          toast.error(getApiErrorMessage(err) || 'Invalid or expired OTP pin')
        },
      }
    )
  }

  const startMomoPayment = () => {
    setPaymentStep('form')
  }

  const handleMomoPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!momoNumber.trim()) {
      toast.error('Mobile money phone number is required')
      return
    }

    setPaymentStep('processing')
    setTimeout(() => {
      setPaymentStep('prompt')
      setTimeout(() => {
        setPaymentStep('success')
        setIsLocallyPaid(true)
        toast.success(`Payment of GH₵ ${order.totalGhs} secured in secure escrow!`)
      }, 3000)
    }, 2000)
  }

  return (
    <Modal onClose={onClose}>
      <ModalHeader
        eyebrow="Order Detail"
        title={`#${order.id.slice(0, 8)}`}
        subtitle={<StatusBadge status={order.status} />}
        onClose={onClose}
      />

      <div className="detail-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Quantity', value: `${order.quantityKg} kg` },
          { label: 'Total Price', value: `GH₵ ${order.totalGhs}` },
          { label: 'Price/kg', value: `GH₵ ${(order as any).pricePerKgGhs || order.listing?.pricePerKgGhs || 'N/A'}` },
          { label: 'Fulfillment Mode', value: order.mode === 'delivery' ? '🚛 Delivery' : '📦 Pickup' },
        ].map((item) => (
          <div key={item.label} className="detail-card">
            <strong>{item.label}</strong>
            <p>{item.value}</p>
          </div>
        ))}
      </div>

      {order.delivery_address && (
        <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(214,255,205,0.3)', marginBottom: 16 }}>
          <strong style={{ fontSize: '0.8rem', color: '#264123', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Delivery Address</strong>
          <p style={{ margin: '4px 0 0', color: '#374151' }}>{order.deliveryAddress}</p>
        </div>
      )}

      {/* ── Simulated Payment Gateway (Paystack Mobile Money integration) ── */}
      {isBuyer && (order.status === 'pending' || order.status === 'negotiating') && (
        <div style={{ padding: '16px', borderRadius: 16, background: '#f8faf5', border: '1px solid #d6ffcd', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <strong style={{ fontSize: '0.85rem', color: '#264123', display: 'block' }}>Payment Channel</strong>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                Secured via Paystack split settlements
              </span>
            </div>
            {isLocallyPaid ? (
              <span style={{ background: '#d6ffcd', color: '#264123', padding: '4px 10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 800 }}>
                ✓ Paid (Escrowed)
              </span>
            ) : (
              <span style={{ background: 'rgba(245,158,11,0.15)', color: '#d97706', padding: '4px 10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 800 }}>
                Pending Payment
              </span>
            )}
          </div>

          {paymentStep === 'none' && !isLocallyPaid && (
            <button
              type="button"
              className="primary-button"
              onClick={startMomoPayment}
              style={{ width: '100%', justifyContent: 'center', gap: 8, minHeight: 44 }}
            >
              <Icon name="shopping" /> Pay GH₵ {order.totalGhs} via MoMo
            </button>
          )}

          {paymentStep === 'form' && (
            <form onSubmit={handleMomoPaymentSubmit} style={{ display: 'grid', gap: 10, marginTop: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563' }}>MoMo Phone Number</label>
                  <input
                    type="text"
                    className="input-field"
                    value={momoNumber}
                    onChange={(e) => setMomoNumber(e.target.value)}
                    placeholder="e.g. 0244123456"
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563' }}>Provider</label>
                  <select
                    className="input-field"
                    value={momoNetwork}
                    onChange={(e) => setMomoNetwork(e.target.value)}
                  >
                    <option value="mtn">MTN</option>
                    <option value="vodafone">Telecel</option>
                    <option value="airteltigo">AirtelTigo</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="secondary-button" style={{ flex: 1, minHeight: 38 }} onClick={() => setPaymentStep('none')}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" style={{ flex: 2, minHeight: 38 }}>
                  Authorize Checkout
                </button>
              </div>
            </form>
          )}

          {paymentStep === 'processing' && (
            <div style={{ textAlign: 'center', padding: '16px 0', display: 'grid', gap: 10 }}>
              <Spinner />
              <p style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 600, margin: 0 }}>
                Contacting Paystack Gateway routing…
              </p>
            </div>
          )}

          {paymentStep === 'prompt' && (
            <div style={{ textAlign: 'center', padding: '16px 0', display: 'grid', gap: 8 }}>
              <div style={{ fontSize: '2rem', animation: 'pulse 1s infinite' }}>📱</div>
              <p style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 600, margin: 0 }}>
                Payment prompt dispatched to {momoNumber}!
              </p>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                Please enter your MoMo wallet PIN on your mobile device to complete payment.
              </p>
            </div>
          )}

          {paymentStep === 'success' && (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <p style={{ fontSize: '0.85rem', color: '#264123', fontWeight: 700, margin: 0 }}>
                🎉 Paystack Escrow Securely Authorized!
              </p>
              <p style={{ fontSize: '0.75rem', color: '#4b5563', margin: '4px 0 0' }}>
                Funds are protected. The producer has been notified to confirm and pack your consignment.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Negotiation Counter-Offer Section ── */}
      {canNegotiate && (
        <div style={{ padding: '16px', borderRadius: 16, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', marginBottom: 20 }}>
          <strong style={{ fontSize: '0.85rem', color: '#4f46e5', display: 'block', marginBottom: 8 }}>
            🤝 Price Negotiation Counter-Offer
          </strong>
          <form onSubmit={handleNegotiateSubmit} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#4b5563' }}>Your Counter Offer (GH₵ per kg)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="input-field"
                value={counterPrice}
                onChange={(e) => setCounterPrice(e.target.value)}
                placeholder={`Current GHC ${(order as any).pricePerKgGhs || order.listing?.pricePerKgGhs || '—'}`}
                required
              />
            </div>
            <button
              type="submit"
              className="primary-button"
              disabled={negotiating}
              style={{ background: '#4f46e5', minHeight: 44, padding: '0 16px' }}
            >
              {negotiating ? 'Submitting…' : 'Submit Offer'}
            </button>
          </form>
        </div>
      )}

      {/* ── Farmer/Agent Pickup Step 1: Mark Cargo Ready & dispatch OTP ── */}
      {canReadyPickup && (
        <div style={{ padding: '16px', borderRadius: 16, background: '#f8faf5', border: '1px solid #d6ffcd', marginBottom: 20 }}>
          <strong style={{ fontSize: '0.85rem', color: '#264123', display: 'block', marginBottom: 4 }}>
            📦 Prepared Cargo Shipment Handover
          </strong>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 12px' }}>
            Flag that you have packed and weighed this consignment. An automated Arkesel collection OTP PIN will be sent to the customer.
          </p>
          <button
            type="button"
            className="primary-button"
            onClick={handleReadyPickupSubmit}
            disabled={markingReady}
            style={{ width: '100%', justifyContent: 'center', minHeight: 44 }}
          >
            {markingReady ? 'Generating PIN…' : 'Weigh & Ready for Pickup'}
          </button>
        </div>
      )}

      {/* ── Farmer/Agent Pickup Step 2: Input customer OTP to finalize ── */}
      {canVerifyPickup && (
        <div style={{ padding: '16px', borderRadius: 16, background: 'rgba(21,128,61,0.05)', border: '1px solid rgba(21,128,61,0.15)', marginBottom: 20 }}>
          <strong style={{ fontSize: '0.85rem', color: '#15803d', display: 'block', marginBottom: 4 }}>
            🔑 In-Person Handover PIN Verification
          </strong>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 12px' }}>
            Ask the buyer for the SMS PIN sent to their registered phone number, enter it below to confirm pickup and release escrow funds.
          </p>
          <form onSubmit={handleVerifyPickupSubmit} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#4b5563' }}>Buyer Verification OTP (PIN)</label>
              <input
                type="text"
                className="input-field"
                value={verificationPin}
                onChange={(e) => setVerificationPin(e.target.value)}
                placeholder="6-digit PIN"
                maxLength={8}
                required
              />
            </div>
            <button
              type="submit"
              className="primary-button"
              disabled={verifyingPickup}
              style={{ background: '#15803d', minHeight: 44, padding: '0 16px' }}
            >
              {verifyingPickup ? 'Verifying…' : 'Verify & Handover'}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {canConfirm && (
          <button type="button" className="primary-button" disabled={confirming}
            onClick={() => confirm(order.id, { 
              onSuccess: () => {
                toast.success('Order confirmed!')
                onClose()
              },
              onError: (err: any) => toast.error(getApiErrorMessage(err) || 'Failed to confirm order')
            })}
            style={{ flex: 1, justifyContent: 'center', minHeight: 44 }}>
            {confirming ? 'Confirming…' : 'Confirm Order'}
          </button>
        )}
        {canCancel && (
          <button type="button" className="secondary-button" disabled={cancelling}
            onClick={() => cancel({ id: order.id, reason: 'Cancelled by user' }, { 
              onSuccess: () => {
                toast.success('Order cancelled!')
                onClose()
              },
              onError: (err: any) => toast.error(getApiErrorMessage(err) || 'Failed to cancel order')
            })}
            style={{ flex: 1, justifyContent: 'center', color: '#ef4444', minHeight: 44 }}>
            {cancelling ? 'Cancelling…' : 'Cancel Order'}
          </button>
        )}
        <button type="button" className="secondary-button" onClick={onClose} style={{ flex: 1, justifyContent: 'center', minHeight: 44 }}>
          Close
        </button>
      </div>
    </Modal>
  )
}
