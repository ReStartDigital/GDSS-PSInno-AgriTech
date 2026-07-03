import { Icon } from '../components/Icon'
import { profileSummary, type PageKey } from '../content'

export default function ProfilePage({ navigate }: { navigate: (page: PageKey) => void }) {
  return (
    <div className="page-stack">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Profile</p>
          <h2>Simple identity, session, and support controls.</h2>
          <p>
            The profile page stays practical: show the user role, the live session state,
            and a clean logout action.
          </p>
        </div>
        <button type="button" className="primary-button" onClick={() => navigate('home')}>
          Back home
        </button>
      </section>

      <section className="panel-grid profile-grid">
        <div className="section-card">
          <div className="profile-header">
            <div className="avatar avatar-large" aria-hidden="true">
              VG
            </div>
            <div>
              <p className="eyebrow">Farmer account</p>
              <h3>Abena Mensah</h3>
              <p>Trusted seller on the Greater Accra vegetable belt.</p>
            </div>
          </div>

          <div className="detail-grid profile-summary">
            {profileSummary.map((item) => (
              <div className="detail-card" key={item.label}>
                <strong>{item.label}</strong>
                <p>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Support</p>
              <h3>Account tools.</h3>
            </div>
          </div>
          <div className="quick-links">
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

          <button type="button" className="secondary-button auth-button logout-button">
            Logout
          </button>
        </div>
      </section>
    </div>
  )
}