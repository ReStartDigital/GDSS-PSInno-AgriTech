import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi, usersApi } from '../lib/apiCalls'
import { useAuthStore } from '../store/auth.store'
import type { RegisterFormData, LoginFormData } from '../schemas'

/**
 * POST /auth/register
 * Sends name/phone/role. On success caller navigates to /auth/verify.
 * region + language are saved via PATCH /users/me after set-pin completes.
 */
export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterFormData) => authApi.register(data),
  })
}

/**
 * POST /auth/verify-otp
 * On success stores the short-lived registration token and pending phone
 * in Zustand so set-pin page can read them.
 * Backend response: { success, data: { message, registration_token } }
 */
export function useVerifyOtp() {
  const setRegistrationToken = useAuthStore((s) => s.setRegistrationToken)
  return useMutation({
    mutationFn: ({ phone, otp }: { phone: string; otp: string }) =>
      authApi.verifyOtp(phone, otp),
    onSuccess: (res, vars) => {
      setRegistrationToken(res.data.data.registration_token, vars.phone)
    },
  })
}

/**
 * POST /auth/set-pin
 * After setting the PIN, immediately patches /users/me with region + language
 * that were collected during registration so they are persisted.
 * Backend response: { success, data: { user, accessToken, refreshToken } }
 */
export function useSetPin() {
  const { setAuth, registrationToken, pendingPhone } = useAuthStore()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: async ({
      pin,
      region,
      language,
    }: {
      pin: string
      region?: string
      language?: string
    }) => {
      // Step 1: finalise registration with PIN
      const setPinRes = await authApi.setPin(pin, registrationToken!)
      const { accessToken } = setPinRes.data.data

      // Step 2: persist region + language if provided (non-blocking — ignore errors)
      if ((region || language) && accessToken) {
        try {
          // Temporarily set token for the profile request
          useAuthStore.getState().setAccessToken(accessToken)
          await usersApi.updateProfile({ region, language })
        } catch {
          // Profile update failure should not block login
        }
      }

      return setPinRes
    },
    onSuccess: async (res) => {
      const { user: responseUser, accessToken } = res.data.data
      
      // Temporarily set token to fetch the profile
      useAuthStore.getState().setAccessToken(accessToken)
      
      let fullName = ''
      let region: string | undefined = undefined
      let language: string | undefined = undefined
      
      let paymentDetailsSet: boolean | undefined = undefined
      let mobileMoneyNumber: string | null = null
      let mobileMoneyNetwork: string | null = null

      try {
        const profileRes = await usersApi.getProfile()
        const dbUser = profileRes.data.data.user
        fullName = [dbUser.firstName, dbUser.middleName, dbUser.lastName]
          .filter(Boolean)
          .join(' ')
        region = dbUser.region ?? undefined
        language = dbUser.language ?? undefined
        paymentDetailsSet = dbUser.paymentDetailsSet
        mobileMoneyNumber = dbUser.mobileMoneyNumber
        mobileMoneyNetwork = dbUser.mobileMoneyNetwork
      } catch {
        // Fallback if profile fetch fails
      }
      
      setAuth(
        {
          id: responseUser.id,
          phone: pendingPhone ?? responseUser.phone,
          role: responseUser.role,
          fullName: fullName || undefined,
          region,
          language,
          paymentDetailsSet,
          mobileMoneyNumber,
          mobileMoneyNetwork,
        },
        accessToken,
      )
      navigate('/overview')
    },
  })
}

/**
 * POST /auth/login
 * Backend response: { success, data: { user, accessToken, refreshToken } }
 */
export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (data: LoginFormData) => authApi.login(data),
    onSuccess: async (res) => {
      const { user: responseUser, accessToken } = res.data.data
      
      // Temporarily set token to fetch the profile
      useAuthStore.getState().setAccessToken(accessToken)
      
      let fullName = ''
      let region: string | undefined = undefined
      let language: string | undefined = undefined
      
      let paymentDetailsSet: boolean | undefined = undefined
      let mobileMoneyNumber: string | null = null
      let mobileMoneyNetwork: string | null = null

      try {
        const profileRes = await usersApi.getProfile()
        const dbUser = profileRes.data.data.user
        fullName = [dbUser.firstName, dbUser.middleName, dbUser.lastName]
          .filter(Boolean)
          .join(' ')
        region = dbUser.region ?? undefined
        language = dbUser.language ?? undefined
        paymentDetailsSet = dbUser.paymentDetailsSet
        mobileMoneyNumber = dbUser.mobileMoneyNumber
        mobileMoneyNetwork = dbUser.mobileMoneyNetwork
      } catch {
        // Fallback
      }
      
      setAuth(
        {
          id: responseUser.id,
          phone: responseUser.phone,
          role: responseUser.role,
          fullName: fullName || undefined,
          region,
          language,
          paymentDetailsSet,
          mobileMoneyNumber,
          mobileMoneyNetwork,
        },
        accessToken,
      )
      navigate('/overview')
    },
  })
}

/**
 * POST /auth/logout
 * Clears auth state regardless of API outcome (onSettled).
 */
export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const navigate = useNavigate()
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearAuth()
      navigate('/auth/login')
    },
  })
}

/**
 * POST /users/me/payment-details
 * Configures the user's mobile money payment settings.
 */
export function useUpdatePaymentDetails() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { mobile_number: string; mobile_network: string }) =>
      usersApi.updatePaymentDetails(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      qc.invalidateQueries({ queryKey: ['users', 'me'] })
    },
  })
}
