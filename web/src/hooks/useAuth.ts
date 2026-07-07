import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../lib/apiCalls'
import { useAuthStore } from '../store/auth.store'
import type { RegisterFormData, LoginFormData } from '../schemas'

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterFormData) => authApi.register(data),
  })
}

export function useVerifyOtp() {
  const setRegistrationToken = useAuthStore((s) => s.setRegistrationToken)
  return useMutation({
    mutationFn: ({ phone, otp }: { phone: string; otp: string }) => authApi.verifyOtp(phone, otp),
    onSuccess: (res, vars) => {
      setRegistrationToken(res.data.data.registration_token, vars.phone)
    },
  })
}

export function useSetPin() {
  const { setAuth, registrationToken, pendingPhone } = useAuthStore()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (pin: string) => authApi.setPin(pin, registrationToken!),
    onSuccess: (res) => {
      const { user, accessToken } = res.data.data
      setAuth({ id: user.id, phone: pendingPhone ?? user.phone, role: user.role, fullName: user.fullName, region: user.region, language: user.language }, accessToken)
      navigate('/')
    },
  })
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (data: LoginFormData) => authApi.login(data),
    onSuccess: (res) => {
      const { user, accessToken } = res.data.data
      setAuth({ id: user.id, phone: user.phone, role: user.role, fullName: user.fullName, region: user.region, language: user.language }, accessToken)
      navigate('/')
    },
  })
}

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
