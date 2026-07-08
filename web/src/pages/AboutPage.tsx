import { Icon } from '../components/Icon'

const ROLES = [
  { id: 'farmer',      label: 'Farmer',      icon: 'leaf'     as const, bg: 'rgba(214,255,205,0.35)', actions: ['List produce', 'Confirm orders via SMS', 'Receive MoMo payment'] },
  { id: 'buyer',       label: 'Buyer',       icon: 'shopping' as const, bg: 'rgba(214,255,205,0.2)',  actions: ['Browse marketplace', 'Place & pay orders', 'Track delivery live'] },
  { id: 'transporter', label: 'Transporter', icon: 'truck'    as const, bg: 'rgba(143,188,143,0.2)',  actions: ['View nearby jobs', 'Accept deliveries', 'Update live status'] },
  { id: 'agent',       label: 'Agent',       icon: 'user'     as const, bg: 'rgba(38,65,35,0.06)',   actions: ['Register farmers', 'Manage listings', 'Confirm orders on behalf'] },
]

export default function AboutPage() {
  return (
    <div className="page-stack">
      {/* ── Page Hero ── */}
      <section className="page-hero auth-hero">
        <div>
          <p className="eyebrow">About VegeLink</p>
          <h2>Connecting Ghana's Agriculture</h2>
          <p>VegeLink is a digital platform tailored for the unique challenges of the Kumasi Vegetable Belt, bridging the gap between local growers, buyers, and transporters.</p>
        </div>
      </section>

      {/* ── Who it Serves ── */}
      <section className="section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow" style={{ color: '#6b7280' }}>Platform Roles</p>
            <h3>Four key participants, one ecosystem.</h3>
          </div>
        </div>
        <p style={{ color: '#4b5563', lineHeight: 1.6, marginBottom: 24, fontSize: '0.95rem', maxWidth: 640 }}>
          Agriculture requires coordination. VegeLink streamlines operations by offering dedicated interfaces, notifications, and features optimized for each participant's workflow.
        </p>
        <div className="roles-grid">
          {ROLES.map((r) => (
            <div key={r.id} className="role-card" style={{ background: r.bg, borderColor: '#e5e7eb' }}>
              <div className="role-card-icon" style={{ background: '#264123' }}><Icon name={r.icon} /></div>
              <h4 style={{ color: '#264123', margin: '4px 0', fontFamily: 'Poppins, sans-serif', fontSize: '1rem', fontWeight: 600 }}>{r.label}</h4>
              <ul className="role-card-list">{r.actions.map((a) => <li key={a}>{a}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Coverage & Location ── */}
      <section className="section-card" style={{ background: 'rgba(214,255,205,0.15)', border: '1px solid rgba(38,65,35,0.08)' }}>
        <div className="section-heading">
          <div>
            <p className="eyebrow" style={{ color: '#264123' }}>Regional Coverage</p>
            <h3>The Kumasi Vegetable Belt</h3>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, alignItems: 'center' }}>
          <div>
            <p style={{ color: '#374151', lineHeight: 1.6, margin: '0 0 16px' }}>
              Our operations are currently concentrated in the fertile Ashanti region, supporting farmers in major market hubs and agricultural communities.
            </p>
            <h4 style={{ color: '#264123', margin: '0 0 8px', fontSize: '0.95rem', fontWeight: 700 }}>Active Service Nodes:</h4>
            <p style={{ margin: '0 0 20px', color: '#4b5563', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Kumasi Central · Ejisu · Asante Mampong · Offinso · Kwabre East · Bosomtwe District
            </p>
            <div className="mini-badges">
              <span style={{ background: 'rgba(38,65,35,0.08)', color: '#264123', border: '1px solid rgba(38,65,35,0.15)' }}>MTN MoMo</span>
              <span style={{ background: 'rgba(38,65,35,0.08)', color: '#264123', border: '1px solid rgba(38,65,35,0.15)' }}>Telecel Cash</span>
              <span style={{ background: 'rgba(38,65,35,0.08)', color: '#264123', border: '1px solid rgba(38,65,35,0.15)' }}>AirtelTigo Money</span>
            </div>
          </div>
          <div style={{ 
            background: 'rgba(38,65,35,0.04)', 
            borderRadius: 16, 
            padding: 30, 
            border: '1px dashed rgba(38,65,35,0.15)',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 12 }}>🇬🇭</span>
            <strong style={{ color: '#264123', display: 'block', fontSize: '1.05rem', marginBottom: 6 }}>PostGIS Enabled Logistics</strong>
            <p style={{ color: '#4b5563', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
              Automatic route optimization and proximity-based matching helps transporters identify the closest pickup points to reduce empty runs.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
