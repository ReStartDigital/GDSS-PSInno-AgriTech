import { describe, it, expect } from 'vitest'
import { getApiErrorMessage, getDisplayError } from './errors'

describe('getApiErrorMessage', () => {
  it('returns null for null/undefined', () => {
    expect(getApiErrorMessage(null)).toBeNull()
    expect(getApiErrorMessage(undefined)).toBeNull()
  })

  it('returns the nested message from the backend error envelope', () => {
    const error = {
      response: {
        data: {
          error: { message: 'Phone number already registered.' },
        },
      },
    }
    expect(getApiErrorMessage(error)).toBe('Phone number already registered.')
  })

  it('returns null when the response shape is incomplete', () => {
    expect(getApiErrorMessage({ response: { data: {} } })).toBeNull()
    expect(getApiErrorMessage({ response: {} })).toBeNull()
    expect(getApiErrorMessage({})).toBeNull()
  })

  it('returns null for non-object errors like strings or numbers', () => {
    expect(getApiErrorMessage('network error')).toBeNull()
    expect(getApiErrorMessage(500)).toBeNull()
  })
})

describe('getDisplayError', () => {
  it('returns the API message when available', () => {
    const error = { response: { data: { error: { message: 'Invalid PIN.' } } } }
    expect(getDisplayError(error)).toBe('Invalid PIN.')
  })

  it('returns the custom fallback when no API message exists', () => {
    expect(getDisplayError({}, 'Custom fallback message')).toBe('Custom fallback message')
  })

  it('returns the default fallback when no arguments given beyond error', () => {
    expect(getDisplayError({})).toBe('Something went wrong. Please try again.')
  })
})
