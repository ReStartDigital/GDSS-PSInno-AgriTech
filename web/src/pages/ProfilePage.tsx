import { useAuthStore } from '../store/auth.store'
import { useLogout } from '../hooks/useAuth'
import { useMyOrders } from '../hooks/useOrders'
import { Icon } from '../components/Icon'
import { Link } from 'react-router-dom'

function getInitials(fullName?: string, phone?: string): string {
  if (fullName && fullName.trim()) {
    return fullName
      .trim()
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }
  return phone?.slice(-4) ?? 'VG'
}

const LANGUAGE_LABELS: Record<string, string> = {
  english: 'English',
  twi: 'Twi (Akan)',
  fante: 'Fante (Akan)',
  ga: 'Ga',
  ewe: 'Ewe',
  dagbani: 'Dagbani',
  frafra: 'Frafra (Gurenne)',
  dagaare: 'Dagaare',
  gonja: 'Gonja',
  mampruli: 'Mampruli',
  hausa: 'Hausa',
  nzema: 'Nzema',
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const { mutate: logout, isPending } = useLogout()
  const { data: orders } = useMyOrders()

  const initials = getInitials(user?.fullName, user?.phone)
  const displayName = user?.fullName ?? user?.phone ?? 'Guest'
  const orderCount = Array.isArray(orders) ? orders.length : 0
  const languageLabel = user?.language ? (LANGUAGE_LABELS[user.language] ?? user.language) : '—'

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Profile</p>
          <h2>Your account.</h2>
          <p>Manage your identity, role, and security settings.</p>
        </div>
        <Link to="/" className="secondary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 18px' }}>
          Back home
        </Link>
      </section>

      <section className="panel-grid profile-grid">
        {/* ── Identity card ── */}
        <div className="section-card">
          <div className="profile-header">
            <div className="avatar avatar-large" aria-hidden="true">{initials}</div>
            <div>
              <p className="eyebrow">{user?.role ?? 'Guest'} account</p>
              <h3 style={{ margin: '4px 0 2px' }}>{displayName}</h3>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '0.88rem' }}>{user?.phone ?? ''}</p>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            {[
              { label: 'Orders', value: String(orderCount) },
              { label: 'Rating', value: '4.8 ★' },
            ].map((s) => (
              <div key={s.label} style={{
                flex: 1, textAlign: 'center', padding: '12px 8px',
                background: 'rgba(214,255,205,0.25)', borderRadius: 12,
                border: '1px solid rgba(38,65,35,0.08)'
              }}>
                <strong style={{ display: 'block', fontSize: '1.25rem', color: '#264123' }}>{s.value}</strong>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Detail grid */}
          <div className="detail-grid profile-summary" style={{ marginTop: 20 }}>
            {[
              { label: 'Role', value: user?.role ?? '—' },
              { label: 'Phone', value: user?.phone ?? '—' },
              { label: 'Region', value: user?.region ?? '—' },
              { label: 'Language', value: languageLabel },
              { label: 'Verification', value: 'SMS verified' },
              { label: 'Session', value: user ? 'Active' : 'Not logged in' },
            ].map((item) => (
              <div key={item.label} className="detail-card">
                <strong>{item.label}</strong>
                <p style={{ textTransform: 'capitalize' }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Actions card ── */}
        <div className="section-card">
          <div className="section-heading">
            <div><p className="eyebrow">Account</p><h3>Tools and actions.</h3></div>
          </div>

          <div className="quick-links" style={{ marginBottom: 20 }}>
            <button type="button" className="quick-link">
              <Icon name="shield" /> Reset PIN
            </button>
            <button type="button" className="quick-link">
              <Icon name="phone" /> Verify phone
            </button>
            <button type="button" className="quick-link">
              <Icon name="map" /> Update location
            </button>
          </div>

          {user?.role === 'farmer' && (
            <div style={{ marginBottom: 16 }}>
              <Link to="/listings" className="quick-link" style={{ textDecoration: 'none', display: 'inline-flex', width: '100%', justifyContent: 'flex-start' }}>
                <Icon name="bag" /> My Listings
              </Link>
            </div>
          )}
          {user?.role === 'buyer' && (
            <div style={{ marginBottom: 16 }}>
              <Link to="/marketplace" className="quick-link" style={{ textDecoration: 'none', display: 'inline-flex', width: '100%', justifyContent: 'flex-start' }}>
                <Icon name="shopping" /> Marketplace
              </Link>
            </div>
          )}
          {user?.role === 'agent' && (
            <div style={{ marginBottom: 16 }}>
              <Link to="/clients" className="quick-link" style={{ textDecoration: 'none', display: 'inline-flex', width: '100%', justifyContent: 'flex-start' }}>
                <Icon name="user" /> My Clients
              </Link>
            </div>
          )}
          {user?.role === 'transporter' && (
            <div style={{ marginBottom: 16 }}>
              <Link to="/jobs" className="quick-link" style={{ textDecoration: 'none', display: 'inline-flex', width: '100%', justifyContent: 'flex-start' }}>
                <Icon name="truck" /> Transport Jobs
              </Link>
            </div>
          )}

          {user ? (
            <button type="button" className="secondary-button logout-button"
              onClick={() => logout()}
              disabled={isPending}
              style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)', width: '100%', justifyContent: 'center' }}>
              {isPending ? 'Logging out…' : 'Log Out'}
            </button>
          ) : (
            <Link to="/auth/login" className="primary-button" style={{ textDecoration: 'none', display: 'inline-flex', width: '100%', justifyContent: 'center', minHeight: 48 }}>
              Log In
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}
