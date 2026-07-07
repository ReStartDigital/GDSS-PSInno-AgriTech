interface ModalHeaderProps {
  eyebrow: string
  title: string
  subtitle?: React.ReactNode
  onClose: () => void
}

/**
 * Standard modal header: eyebrow label, bold title, optional subtitle, and × close button.
 * Replaces the duplicated header pattern in OrderDetail and OrderModal.
 */
export function ModalHeader({ eyebrow, title, subtitle, onClose }: ModalHeaderProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
      <div>
        <p style={{ color: '#6b7280', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
          {eyebrow}
        </p>
        <h3 style={{ margin: '4px 0', color: '#264123' }}>{title}</h3>
        {subtitle}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close modal"
        style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}
      >
        ×
      </button>
    </div>
  )
}
