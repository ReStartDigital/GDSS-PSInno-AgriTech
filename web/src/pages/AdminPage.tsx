import { useState } from 'react'
import { PageHero } from '../components/ui/PageHero'
import { Modal } from '../components/ui/Modal'
import { ModalHeader } from '../components/ui/ModalHeader'

interface MockConflict {
  id: string
  orderId: string
  farmerName: string
  buyerName: string
  cropType: string
  amountGhs: number
  issue: string
  date: string
  status: 'pending' | 'resolved_refunded' | 'resolved_released' | 'investigating'
  details: string
}

interface MockListing {
  id: string
  farmerName: string
  cropType: string
  quantityKg: number
  pricePerKgGhs: number
  status: 'active' | 'flagged' | 'pending_approval'
  region: string
}

interface MockTransaction {
  id: string
  buyerName: string
  amountGhs: number
  paymentMethod: string
  status: 'success' | 'failed' | 'refunded'
  reference: string
  date: string
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'conflicts' | 'listings' | 'transactions' | 'users'>('dashboard')
  
  // Interactive mock state
  const [conflicts, setConflicts] = useState<MockConflict[]>([
    {
      id: 'CONF-001',
      orderId: 'ORD-894A',
      farmerName: 'Kofi Mensah',
      buyerName: 'Ama Serwaa',
      cropType: 'Cassava',
      amountGhs: 1200.00,
      issue: 'Produce quality discrepancy',
      date: '2026-07-08',
      status: 'pending',
      details: 'Buyer reports that the Cassava tubers received were smaller than listed and partially damaged during transport. Farmer claims they were in pristine condition when loaded.'
    },
    {
      id: 'CONF-002',
      orderId: 'ORD-302B',
      farmerName: 'Abena Osei',
      buyerName: 'Kwame Boateng',
      cropType: 'Yam',
      amountGhs: 3450.00,
      issue: 'OTP verification failure',
      date: '2026-07-07',
      status: 'investigating',
      details: 'Transporter claims delivery was completed successfully, but the buyer was unable to receive or verify the 6-digit OTP verification PIN due to connectivity issues.'
    },
    {
      id: 'CONF-003',
      orderId: 'ORD-122C',
      farmerName: 'Yaw Addo',
      buyerName: 'Esi Ansah',
      cropType: 'Tomatoes',
      amountGhs: 850.00,
      issue: 'Incorrect packaging size',
      date: '2026-07-09',
      status: 'pending',
      details: 'Buyer states that tomatoes were delivered in loose crates rather than the agreed recommended standard ventilated baskets, resulting in crushing.'
    }
  ])

  const [listings, setListings] = useState<MockListing[]>([
    { id: 'LIST-101', farmerName: 'Kofi Mensah', cropType: 'Plantain', quantityKg: 500, pricePerKgGhs: 12.50, status: 'active', region: 'Ashanti' },
    { id: 'LIST-102', farmerName: 'Yaa Konadu', cropType: 'Okra', quantityKg: 150, pricePerKgGhs: 8.00, status: 'pending_approval', region: 'Eastern' },
    { id: 'LIST-103', farmerName: 'Kwesi Appiah', cropType: 'Habanero Pepper', quantityKg: 80, pricePerKgGhs: 25.00, status: 'flagged', region: 'Brong Ahafo' },
    { id: 'LIST-104', farmerName: 'Ama Darko', cropType: 'Onions', quantityKg: 1200, pricePerKgGhs: 14.20, status: 'active', region: 'Greater Accra' }
  ])

  const [transactions] = useState<MockTransaction[]>([
    { id: 'TX-701', buyerName: 'Ama Serwaa', amountGhs: 1200.00, paymentMethod: 'Mobile Money', status: 'success', reference: 'pay_momo_8972', date: '2026-07-08' },
    { id: 'TX-702', buyerName: 'Kwame Boateng', amountGhs: 3450.00, paymentMethod: 'Card (Paystack)', status: 'success', reference: 'pay_card_9021', date: '2026-07-07' },
    { id: 'TX-703', buyerName: 'John Mahama', amountGhs: 450.00, paymentMethod: 'Mobile Money', status: 'failed', reference: 'pay_momo_0091', date: '2026-07-09' }
  ])

  const [selectedConflict, setSelectedConflict] = useState<MockConflict | null>(null)
  const [successNotification, setSuccessNotification] = useState<string | null>(null)

  const showToast = (message: string) => {
    setSuccessNotification(message)
    setTimeout(() => setSuccessNotification(null), 4000)
  }

