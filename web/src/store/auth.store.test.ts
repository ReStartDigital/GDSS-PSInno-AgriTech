import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './auth.store'

// Reset Zustand store state between tests
beforeEach(() => {
  useAuthStore.setState({
    user: null,
    accessToken: null,
    registrationToken: null,
    pendingPhone: null,
    isAuthenticated: false,
  })
})

describe('useAuthStore', () => {
  describe('setAuth', () => {
    it('sets user, accessToken, and isAuthenticated', () => {
      const user = { id: 'u1', phone: '0244123456', role: 'farmer' as const }
      useAuthStore.getState().setAuth(user, 'tok_abc')

      const state = useAuthStore.getState()
      expect(state.user).toEqual(user)
      expect(state.accessToken).toBe('tok_abc')
      expect(state.isAuthenticated).toBe(true)
    })

    it('clears registration token on successful auth', () => {
      useAuthStore.setState({ registrationToken: 'reg_123', pendingPhone: '0244123456' })
      useAuthStore.getState().setAuth({ id: 'u1', phone: '0244123456', role: 'buyer' }, 'tok_abc')

      const state = useAuthStore.getState()
      expect(state.registrationToken).toBeNull()
      expect(state.pendingPhone).toBeNull()
    })
  })

  describe('setRegistrationToken', () => {
    it('stores the registration token and pending phone', () => {
      useAuthStore.getState().setRegistrationToken('reg_xyz', '0244999888')

      const state = useAuthStore.getState()
      expect(state.registrationToken).toBe('reg_xyz')
      expect(state.pendingPhone).toBe('0244999888')
    })
  })

  describe('clearRegistrationToken', () => {
    it('nulls out the registration token and pending phone', () => {
      useAuthStore.setState({ registrationToken: 'reg_xyz', pendingPhone: '0244999888' })
      useAuthStore.getState().clearRegistrationToken()

      const state = useAuthStore.getState()
      expect(state.registrationToken).toBeNull()
      expect(state.pendingPhone).toBeNull()
    })
  })

  describe('clearAuth', () => {
    it('resets all auth state to initial values', () => {
      useAuthStore.setState({
        user: { id: 'u1', phone: '0244123456', role: 'farmer' },
        accessToken: 'tok_abc',
        isAuthenticated: true,
        registrationToken: 'reg_xyz',
        pendingPhone: '0244123456',
      })

      useAuthStore.getState().clearAuth()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.accessToken).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.registrationToken).toBeNull()
      expect(state.pendingPhone).toBeNull()
    })
  })

  describe('setAccessToken', () => {
    it('updates only the access token', () => {
      const user = { id: 'u1', phone: '0244123456', role: 'farmer' as const }
      useAuthStore.setState({ user, accessToken: 'old_tok', isAuthenticated: true })
      useAuthStore.getState().setAccessToken('new_tok')

      const state = useAuthStore.getState()
      expect(state.accessToken).toBe('new_tok')
      expect(state.user).toEqual(user) // user unchanged
    })
  })
})
