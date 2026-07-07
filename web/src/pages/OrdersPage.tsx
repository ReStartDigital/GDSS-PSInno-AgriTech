import { useState } from 'react'
import { useMyOrders, useConfirmOrder, useCancelOrder } from '../hooks/useOrders'
import { useAuthStore } from '../store/auth.store'
import { Icon } from '../components/Icon'
import { Spinner, ErrorAlert, EmptyState, StatusBadge } from '../components/ui/Feedback'
import { Modal } from '../components/ui/Modal'
import { PageHero } from '../components/ui/PageHero'
import { ModalHeader } from '../components/ui/ModalHeader'
import type { Order } from '../types/api'

export default function OrdersPage() {
  const [selected, setSelected] = useState<Order | null>(null)
  const { data, isLoading, error } = useMyOrders()
  const orders = data ?? []

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Orders"
        title="Your order history and active orders."
        description="Track status, confirm deliveries, and manage your order lifecycle."
      />

      {isLoading && <Spinner />}
      {error && <ErrorAlert message="Could not load orders. Is the backend running?" />}
      {!isLoading && !error && orders.length === 0 && <EmptyState message="No orders yet." />}

      {orders.length > 0 && (
        <section className="listing-grid">
          {orders.map((order) => (
            <article
              key={order.id}
              className="listing-card wide"
              style={{ cursor: 'pointer' }}
              onClick={() => setSelected(order)}
            >
              <div className="listing-top">
                <StatusBadge status={order.status} />
                <Icon name="truck" />
              </div>
              <h3 style={{ fontSize: '0.95rem', margin: '8px 0 4px' }}>#{order.id.slice(0, 8)}</h3>
              <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: 0 }}>{order.quantity_kg} kg</p>
              <div className="listing-meta" style={{ marginTop: 8 }}>
                <span style={{ fontWeight: 700, color: '#264123' }}>GH₵ {order.total_ghs}</span>
                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{new Date(order.created_at).toLocaleDateString()}</span>
              </div>
            </article>
          ))}
        </section>
      )}

      {selected && <OrderDetail order={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}

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
          { label: 'Total', value: `GH₵ ${order.total_ghs}` },
          { label: 'Price/kg', value: `GH₵ ${order.price_per_kg_ghs}` },
          { label: 'Mode', value: order.mode },
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
            onClick={() => confirm(order.id, { onSuccess: onClose })}
            style={{ flex: 1, justifyContent: 'center' }}>
            {confirming ? 'Confirming…' : 'Confirm Order'}
          </button>
        )}
        {canCancel && (
          <button type="button" className="secondary-button" disabled={cancelling}
            onClick={() => cancel({ id: order.id, reason: 'Cancelled by user' }, { onSuccess: onClose })}
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
