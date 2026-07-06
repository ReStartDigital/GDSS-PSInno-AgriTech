import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import { registerSchema, type RegisterFormData } from '../../schemas'
import { useRegister } from '../../hooks/useAuth'
import { useAuthStore } from '../../store/auth.store'
import { Field } from '../../components/ui/Field'
import { ErrorAlert } from '../../components/ui/Feedback'

const ROLES = [
  { value: 'farmer', label: 'Farmer', desc: 'List and sell produce' },
  { value: 'buyer', label: 'Buyer', desc: 'Browse and order produce' },
  { value: 'transporter', label: 'Transporter', desc: 'Deliver orders' },
  { value: 'agent', label: 'Agent', desc: 'Support farmers in the field' },
] as const

export default function RegisterPage() {
  const navigate = useNavigate()
  const { mutate, isPending, error } = useRegister()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const selectedRole = watch('role')

  const onSubmit = (data: RegisterFormData) => {
    mutate(data, {
      onSuccess: () => {
        useAuthStore.setState({ pendingPhone: data.phone })
        navigate('/auth/verify')
      },
    })
  }

  const apiError = error && (error as any).response?.data?.error?.message

  return (
    <div className="page-stack">
      <section className="page-hero auth-hero">
        <div>
          <p className="eyebrow">Create Account</p>
          <h2>Join VegeLink Ghana.</h2>
          <p>Phone-only registration. No email required.</p>
        </div>
        <Link to="/auth/login" className="secondary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 18px' }}>
          Already have an account
        </Link>
      </section>

      <section className="panel-grid auth-grid">
        <div className="section-card accent-card">
          <div className="section-heading">
            <div><p className="eyebrow">Step 1 of 3</p><h3>Your details</h3></div>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: 16 }}>
            <div className="form-grid">
              <Field label="First Name" dark placeholder="Abena" error={errors.firstName} {...register('firstName')} />
              <Field label="Last Name" dark placeholder="Mensah" error={errors.lastName} {...register('lastName')} />
            </div>
            <Field label="Phone Number" dark type="tel" placeholder="0244123456" error={errors.phone} {...register('phone')} />
            <div>
              <span style={{ color: 'rgba(248,250,245,0.86)', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Your Role</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {ROLES.map((r) => (
                  <button key={r.value} type="button"
                    onClick={() => setValue('role', r.value, { shouldValidate: true })}
                    style={{
                      padding: '12px 14px', borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                      border: `2px solid ${selectedRole === r.value ? '#d6ffcd' : 'rgba(255,255,255,0.14)'}`,
                      background: selectedRole === r.value ? 'rgba(214,255,205,0.18)' : 'rgba(255,255,255,0.06)',
                      color: '#f8faf5',
                    }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.label}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: 2 }}>{r.desc}</div>
                  </button>
                ))}
              </div>
              {errors.role && <span style={{ color: '#f87171', fontSize: '0.78rem', marginTop: 6, display: 'block' }}>{errors.role.message}</span>}
            </div>
            {apiError && <ErrorAlert message={apiError} />}
            <button type="submit" className="primary-button" disabled={isPending} style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}>
              {isPending ? 'Sending code…' : 'Send Verification Code'}
            </button>
          </form>
        </div>

        <div className="section-card">
          <div className="section-heading">
            <div><p className="eyebrow">How it works</p><h3>Three steps to get started.</h3></div>
          </div>
          <div className="workflow-list">
            {[
              { n: '01', t: 'Enter details', d: 'Phone number, name, and your role on the platform.' },
              { n: '02', t: 'Verify OTP', d: 'A 6-digit code is sent to your phone via SMS.' },
              { n: '03', t: 'Set your PIN', d: 'Choose a 4–6 digit PIN to log in going forward.' },
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