  const handleConflictResolve = (conflictId: string, resolution: 'refund' | 'release' | 'investigate') => {
    setConflicts(prev => prev.map(c => {
      if (c.id === conflictId) {
        let newStatus: MockConflict['status'] = 'investigating'
        if (resolution === 'refund') newStatus = 'resolved_refunded'
        else if (resolution === 'release') newStatus = 'resolved_released'
        return { ...c, status: newStatus }
      }
      return c
    }))
    setSelectedConflict(null)
    const resText = resolution === 'refund' ? 'Refund disbursed to Buyer' : resolution === 'release' ? 'Funds released to Farmer' : 'Investigation status updated'
    showToast(`Conflict ${conflictId} resolved successfully: ${resText}`)
  }

  const handleListingModeration = (listingId: string, action: 'approve' | 'flag' | 'remove') => {
    setListings(prev => prev.map(l => {
      if (l.id === listingId) {
        return { ...l, status: action === 'approve' ? 'active' : 'flagged' }
      }
      return l
    }))
    showToast(`Listing ${listingId} updated: Status set to ${action === 'approve' ? 'Active' : 'Flagged'}`)
  }

  return (
    <div className="page-stack" style={{ position: 'relative' }}>
      <PageHero
        eyebrow="VegeLink Admin Operations"
        title="Admin Control Center"
        description="Monitor system transaction volume, manage platform conflicts, moderate listings, and view logs."
      />

      {/* Toast Notification */}
      {successNotification && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: '#264123', color: '#fff', padding: '16px 24px',
          borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', gap: 10,
          border: '1px solid rgba(214, 255, 205, 0.3)',
          animation: 'fadeSlideUp 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}>
          <span style={{ fontSize: '1.2rem' }}>🌿</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{successNotification}</span>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="filter-row" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <button
          className={`filter-chip ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
          style={{ padding: '12px', justifyContent: 'center' }}
        >
          📊 Dashboard
        </button>
        <button
          className={`filter-chip ${activeTab === 'conflicts' ? 'active' : ''}`}
          onClick={() => setActiveTab('conflicts')}
          style={{ padding: '12px', justifyContent: 'center' }}
        >
          ⚖️ Conflicts ({conflicts.filter(c => c.status === 'pending').length})
        </button>
        <button
          className={`filter-chip ${activeTab === 'listings' ? 'active' : ''}`}
          onClick={() => setActiveTab('listings')}
          style={{ padding: '12px', justifyContent: 'center' }}
        >
          🌾 Listings
        </button>
        <button
          className={`filter-chip ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
          style={{ padding: '12px', justifyContent: 'center' }}
        >
          💸 Transactions
        </button>
        <button
          className={`filter-chip ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
          style={{ padding: '12px', justifyContent: 'center' }}
        >
          👥 Platform Users
        </button>
      </div>

      {/* ── TAB CONTENT ────────────────────────────────────────────────────────── */}

      {activeTab === 'dashboard' && (
        <div style={{ display: 'grid', gap: 20 }}>
          {/* Key Metrics */}
          <div className="stats-grid">
            <div className="stat-card">
              <span>Gross Transaction Volume</span>
              <strong>GHS 128,450.00</strong>
            </div>
            <div className="stat-card">
              <span>Total Active Listings</span>
              <strong>348</strong>
            </div>
            <div className="stat-card">
              <span>Transporters Onboarded</span>
              <strong>42</strong>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #d97706' }}>
              <span>Pending Conflicts</span>
              <strong style={{ color: '#d97706' }}>
                {conflicts.filter(c => c.status === 'pending').length}
              </strong>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="two-column-card">
            <div className="section-card">
              <div className="section-heading">
                <h3>System Status Overview</h3>
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Payment Gateway (Paystack)</span>
                  <span style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: 700 }}>🟢 Operational</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>SMS Notification Gateway</span>
                  <span style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: 700 }}>🟢 Operational</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>PostGIS Geolocation Server</span>
                  <span style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: 700 }}>🟢 Connected (423 nodes)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Redis Cache Cluster</span>
                  <span style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: 700 }}>🟢 Active (0.2ms latency)</span>
                </div>
              </div>
            </div>

            <div className="section-card">
              <div className="section-heading">
                <h3>Escalated Platform Conflicts</h3>
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                {conflicts.map(conflict => (
                  <div key={conflict.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#fcfdfa', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280' }}>{conflict.id}</span>
                      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#264123' }}>{conflict.issue}</p>
                    </div>
                    <button
                      className="primary-button"
                      style={{ minHeight: 32, padding: '0 12px', fontSize: '0.75rem' }}
                      onClick={() => {
                        setSelectedConflict(conflict)
                        setActiveTab('conflicts')
                      }}
                    >
                      Inspect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'conflicts' && (
        <div className="section-card">
          <div className="section-heading">
            <h3>Discrepancy Resolution & Mediation Log</h3>
            <span className="section-note">Active Disputes</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#6b7280', fontSize: '0.8rem' }}>
                  <th style={{ padding: 12 }}>ID</th>
                  <th style={{ padding: 12 }}>Order</th>
                  <th style={{ padding: 12 }}>Dispute Issue</th>
                  <th style={{ padding: 12 }}>Involved Parties</th>
                  <th style={{ padding: 12 }}>Value</th>
                  <th style={{ padding: 12 }}>Status</th>
                  <th style={{ padding: 12 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {conflicts.map(conflict => {
                  const isPending = conflict.status === 'pending'
                  const isInvestigating = conflict.status === 'investigating'
                  const resolvedText = conflict.status === 'resolved_refunded' ? 'Refunded' : 'Released'
                  
                  return (
                    <tr key={conflict.id} style={{ borderBottom: '1px solid #e5e7eb', fontSize: '0.85rem' }}>
                      <td style={{ padding: 12, fontWeight: 700, color: '#6b7280' }}>{conflict.id}</td>
                      <td style={{ padding: 12, fontWeight: 600 }}>{conflict.orderId}</td>
                      <td style={{ padding: 12 }}>{conflict.issue}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{ fontWeight: 600 }}>Farmer:</span> {conflict.farmerName}<br />
                        <span style={{ fontWeight: 600 }}>Buyer:</span> {conflict.buyerName}
                      </td>
                      <td style={{ padding: 12, fontWeight: 700 }}>GHS {conflict.amountGhs.toFixed(2)}</td>
                      <td style={{ padding: 12 }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800,
                          background: isPending ? 'rgba(217,119,6,0.1)' : isInvestigating ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)',
                          color: isPending ? '#d97706' : isInvestigating ? '#2563eb' : '#059669'
                        }}>
                          {isPending ? 'PENDING' : isInvestigating ? 'INVESTIGATING' : `RESOLVED (${resolvedText})`}
                        </span>
                      </td>
                      <td style={{ padding: 12 }}>
                        <button
                          className="secondary-button"
                          style={{ minHeight: 32, padding: '0 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center' }}
                          onClick={() => setSelectedConflict(conflict)}
                        >
                          Resolve Panel
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'listings' && (
        <div className="section-card">
          <div className="section-heading">
            <h3>Crop Catalog Listing Moderation</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#6b7280', fontSize: '0.8rem' }}>
                  <th style={{ padding: 12 }}>Listing ID</th>
                  <th style={{ padding: 12 }}>Farmer</th>
                  <th style={{ padding: 12 }}>Produce Type</th>
                  <th style={{ padding: 12 }}>Quantity / Price</th>
                  <th style={{ padding: 12 }}>Region</th>
                  <th style={{ padding: 12 }}>Status</th>
                  <th style={{ padding: 12 }}>Moderate Action</th>
                </tr>
              </thead>
              <tbody>
                {listings.map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid #e5e7eb', fontSize: '0.85rem' }}>
                    <td style={{ padding: 12, fontWeight: 700, color: '#6b7280' }}>{l.id}</td>
                    <td style={{ padding: 12, fontWeight: 600 }}>{l.farmerName}</td>
                    <td style={{ padding: 12 }}>{l.cropType}</td>
                    <td style={{ padding: 12 }}>
                      {l.quantityKg} kg @ GHS {l.pricePerKgGhs.toFixed(2)}/kg
                    </td>
                    <td style={{ padding: 12 }}>{l.region} Region</td>
                    <td style={{ padding: 12 }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800,
                        background: l.status === 'active' ? 'rgba(16,185,129,0.1)' : l.status === 'flagged' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                        color: l.status === 'active' ? '#059669' : l.status === 'flagged' ? '#dc2626' : '#d97706'
                      }}>
                        {l.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 12, display: 'flex', gap: 6 }}>
                      {l.status !== 'active' && (
                        <button
                          className="primary-button"
                          style={{ minHeight: 32, padding: '0 12px', fontSize: '0.75rem', background: '#15803d' }}
                          onClick={() => handleListingModeration(l.id, 'approve')}
                        >
                          Approve
                        </button>
                      )}
                      {l.status !== 'flagged' && (
                        <button
                          className="secondary-button"
                          style={{ minHeight: 32, padding: '0 12px', fontSize: '0.75rem', borderColor: '#dc2626', color: '#dc2626' }}
                          onClick={() => handleListingModeration(l.id, 'flag')}
                        >
                          Flag/Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="section-card">
          <div className="section-heading">
            <h3>Paystack Gateway Transactions Ledger</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#6b7280', fontSize: '0.8rem' }}>
                  <th style={{ padding: 12 }}>TX ID</th>
                  <th style={{ padding: 12 }}>Buyer Name</th>
                  <th style={{ padding: 12 }}>Amount</th>
                  <th style={{ padding: 12 }}>Method</th>
                  <th style={{ padding: 12 }}>Reference</th>
                  <th style={{ padding: 12 }}>Date</th>
                  <th style={{ padding: 12 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #e5e7eb', fontSize: '0.85rem' }}>
                    <td style={{ padding: 12, fontWeight: 700, color: '#6b7280' }}>{t.id}</td>
                    <td style={{ padding: 12, fontWeight: 600 }}>{t.buyerName}</td>
                    <td style={{ padding: 12, fontWeight: 700 }}>GHS {t.amountGhs.toFixed(2)}</td>
                    <td style={{ padding: 12 }}>{t.paymentMethod}</td>
                    <td style={{ padding: 12, fontFamily: 'monospace' }}>{t.reference}</td>
                    <td style={{ padding: 12 }}>{t.date}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800,
                        background: t.status === 'success' ? 'rgba(16,185,129,0.1)' : t.status === 'failed' ? 'rgba(239,68,68,0.1)' : 'rgba(107,114,128,0.1)',
                        color: t.status === 'success' ? '#059669' : t.status === 'failed' ? '#dc2626' : '#374151'
                      }}>
                        {t.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="section-card">
          <div className="section-heading">
            <h3>Registered Platform Users (Accreditation & Auditing)</h3>
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, border: '1px solid #e5e7eb', borderRadius: 12, background: '#ffffff' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(38,65,35,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#264123' }}>KM</div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>Kofi Mensah</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>Role: Farmer · Region: Ashanti · Phone: +233 24 123 4567</p>
              </div>
              <span style={{ marginLeft: 'auto', background: 'rgba(16,185,129,0.1)', color: '#059669', fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', borderRadius: 20 }}>VERIFIED</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, border: '1px solid #e5e7eb', borderRadius: 12, background: '#ffffff' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(38,65,35,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#264123' }}>AS</div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>Ama Serwaa</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>Role: Buyer · Region: Greater Accra · Phone: +233 20 987 6543</p>
              </div>
              <span style={{ marginLeft: 'auto', background: 'rgba(16,185,129,0.1)', color: '#059669', fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', borderRadius: 20 }}>VERIFIED</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, border: '1px solid #e5e7eb', borderRadius: 12, background: '#ffffff' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(38,65,35,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#264123' }}>AO</div>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>Abena Osei</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#6b7280' }}>Role: Transporter · Region: Eastern · Phone: +233 27 654 3210</p>
              </div>
              <span style={{ marginLeft: 'auto', background: 'rgba(245,158,11,0.1)', color: '#d97706', fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', borderRadius: 20 }}>PENDING OTP CHECK</span>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFLICT DETAIL MEDIATION PANEL MODAL ────────────────────────────────────── */}

      {selectedConflict && (
        <Modal onClose={() => setSelectedConflict(null)}>
          <ModalHeader
            eyebrow="Conflict Resolution Panel"
            title="Resolve Conflict Dispute"
            onClose={() => setSelectedConflict(null)}
          />
          
          <div style={{ padding: '0 20px 20px 20px', display: 'grid', gap: 16 }}>
            <div style={{ padding: 16, background: '#fcfdfa', border: '1px solid #e5e7eb', borderRadius: 12 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6b7280' }}>
                DISPUTE ID: {selectedConflict.id} · ORDER: {selectedConflict.orderId}
              </span>
              <h3 style={{ margin: '8px 0 12px 0', color: '#264123' }}>{selectedConflict.issue}</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>{selectedConflict.details}</p>
            </div>

            <div className="two-column-card">
              <div style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
                <strong style={{ fontSize: '0.8rem', color: '#6b7280' }}>FARMER PARTY</strong>
                <p style={{ margin: '4px 0 0 0', fontWeight: 600, fontSize: '0.9rem' }}>{selectedConflict.farmerName}</p>
              </div>
              <div style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
                <strong style={{ fontSize: '0.8rem', color: '#6b7280' }}>BUYER PARTY</strong>
                <p style={{ margin: '4px 0 0 0', fontWeight: 600, fontSize: '0.9rem' }}>{selectedConflict.buyerName}</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>DISPUTED VALUE</span>
                <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#264123' }}>GHS {selectedConflict.amountGhs.toFixed(2)}</p>
              </div>
              
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="secondary-button"
                  style={{ minHeight: 40, fontSize: '0.8rem', borderColor: '#dc2626', color: '#dc2626' }}
                  onClick={() => handleConflictResolve(selectedConflict.id, 'refund')}
                >
                  Refund Buyer
                </button>
                <button
                  className="primary-button"
                  style={{ minHeight: 40, fontSize: '0.8rem', background: '#15803d' }}
                  onClick={() => handleConflictResolve(selectedConflict.id, 'release')}
                >
                  Release to Farmer
                </button>
                <button
                  className="secondary-button"
                  style={{ minHeight: 40, fontSize: '0.8rem' }}
                  onClick={() => handleConflictResolve(selectedConflict.id, 'investigate')}
                >
                  Set Investigating
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
