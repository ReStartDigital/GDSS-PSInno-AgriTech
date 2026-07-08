export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid rgba(38,65,35,0.15)',
        borderTopColor: '#264123',
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  )
}

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div style={{
      padding: '12px 16px', borderRadius: 12,
      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
      color: '#ef4444', fontSize: '0.9rem',
    }}>
      {message}
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      padding: 40, textAlign: 'center', color: '#6b7280',
      background: '#ffffff', borderRadius: 12,
      border: '1px dashed #e5e7eb',
    }}>
      {message}
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    active: { bg: 'rgba(214,255,205,0.8)', color: '#264123' },
    live: { bg: 'rgba(214,255,205,0.8)', color: '#264123' },
    pending: { bg: 'rgba(245,158,11,0.15)', color: '#92400e' },
    confirmed: { bg: 'rgba(214,255,205,0.6)', color: '#264123' },
    in_transit: { bg: 'rgba(143,188,143,0.25)', color: '#264123' },
    delivered: { bg: 'rgba(214,255,205,0.8)', color: '#264123' },
    cancelled: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
    sold: { bg: 'rgba(107,114,128,0.15)', color: '#374151' },
    draft: { bg: 'rgba(107,114,128,0.15)', color: '#374151' },
  }
  const c = colors[status.toLowerCase()] ?? { bg: 'rgba(214,255,205,0.5)', color: '#264123' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '4px 12px',
      borderRadius: 999, fontSize: '0.78rem', fontWeight: 600,
      background: c.bg, color: c.color, textTransform: 'capitalize',
    }}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}
