import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import { registerSchema, type RegisterFormData } from '../../schemas'
import { useRegister } from '../../hooks/useAuth'
import { useAuthStore } from '../../store/auth.store'
import { Field } from '../../components/ui/Field'
import { ErrorAlert } from '../../components/ui/Feedback'
import { getDisplayError } from '../../lib/errors'

const ROLES = [
  { value: 'farmer', label: 'Farmer', desc: 'List and sell produce' },
  { value: 'buyer', label: 'Buyer', desc: 'Browse and order produce' },
  { value: 'transporter', label: 'Transporter', desc: 'Deliver orders' },
  { value: 'agent', label: 'Agent', desc: 'Support farmers in the field' },
] as const

export const REGIONS = [
  { value: 'Greater Accra', label: 'Greater Accra', defaultLang: 'ga' },
  { value: 'Ashanti', label: 'Ashanti', defaultLang: 'twi' },
  { value: 'Eastern', label: 'Eastern', defaultLang: 'twi' },
  { value: 'Western', label: 'Western', defaultLang: 'fante' },
  { value: 'Volta', label: 'Volta', defaultLang: 'ewe' },
  { value: 'Central', label: 'Central', defaultLang: 'fante' },
  { value: 'Northern', label: 'Northern', defaultLang: 'dagbani' },
  { value: 'Bono', label: 'Bono', defaultLang: 'twi' },
  { value: 'Bono East', label: 'Bono East', defaultLang: 'twi' },
  { value: 'Ahafo', label: 'Ahafo', defaultLang: 'twi' },
  { value: 'Savannah', label: 'Savannah', defaultLang: 'gonja' },
  { value: 'North East', label: 'North East', defaultLang: 'mampruli' },
  { value: 'Oti', label: 'Oti', defaultLang: 'ewe' },
  { value: 'Western North', label: 'Western North', defaultLang: 'twi' },
  { value: 'Upper East', label: 'Upper East', defaultLang: 'frafra' },
  { value: 'Upper West', label: 'Upper West', defaultLang: 'dagaare' },
] as const

export const LANGUAGES = [
  { value: 'english', label: 'English' },
  { value: 'twi', label: 'Twi (Akan)' },
  { value: 'fante', label: 'Fante (Akan)' },
  { value: 'ga', label: 'Ga' },
  { value: 'ewe', label: 'Ewe' },
  { value: 'dagbani', label: 'Dagbani' },
  { value: 'frafra', label: 'Frafra (Gurenne)' },
  { value: 'dagaare', label: 'Dagaare' },
  { value: 'gonja', label: 'Gonja' },
  { value: 'mampruli', label: 'Mampruli' },
  { value: 'hausa', label: 'Hausa' },
  { value: 'nzema', label: 'Nzema' },
] as const

export default function RegisterPage() {
  const navigate = useNavigate()
  const { mutate, isPending, error } = useRegister()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const selectedRole = watch('role')
  const selectedRegion = watch('region')

  useEffect(() => {
    if (selectedRegion) {
      const regionObj = REGIONS.find(r => r.value === selectedRegion)
      if (regionObj) {
        setValue('language', regionObj.defaultLang, { shouldValidate: true })
      }
    }
  }, [selectedRegion, setValue])

  const onSubmit = (data: RegisterFormData) => {
    mutate(data, {
      onSuccess: () => {
        // Store phone for the OTP verify step
        useAuthStore.setState({ pendingPhone: data.phone })
        // Store region + language so SetPinPage can forward them to the backend
        // after the PIN is set (via PATCH /users/me)
        useAuthStore.setState((s) => ({
          user: s.user
            ? { ...s.user, region: data.region, language: data.language }
            : { id: '', phone: data.phone, role: 'farmer', region: data.region, language: data.language },
        }))
        navigate('/auth/verify')
      },
    })
  }

  const apiError = getDisplayError(error, '')

  return (
    <div className="page-stack">
      <section className="page-hero auth-hero">
        <div>
          <p className="eyebrow">Create Account</p>
          <h2>Join VegeLink Ghana.</h2>
          <p>Phone-only registration. No email required.</p>
        </div>
        <Link to="/auth/login" className="secondary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 18px' }}>
          Log in instead →
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
            <Field label="Phone Number" dark type="tel" placeholder="+233244123456" error={errors.phone} {...register('phone')} />

            <div className="form-grid">
              <div style={{ display: 'grid', gap: 6 }}>
                <span style={{ color: 'rgba(248,250,245,0.86)', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Region
                </span>
                <select
                  {...register('region')}
                  className="form-select dark"
                  style={errors.region ? { borderColor: '#ef4444' } : undefined}
                >
                  <option value="">Select Region</option>
                  {REGIONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                {errors.region && (
                  <span style={{ color: '#fca5a5', fontSize: '0.78rem' }}>{errors.region.message}</span>
                )}
              </div>

              <div style={{ display: 'grid', gap: 6 }}>
                <span style={{ color: 'rgba(248,250,245,0.86)', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Preferred Language
                </span>
                <select
                  {...register('language')}
                  className="form-select dark"
                  style={errors.language ? { borderColor: '#ef4444' } : undefined}
                >
                  <option value="">Select Language</option>
                  {LANGUAGES.map(l => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
                {errors.language && (
                  <span style={{ color: '#fca5a5', fontSize: '0.78rem' }}>{errors.language.message}</span>
                )}
              </div>
            </div>
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
