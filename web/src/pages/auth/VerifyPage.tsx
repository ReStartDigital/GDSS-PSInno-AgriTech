import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { verifyOtpSchema, type VerifyOtpFormData } from '../../schemas'
import { useVerifyOtp } from '../../hooks/useAuth'
import { useAuthStore } from '../../store/auth.store'
import { Field } from '../../components/ui/Field'
import { ErrorAlert } from '../../components/ui/Feedback'
import { authApi } from '../../lib/apiCalls'
import { getDisplayError } from '../../lib/errors'
import { useState, useEffect } from 'react'

export default function VerifyPage() {
  const navigate = useNavigate()
  const pendingPhone = useAuthStore((s) => s.pendingPhone)
  const { mutate, isPending, error } = useVerifyOtp()
  const [resent, setResent] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<VerifyOtpFormData>({
    resolver: zodResolver(verifyOtpSchema),
  })

  useEffect(() => {
    if (!pendingPhone) {
      navigate('/auth/register')
    }
  }, [pendingPhone, navigate])

  if (!pendingPhone) {
    return null
  }

  const onSubmit = (data: VerifyOtpFormData) => {
    mutate({ phone: pendingPhone, otp: data.otp }, {
      onSuccess: () => navigate('/auth/set-pin'),
    })
  }

  const handleResend = async () => {
    setResendError(null)
    try {
      await authApi.resendOtp(pendingPhone)
      setResent(true)
      setTimeout(() => setResent(false), 30000)
    } catch (err) {
      setResendError(getDisplayError(err))
    }
  }

  const apiError = getDisplayError(error, '')

  return (
    <div className="page-stack">
      <section className="page-hero auth-hero">
        <div>
          <p className="eyebrow">Step 2 of 3</p>
          <h2>Verify your phone.</h2>
          <p>Enter the 6-digit code sent to <strong>{pendingPhone}</strong></p>
        </div>
      </section>

      <section className="panel-grid auth-grid">
        <div className="section-card accent-card">
          <div className="section-heading">
            <div><p className="eyebrow">OTP Verification</p><h3>Enter your code.</h3></div>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: 16 }}>
            <Field label="6-Digit Code" dark type="text" inputMode="numeric" maxLength={6} placeholder="123456" error={errors.otp} {...register('otp')} />
            {(apiError || resendError) && <ErrorAlert message={resendError ?? apiError} />}
            <button type="submit" className="primary-button" disabled={isPending} style={{ width: '100%', justifyContent: 'center' }}>
              {isPending ? 'Verifying…' : 'Verify Code'}
            </button>
            <button type="button" className="secondary-button" onClick={handleResend} disabled={resent} style={{ width: '100%', justifyContent: 'center' }}>
              {resent ? 'Code resent ✓' : 'Resend code'}
            </button>
          </form>
        </div>

        <div className="section-card">
          <div className="section-heading">
            <div><p className="eyebrow">Note</p><h3>Check your SMS.</h3></div>
          </div>
          <p>The code expires in 10 minutes. If you don't receive it, tap Resend after 60 seconds.</p>
          <div className="mini-badges" style={{ marginTop: 16 }}>
            <span>MTN</span><span>Telecel</span><span>AirtelTigo</span>
          </div>
        </div>
      </section>
    </div>
  )
}
