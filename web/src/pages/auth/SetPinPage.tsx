import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { setPinSchema, type SetPinFormData } from '../../schemas'
import { useSetPin } from '../../hooks/useAuth'
import { useAuthStore } from '../../store/auth.store'
import { useNavigate } from 'react-router-dom'
import { Field } from '../../components/ui/Field'
import { ErrorAlert } from '../../components/ui/Feedback'

export default function SetPinPage() {
  const navigate = useNavigate()
  const registrationToken = useAuthStore((s) => s.registrationToken)
  const { mutate, isPending, error } = useSetPin()

  const { register, handleSubmit, formState: { errors } } = useForm<SetPinFormData>({
    resolver: zodResolver(setPinSchema),
  })

  if (!registrationToken) {
    navigate('/auth/register')
    return null
  }

  const onSubmit = (data: SetPinFormData) => {
    mutate(data.pin)
  }

  const apiError = error && (error as any).response?.data?.error?.message

  return (
    <div className="page-stack">
      <section className="page-hero auth-hero">
        <div>
          <p className="eyebrow">Step 3 of 3</p>
          <h2>Set your PIN.</h2>
          <p>Choose a 4–6 digit PIN. You'll use this to log in.</p>
        </div>
      </section>

      <section className="panel-grid auth-grid">
        <div className="section-card accent-card">
          <div className="section-heading">
            <div><p className="eyebrow">Credentials</p><h3>Create your PIN.</h3></div>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: 16 }}>
            <Field label="PIN" dark type="password" inputMode="numeric" maxLength={6} placeholder="••••" error={errors.pin} {...register('pin')} />
            <Field label="Confirm PIN" dark type="password" inputMode="numeric" maxLength={6} placeholder="••••" error={errors.confirmPin} {...register('confirmPin')} />
            {apiError && <ErrorAlert message={apiError} />}
            <button type="submit" className="primary-button" disabled={isPending} style={{ width: '100%', justifyContent: 'center' }}>
              {isPending ? 'Setting up account…' : 'Complete Registration'}
            </button>
          </form>
        </div>

        <div className="section-card">
          <div className="section-heading">
            <div><p className="eyebrow">Security</p><h3>Keep your PIN safe.</h3></div>
          </div>
          <div className="workflow-list">
            {[
              { n: '01', t: 'Digits only', d: '4 to 6 numeric digits.' },
              { n: '02', t: 'Never share it', d: 'VegeLink staff will never ask for your PIN.' },
              { n: '03', t: 'Reset anytime', d: 'Use your phone number to reset if forgotten.' },
            ].map((s) => (
              <div className="workflow-step" key={s.n}>
                <div className="step-index">{s.n}</div>
                <div><h4>{s.t}</h4><p>{s.d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
