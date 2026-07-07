interface ModalProps {
  children: React.ReactNode
  onClose: () => void
  maxWidth?: number
}

export function Modal({ children, onClose, maxWidth = 520 }: ModalProps) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: 24, padding: 28,
        width: '100%', maxWidth, maxHeight: '90vh', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  )
}
