const WORKFLOW = [
  { step: '01', title: 'Register & Verify',   detail: 'Onboard instantly using your phone number. No email or complex password required. Verification is completed via Arkesel SMS OTP.' },
  { step: '02', title: 'List or Browse',      detail: 'Farmers and representing agents publish produce listings, setting quantities, harvest dates, and AgriScore. Buyers browse real-time stock.' },
  { step: '03', title: 'Order & Confirm',     detail: 'Buyers select listings and specify order sizes. Farmers receive instant alerts and confirm orders directly in the app or via SMS responses.' },
  { step: '04', title: 'Matched Transport',   detail: 'Logistics routes are calculated using PostGIS spatial algorithms, notifying nearby registered transporters to claim shipping assignments.' },
  { step: '05', title: 'Secure Payment',      detail: 'Fulfillment and delivery trigger secure Mobile Money transactions powered by MTN MoMo, Telecel Cash, and AirtelTigo integration.' },
]

export default function HowItWorksPage() {
  return (
    <div className="page-stack">
      {/* ── Page Hero ── */}
      <section className="page-hero auth-hero">
        <div>
          <p className="eyebrow">Platform Flow</p>
          <h2>How VegeLink Works</h2>
          <p>VegeLink bridges post-harvest agricultural trade in Ghana using straightforward mobile-first workflows, SMS integration, and proximity logistics.</p>
        </div>
      </section>

      {/* ── Workflow Steps ── */}
      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow" style={{ color: '#6b7280' }}>Step-by-Step</p>
            <h3>The VegeLink Produce Journey</h3>
          </div>
        </div>
        <div className="workflow-list" style={{ marginTop: 10 }}>
          {WORKFLOW.map((w) => (
            <div className="workflow-step" key={w.step} style={{ padding: '24px 20px' }}>
              <div className="step-index" style={{ width: 44, height: 44, fontSize: '1.1rem' }}>{w.step}</div>
              <div>
                <h4 style={{ marginBottom: 6, fontSize: '1.05rem', color: '#264123' }}>{w.title}</h4>
                <p style={{ margin: 0, color: '#4b5563', fontSize: '0.9rem', lineHeight: 1.6 }}>{w.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Additional Tech Details ── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        <div className="section-card">
          <h4 style={{ color: '#264123', fontSize: '1rem', fontWeight: 700, margin: '0 0 10px' }}>📱 SMS-Gated Confirmation</h4>
          <p style={{ color: '#4b5563', fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>
            Because many farmers operate in areas with fluctuating internet access, critical actions—like order confirmations, delivery matches, and receipt confirmations—can be completed via standard SMS responses.
          </p>
        </div>
        <div className="section-card">
          <h4 style={{ color: '#264123', fontSize: '1rem', fontWeight: 700, margin: '0 0 10px' }}>🛡️ Verified AgriScore</h4>
          <p style={{ color: '#4b5563', fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>
            We calculate freshness ratings and crop grading (AgriScore) through a combination of harvest dates, storage parameters, and field agent assessments, ensuring high transparency and quality control.
          </p>
        </div>
      </section>
    </div>
  )
}
