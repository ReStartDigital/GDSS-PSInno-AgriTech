import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { loginSchema, type LoginFormData } from '../../schemas'
import { useLogin } from '../../hooks/useAuth'
import { Field } from '../../components/ui/Field'
import { ErrorAlert } from '../../components/ui/Feedback'

export default function LoginPage() {
  const { mutate, isPending, error } = useLogin()

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginFormData) => mutate(data)
  const apiError = error && (error as any).response?.data?.error?.message

  return (
    <div className="page-stack">
      <section className="page-hero auth-hero">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h2>Log in to VegeLink Ghana.</h2>
          <p>Enter your phone number and PIN to continue.</p>
        </div>
        <Link to="/auth/register" className="secondary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 18px' }}>
          Create account
        </Link>
      </section>

      <section className="panel-grid auth-grid">
        <div className="section-card accent-card">
          <div className="section-heading">
            <div><p className="eyebrow">Login</p><h3>Enter your credentials.</h3></div>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: 16 }}>
            <Field label="Phone Number" dark type="tel" placeholder="0244123456" error={errors.phone} {...register('phone')} />
            <Field label="PIN" dark type="password" inputMode="numeric" maxLength={6} placeholder="••••" error={errors.pin} {...register('pin')} />
            {apiError && <ErrorAlert message={apiError} />}
            <button type="submit" className="primary-button" disabled={isPending} style={{ width: '100%', justifyContent: 'center' }}>
              {isPending ? 'Logging in…' : 'Log In'}
            </button>
          </form>
          <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span className="status-pill">HttpOnly refresh cookie</span>
            <span className="status-pill">Role-gated navigation</span>
          </div>
        </div>

        <div className="section-card">
          <div className="section-heading">
            <div><p className="eyebrow">New here?</p><h3>Register in 3 steps.</h3></div>
          </div>
          <p>Phone number, OTP verification, then set a PIN. No email needed.</p>
          <div style={{ marginTop: 20 }}>
            <Link to="/auth/register" className="primary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 18px' }}>
              Get started
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
