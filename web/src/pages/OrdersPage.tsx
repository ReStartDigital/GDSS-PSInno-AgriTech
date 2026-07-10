import { useState } from 'react'
import { toast } from 'sonner'
import { useMyOrders, useConfirmOrder, useCancelOrder } from '../hooks/useOrders'
import { useAuthStore } from '../store/auth.store'
import { getApiErrorMessage } from '../lib/errors'
import { Spinner, ErrorAlert, EmptyState, StatusBadge } from '../components/ui/Feedback'
import { Modal } from '../components/ui/Modal'
import { PageHero } from '../components/ui/PageHero'
import { ModalHeader } from '../components/ui/ModalHeader'
import type { Order } from '../types/api'

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

export default function OrdersPage() {
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

  const canConfirm = (user?.role === 'farmer' || user?.role === 'agent') && order.status === 'pending'
  const canCancel = (order.status === 'pending' || order.status === 'confirmed')

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
          { label: 'Quantity', value: `${order.quantity_kg} kg` },
          { label: 'Total',    value: `GH₵ ${order.total_ghs}` },
          { label: 'Price/kg', value: `GH₵ ${order.price_per_kg_ghs}` },
          { label: 'Mode',     value: order.mode },
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
          <p style={{ margin: '4px 0 0', color: '#374151' }}>{order.delivery_address}</p>
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
            style={{ flex: 1, justifyContent: 'center' }}>
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
            style={{ flex: 1, justifyContent: 'center', color: '#ef4444' }}>
            {cancelling ? 'Cancelling…' : 'Cancel Order'}
          </button>
        )}
        <button type="button" className="secondary-button" onClick={onClose} style={{ flex: 1, justifyContent: 'center' }}>
          Close
        </button>
      </div>
    </Modal>
  )
}
