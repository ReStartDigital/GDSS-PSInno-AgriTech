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
      <span className={`form-field-label ${dark ? 'dark' : ''}`}>
        {label}
      </span>
      <input
        {...props}
        className={`form-input ${dark ? 'dark' : ''} ${error ? 'error' : ''}`}
      />
      {error && (
        <span className={`form-field-error ${dark ? 'dark' : ''}`}>
          {error.message}
        </span>
      )}
    </div>
  )
}
