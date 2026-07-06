import type { InputHTMLAttributes } from 'react'
import type { FieldError } from 'react-hook-form'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: FieldError
  dark?: boolean
}

export function Field({ label, error, dark, ...props }: FieldProps) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <span style={{
        color: dark ? 'rgba(248,250,245,0.86)' : '#374151',
        fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>
        {label}
      </span>
      <input
        {...props}
        style={{
          minHeight: 50, padding: '0 14px', borderRadius: 12,
          border: `1px solid ${error ? '#ef4444' : dark ? 'rgba(255,255,255,0.14)' : 'rgba(38,65,35,0.18)'}`,
          background: dark ? 'rgba(255,255,255,0.1)' : '#fff',
          color: dark ? '#f8faf5' : '#1f2937',
          fontSize: '1rem', width: '100%', boxSizing: 'border-box',
          outline: 'none',
        }}
      />
      {error && (
        <span style={{ color: dark ? '#fca5a5' : '#ef4444', fontSize: '0.78rem' }}>{error.message}</span>
      )}
    </div>
  )
}
