/**
 * Shared produce utilities — used by HomePage, MarketplacePage, ListingsPage.
 * Single source of truth for crop config, AgriRing, FreshnessBar, OrderModal.
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { placeOrderSchema, type PlaceOrderFormData } from '../schemas'
import type { Listing } from '../types/api'
import { getApiErrorMessage } from './errors'
import { usePlaceOrder } from '../hooks/useOrders'
import { Field } from '../components/ui/Field'
import { Modal } from '../components/ui/Modal'
import { FormActions } from '../components/ui/FormActions'
import { ErrorAlert } from '../components/ui/Feedback'

// ── Crop visual config ─────────────────────────────────────────────────────────

export const CROP_CONFIG: Record<string, { emoji: string; tint: string; accent: string }> = {
  tomatoes: { emoji: '🍅', tint: 'rgba(220,38,38,0.08)',   accent: '#DC2626' },
  pepper:   { emoji: '🌶️', tint: 'rgba(239,68,68,0.08)',   accent: '#EF4444' },
  onions:   { emoji: '🧅', tint: 'rgba(217,119,6,0.08)',   accent: '#D97706' },
  yam:      { emoji: '🥔', tint: 'rgba(180,83,9,0.08)',    accent: '#B45309' },
  okra:     { emoji: '🥦', tint: 'rgba(22,101,52,0.08)',   accent: '#166534' },
  cabbage:  { emoji: '🥬', tint: 'rgba(4,120,87,0.08)',    accent: '#047857' },
  default:  { emoji: '🌿', tint: 'rgba(38,65,35,0.06)',    accent: '#264123' },
}

export function getCropConfig(name: string) {
  const key = name.trim().toLowerCase()
  return CROP_CONFIG[key] ?? CROP_CONFIG.default
}

export const MARKET_PULSE = [
  { crop: 'Tomatoes', price: 'GH₵ 4.50/kg', change: '+8%', accent: '#DC2626', tint: 'rgba(220,38,38,0.08)' },
  { crop: 'Yam',      price: 'GH₵ 15/kg',   change: '+3%', accent: '#B45309', tint: 'rgba(180,83,9,0.08)' },
  { crop: 'Pepper',   price: 'GH₵ 6.00/kg', change: '-2%', accent: '#EF4444', tint: 'rgba(239,68,68,0.08)' },
  { crop: 'Onions',   price: 'GH₵ 3.50/kg', change: '+5%', accent: '#D97706', tint: 'rgba(217,119,6,0.08)' },
]

export const PRODUCE_FILTERS = ['All', 'Tomatoes', 'Pepper', 'Onions', 'Yam', 'Okra', 'Cabbage']

// ── AgriScore ring ─────────────────────────────────────────────────────────────

export function AgriRing({ score }: { score: number }) {
  const r = 13, sw = 3, circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 85 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ position: 'relative', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="34" height="34" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="17" cy="17" r={r} stroke="rgba(255,255,255,0.3)" strokeWidth={sw} fill="none" />
        <circle cx="17" cy="17" r={r} stroke={color} strokeWidth={sw} fill="none"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span style={{ position: 'absolute', fontSize: '0.6rem', fontWeight: 800, color }}>{score}</span>
    </div>
  )
}

// ── Freshness bar ──────────────────────────────────────────────────────────────

export function FreshnessBar({ freshness }: { freshness: 'High' | 'Medium' | 'Low' }) {
  const map = {
    High:   { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  fill: 100, label: 'High' },
    Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  fill: 60,  label: 'Medium' },
    Low:    { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   fill: 28,  label: 'Low' },
  }[freshness]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, borderRadius: 99, background: map.bg, overflow: 'hidden' }}>
        <div style={{ width: `${map.fill}%`, height: '100%', borderRadius: 99, background: map.color, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: map.color, whiteSpace: 'nowrap' }}>
        {map.label} freshness
      </span>
    </div>
  )
}

// ── Order Modal ────────────────────────────────────────────────────────────────

export function OrderModal({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const cfg = getCropConfig(listing.vegetableType)
  const { mutate, isPending, error, isSuccess } = usePlaceOrder(listing.id)
  const { register, handleSubmit, watch, formState: { errors } } = useForm<PlaceOrderFormData, unknown, PlaceOrderFormData>({
    resolver: zodResolver(placeOrderSchema) as never,
    defaultValues: { mode: 'delivery' },
  })
  const currentMode = watch('mode')
  const onSubmit = (data: PlaceOrderFormData) => mutate(data, { onSuccess: onClose })
  const apiError = getApiErrorMessage(error)

  const quantityStr = watch('quantity_kg')
  const quantity = parseFloat(String(quantityStr || '0'))
  const subtotal = quantity > 0 ? quantity * listing.pricePerKgGhs : 0
  const processingFee = subtotal * 0.015
  const deliveryDistance = 12
  const transportCost = currentMode === 'delivery' ? deliveryDistance * 2.00 : 0
  const totalGhs = subtotal + processingFee + transportCost

  return (
    <Modal onClose={onClose} maxWidth={480}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 20px 16px', borderBottom: '1px solid #f0f2f4' }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: cfg.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>
          {cfg.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9ca3af', fontWeight: 600 }}>Place Order</p>
          <h3 style={{ margin: '2px 0 0', color: '#264123', fontFamily: 'Poppins, sans-serif', fontSize: '1.15rem', fontWeight: 700 }}>{listing.vegetableType}</h3>
          <p style={{ margin: '2px 0 0', color: cfg.accent, fontWeight: 800, fontSize: '0.95rem' }}>GH₵ {listing.pricePerKgGhs}/kg</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.6rem',
            cursor: 'pointer',
            color: '#9ca3af',
            lineHeight: 1,
            padding: '4px 8px',
            transition: 'color 150ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#264123')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
        >
          ×
        </button>
      </div>

      <div style={{ padding: '20px' }}>
        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
            <h3 style={{ color: '#264123', margin: '0 0 6px', fontFamily: 'Poppins, sans-serif' }}>Order placed!</h3>
            <p style={{ color: '#6b7280', margin: 0 }}>You'll receive an update when the farmer confirms.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: 14 }}>
            <Field label="Quantity (kg)" type="number" min="1" placeholder="e.g. 50" error={errors.quantity_kg} {...register('quantity_kg')} />
            <Field label="Delivery Address" placeholder="e.g. Kumasi Central Market" error={errors.delivery_address} {...register('delivery_address')} />

            <div>
              <p style={{ margin: '0 0 10px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#374151', fontWeight: 600 }}>Fulfillment</p>
              <div style={{ display: 'flex', gap: 10 }}>
                {(['delivery', 'pickup'] as const).map((m) => {
                  const isSelected = currentMode === m
                  return (
                    <label
                      key={m}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px 14px',
                        border: `2px solid ${isSelected ? cfg.accent : '#e5e7eb'}`,
                        borderRadius: 12,
                        cursor: 'pointer',
                        background: isSelected ? cfg.tint : '#ffffff',
                        transition: 'border-color 150ms ease, background-color 150ms ease',
                      }}
                    >
                      <input type="radio" value={m} {...register('mode')} style={{ accentColor: cfg.accent }} />
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'capitalize', color: '#374151' }}>{m}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Real-time price breakdown panel */}
            <div style={{
              background: '#f8faf5',
              border: '1px solid rgba(38,65,35,0.08)',
              borderRadius: 12,
              padding: 14,
              display: 'grid',
              gap: 8,
              fontSize: '0.85rem',
              color: '#374151'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal ({quantity || 0} kg × GH₵ {listing.pricePerKgGhs})</span>
                <span style={{ fontWeight: 600 }}>GH₵ {subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
                <span>AgriSettle Split Fee (1.5%)</span>
                <span>GH₵ {processingFee.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
                <span>Logistics Fee ({currentMode === 'delivery' ? `${deliveryDistance} km` : 'Pickup'})</span>
                <span>GH₵ {transportCost.toFixed(2)}</span>
              </div>
              <div style={{ height: 1, background: '#e5e7eb', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 800, color: '#264123' }}>
                <span>Estimated Total</span>
                <span>GH₵ {totalGhs.toFixed(2)}</span>
              </div>
            </div>

            {/* Trade flow timeline */}
            <div style={{
              padding: 12,
              background: 'rgba(38,65,35,0.03)',
              borderRadius: 12,
              border: '1px solid rgba(38,65,35,0.05)',
            }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(38,65,35,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 10 }}>
                Trade Settlement Sequence
              </span>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                {[
                  { title: 'Checkout', active: true },
                  { title: 'Confirm', active: false },
                  { title: 'Logistics', active: false },
                  { title: 'Payout', active: false }
                ].map((step, idx) => (
                  <div key={idx} style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: step.active ? '#264123' : '#e5e7eb',
                      color: step.active ? '#fff' : '#9ca3af',
                      fontSize: '0.65rem', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 6px'
                    }}>
                      {idx + 1}
                    </div>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: step.active ? '#264123' : '#9ca3af', display: 'block' }}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {apiError && <ErrorAlert message={apiError} />}
            <FormActions onCancel={onClose} submitLabel="Confirm Order" pendingLabel="Placing…" isPending={isPending} />
          </form>
        )}
      </div>
    </Modal>
  )
}
