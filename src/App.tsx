import { useMemo, useState } from 'react'
import './App.css'

const roles = [
  {
    id: 'farmer',
    label: 'Farmer',
    summary: 'List produce, manage orders, and confirm supply on the ground.',
    accent: 'Fresh inventory',
  },
  {
    id: 'buyer',
    label: 'Buyer',
    summary: 'Browse the marketplace, place orders, and track delivery progress.',
    accent: 'Market access',
  },
  {
    id: 'transporter',
    label: 'Transporter',
    summary: 'Accept delivery jobs, view routes, and update live status.',
    accent: 'Live logistics',
  },
  {
    id: 'agent',
    label: 'Agent',
    summary: 'Support farmers, verify listings, and clear pending orders.',
    accent: 'Field operations',
  },
] as const

const workflows = [
  {
    title: 'Register',
    detail: 'Phone number, role, and location for field-ready onboarding.',
  },
  {
    title: 'Verify OTP',
    detail: 'SMS verification backed by the backend challenge flow.',
  },
  {
    title: 'Set PIN',
    detail: 'Short-lived registration token completes account activation.',
  },
  {
    title: 'Login',
    detail: 'Cookie-backed refresh session for returning users.',
  },
] as const

const platformStats = [
  { value: '4', label: 'roles supported' },
  { value: '7', label: 'core routes mirrored' },
  { value: '1', label: 'shared design system' },
]

function Icon({ name }: { name: 'leaf' | 'truck' | 'shopping' | 'shield' | 'phone' | 'spark' }) {
  const paths = {
    leaf: 'M6 16c7-1 12-6 14-14-8 0-14 6-14 14 0 5 3 8 8 8 8 0 14-6 14-14 0-5-3-8-8-8-3 0-6 1-8 4',
    truck:
      'M3 7h11v10H3zM14 10h4l3 3v4h-7zm2 7a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM6 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0z',
    shopping:
      'M4 6h2l1.5 9h10L20 9H8m1 12a1.5 1.5 0 1 0 0.01 0M16 21a1.5 1.5 0 1 0 0.01 0',
    shield: 'M12 3l7 3v6c0 5-3.5 9-7 11-3.5-2-7-6-7-11V6l7-3z',
    phone: 'M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm3 15h2',
    spark: 'M12 4l1.8 4.2L18 10l-4.2 1.8L12 16l-1.8-4.2L6 10l4.2-1.8L12 4z',
  }[name]

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={paths} />
    </svg>
  )
}

function App() {
  const [activeRole, setActiveRole] = useState<(typeof roles)[number]['id']>('farmer')

  const activeRoleContent = useMemo(
    () => roles.find((role) => role.id === activeRole) ?? roles[0],
    [activeRole],
  )

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="VegeLink primary navigation">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            <Icon name="leaf" />
          </div>
          <div>
            <p className="eyebrow">VegeLink Ghana</p>
            <h1>Fresh trade, built for the field.</h1>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Platform sections">
          <a href="#overview">Overview</a>
          <a href="#roles">Roles</a>
          <a href="#workflow">Onboarding</a>
          <a href="#integrations">API flow</a>
        </nav>

        <div className="sidebar-panel">
          <p className="panel-label">Session model</p>
          <h2>Cookie-backed refresh flow</h2>
          <p>
            The web client mirrors the backend auth contract: register, verify OTP,
            set PIN, then login with a secure refresh cookie.
          </p>
          <div className="mini-badges">
            <span>OTP SMS</span>
            <span>HttpOnly cookie</span>
            <span>Role gating</span>
          </div>
        </div>
      </aside>

      <main className="content" id="overview">
        <header className="topbar">
          <div>
            <p className="eyebrow">Design system aligned</p>
            <h2>Web version guided by mobile and backend</h2>
          </div>

          <div className="topbar-actions" aria-label="Quick actions">
            <button type="button" className="icon-button" aria-label="Search platform data">
              <Icon name="spark" />
            </button>
            <button type="button" className="icon-button" aria-label="Notifications">
              <Icon name="shield" />
            </button>
            <div className="avatar" aria-hidden="true">
              VG
            </div>
          </div>
        </header>

        <section className="hero-grid">
          <div className="hero-card">
            <div className="hero-copy">
              <span className="status-pill">Forest Green / Poppins / Tailwind system</span>
              <h2>
                A clean web shell for farmers, buyers, transporters, and agents.
              </h2>
              <p>
                The interface follows the documented VegeLink Ghana system: warm,
                trustworthy, and operationally clear, with the same role model used by
                the mobile app.
              </p>

              <div className="hero-actions">
                <button type="button" className="primary-button">
                  Start registration
                </button>
                <button type="button" className="secondary-button">
                  Review flow
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
          </div>

          <div className="stats-grid" aria-label="Platform highlights">
            {platformStats.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="panel-grid" id="roles">
          <div className="section-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Role model</p>
                <h3>Same app, different paths.</h3>
              </div>
              <span className="section-note">Mirrors mobile tab gating</span>
            </div>

            <div className="role-selector" role="tablist" aria-label="Platform roles">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  role="tab"
                  aria-selected={activeRole === role.id}
                  className={activeRole === role.id ? 'role-chip active' : 'role-chip'}
                  onClick={() => setActiveRole(role.id)}
                >
                  {role.label}
                </button>
              ))}
            </div>

            <article className="role-detail" aria-live="polite">
              <div>
                <span className="status-pill subtle">{activeRoleContent.accent}</span>
                <h4>{activeRoleContent.label}</h4>
              </div>
              <p>{activeRoleContent.summary}</p>
            </article>
          </div>

          <div className="section-card" id="workflow">
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

        <section className="panel-grid bottom-grid" id="integrations">
          <div className="section-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">API contract</p>
                <h3>Auth endpoints already defined.</h3>
              </div>
            </div>

            <div className="endpoint-list" aria-label="Authentication endpoints">
              {['/api/v1/auth/register', '/api/v1/auth/verify-otp', '/api/v1/auth/set-pin', '/api/v1/auth/login', '/api/v1/auth/refresh', '/api/v1/auth/logout'].map((endpoint) => (
                <div className="endpoint-row" key={endpoint}>
                  <Icon name="phone" />
                  <span>{endpoint}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="section-card accent-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Design system</p>
                <h3>Forest green, soft neutrals, and practical spacing.</h3>
              </div>
            </div>

            <ul className="spec-list">
              <li><span>Primary</span><strong>#264123</strong></li>
              <li><span>Accent</span><strong>#D6FFCD</strong></li>
              <li><span>Body font</span><strong>Poppins</strong></li>
              <li><span>Radius</span><strong>Rounded XL / 2XL</strong></li>
            </ul>
          </div>
        </section>

        <nav className="mobile-nav" aria-label="Mobile shortcuts">
          <a href="#overview">
            <Icon name="leaf" />
            <span>Home</span>
          </a>
          <a href="#roles">
            <Icon name="shopping" />
            <span>Roles</span>
          </a>
          <a href="#workflow">
            <Icon name="truck" />
            <span>Flow</span>
          </a>
          <a href="#integrations">
            <Icon name="shield" />
            <span>API</span>
          </a>
        </nav>
      </main>
    </div>
  )
}

export default App
