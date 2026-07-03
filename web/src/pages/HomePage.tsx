import { Icon } from '../components/Icon'
import { platformStats, roles, workflows, type PageKey } from '../content'

export default function HomePage({ navigate }: { navigate: (page: PageKey) => void }) {
  return (
    <div className="page-stack">
      <section className="hero-card">
        <div className="hero-copy">
          <span className="status-pill">Forest Green / Poppins / Tailwind system</span>
          <h2>A clean web shell for farmers, buyers, transporters, and agents.</h2>
          <p>
            The web pages follow the documented VegeLink Ghana system: warm, trustworthy,
            and operationally clear, with the same role model used by the mobile app.
          </p>

          <div className="hero-actions">
            <button type="button" className="primary-button" onClick={() => navigate('auth')}>
              Start registration
            </button>
            <button type="button" className="secondary-button" onClick={() => navigate('marketplace')}>
              Open marketplace
            </button>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="device-card device-card-large">
            <div className="device-header">
              <span>Live marketplace</span>
              <span className="dot" />
            </div>
            <div className="metric-row">
              <strong>Fresh tomatoes</strong>
              <span>GH₵ 28 / crate</span>
            </div>
            <div className="visual-strip" />
          </div>
          <div className="device-card device-card-small">
            <span className="mini-title">Today&apos;s state</span>
            <strong>2 orders pending</strong>
            <p>One buyer, one transporter confirmation.</p>
          </div>
        </div>
      </section>

      <section className="stats-grid" aria-label="Platform highlights">
        {platformStats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>

      <section className="panel-grid">
        <div className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Role model</p>
              <h3>Same app, different paths.</h3>
            </div>
            <span className="section-note">Mirrors mobile tab gating</span>
          </div>

          <div className="role-selector" role="list" aria-label="Platform roles">
            {roles.map((role) => (
              <span className="role-chip" key={role.id}>
                {role.label}
              </span>
            ))}
          </div>

          <div className="two-column-card">
            {roles.map((role) => (
              <article className="mini-info-card" key={role.id}>
                <span className="status-pill subtle">{role.accent}</span>
                <h4>{role.label}</h4>
                <p>{role.summary}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Onboarding</p>
              <h3>Backend-backed flow.</h3>
            </div>
            <span className="section-note">Register → verify → set PIN → login</span>
          </div>

          <div className="workflow-list">
            {workflows.map((step, index) => (
              <div className="workflow-step" key={step.title}>
                <div className="step-index">0{index + 1}</div>
                <div>
                  <h4>{step.title}</h4>
                  <p>{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Guided routes</p>
            <h3>Jump into the main product pages.</h3>
          </div>
        </div>

        <div className="quick-links">
          <button type="button" className="quick-link" onClick={() => navigate('marketplace')}>
            <Icon name="shopping" /> Marketplace
          </button>
          <button type="button" className="quick-link" onClick={() => navigate('listings')}>
            <Icon name="bag" /> Listings
          </button>
          <button type="button" className="quick-link" onClick={() => navigate('orders')}>
            <Icon name="truck" /> Orders
          </button>
          <button type="button" className="quick-link" onClick={() => navigate('profile')}>
            <Icon name="user" /> Profile
          </button>
        </div>
      </section>
    </div>
  )
}