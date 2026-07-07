import { Icon } from '../components/Icon'
import { authSteps, type PageKey } from '../content'

export default function AuthPage({ navigate }: { navigate: (page: PageKey) => void }) {
  return (
    <div className="page-stack">
      <section className="page-hero auth-hero">
        <div>
          <p className="eyebrow">Authentication</p>
          <h2>Phone-first onboarding that matches the backend flow.</h2>
          <p>
            Register, verify OTP, set PIN, then login with the same cookie-backed session
            model used by the backend.
          </p>
        </div>

        <button type="button" className="primary-button" onClick={() => navigate('home')}>
          Back to overview
        </button>
      </section>

      <section className="panel-grid auth-grid">
        <div className="section-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Flow</p>
              <h3>Four-step registration sequence.</h3>
            </div>
          </div>

          <div className="workflow-list">
            {authSteps.map((step, index) => (
              <div className="workflow-step" key={step.title}>
                <div className="step-index">0{index + 1}</div>
                <div>
                  <h4>{step.title}</h4>
                  <p>{step.detail}</p>
                  <button type="button" className="inline-button">
                    {step.action}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="section-card accent-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Session</p>
              <h3>Secure by default.</h3>
            </div>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Phone number</span>
              <input type="tel" placeholder="+233 24 000 0000" />
            </label>
            <label className="field">
              <span>Role</span>
              <input type="text" placeholder="Farmer, buyer, transporter, agent" />
            </label>
            <label className="field">
              <span>OTP</span>
              <input type="text" placeholder="123456" />
            </label>
            <label className="field">
              <span>PIN</span>
              <input type="password" placeholder="••••" />
            </label>
          </div>

          <div className="status-row">
            <span className="status-pill">SMS verification</span>
          </div>

          <button type="button" className="secondary-button auth-button" onClick={() => navigate('profile')}>
            Enter app
          </button>
        </div>
      </section>

      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Backend contract</p>
            <h3>Mirrors the defined auth endpoints.</h3>
          </div>
        </div>

        <div className="endpoint-list">
          {['/api/v1/auth/register', '/api/v1/auth/verify-otp', '/api/v1/auth/set-pin', '/api/v1/auth/login', '/api/v1/auth/refresh', '/api/v1/auth/logout'].map((endpoint) => (
            <div className="endpoint-row" key={endpoint}>
              <Icon name="phone" />
              <span>{endpoint}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}