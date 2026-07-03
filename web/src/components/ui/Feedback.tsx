export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid rgba(38,65,35,0.15)',
        borderTopColor: '#264123',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div style={{
      padding: '12px 16px', borderRadius: 16,
      background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
      color: '#dc2626', fontSize: '0.9rem',
    }}>
      {message}
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      padding: 40, textAlign: 'center', color: '#6b7280',
      background: 'rgba(255,255,255,0.6)', borderRadius: 24,
      border: '1px dashed rgba(38,65,35,0.2)',
    }}>
      {message}
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    active: { bg: 'rgba(214,255,205,0.8)', color: '#264123' },
    live: { bg: 'rgba(214,255,205,0.8)', color: '#264123' },
    pending: { bg: 'rgba(251,191,36,0.2)', color: '#92400e' },
    confirmed: { bg: 'rgba(59,130,246,0.15)', color: '#1e40af' },
    in_transit: { bg: 'rgba(139,92,246,0.15)', color: '#5b21b6' },
    delivered: { bg: 'rgba(214,255,205,0.8)', color: '#264123' },
    cancelled: { bg: 'rgba(220,38,38,0.1)', color: '#dc2626' },
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
