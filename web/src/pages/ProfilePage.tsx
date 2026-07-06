import { useAuthStore } from '../store/auth.store'
import { useLogout } from '../hooks/useAuth'
import { Icon } from '../components/Icon'
import { Link } from 'react-router-dom'

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const { mutate: logout, isPending } = useLogout()

  const initials = user?.phone?.slice(-4) ?? 'VG'

  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Profile</p>
          <h2>Your account and session.</h2>
          <p>Manage your identity, role, and security settings.</p>
        </div>
        <Link to="/" className="secondary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 18px' }}>
          Back home
        </Link>
      </section>

      <section className="panel-grid profile-grid">
        <div className="section-card">
          <div className="profile-header">
            <div className="avatar avatar-large" aria-hidden="true">{initials}</div>
            <div>
              <p className="eyebrow">{user?.role ?? 'Guest'} account</p>
              <h3 style={{ margin: '4px 0' }}>{user?.phone ?? 'Not logged in'}</h3>
              <p style={{ margin: 0, color: '#6b7280' }}>VegeLink Ghana member</p>
            </div>
          </div>

          <div className="detail-grid profile-summary" style={{ marginTop: 20 }}>
            {[
              { label: 'Role', value: user?.role ?? '—' },
              { label: 'Phone', value: user?.phone ?? '—' },
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
