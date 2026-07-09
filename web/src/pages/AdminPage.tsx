import { useState, useEffect } from 'react'
import { Modal } from '../components/ui/Modal'
import { ModalHeader } from '../components/ui/ModalHeader'

// ── TYPES ────────────────────────────────────────────────────────────────────

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
  chatLog: { sender: 'farmer' | 'buyer'; message: string; time: string }[]
  evidence: {
    catalogReference: string
    buyerPhotoLabel: string
    discrepancyNotes: string
  }
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

interface AgentVerificationRequest {
  id: string
  agentName: string
  farmerName: string
  region: string
  vegetableType: string
  docsProvided: string[]
  status: 'pending' | 'approved' | 'rejected'
  date: string
}

interface AuditLogEntry {
  id: string
  timestamp: string
  actor: string
  action: string
  details: string
}

interface EscrowAccount {
  id: string
  orderId: string
  farmerName: string
  buyerName: string
  amountGhs: number
  status: 'held' | 'released' | 'disputed'
  dateDeposited: string
}

interface ActiveTruck {
  id: string
  driverName: string
  cargo: string
  weightKg: number
  route: string
  position: { lat: number; lng: number }
  speedKmh: number
  status: 'in_transit' | 'loading' | 'completed'
}

interface AgentPerformance {
  id: string
  agentName: string
  region: string
  farmersRegistered: number
  totalTradeVolumeGhs: number
  commissionEarnedGhs: number
  commissionPaid: boolean
}

interface CropPrice {
  crop: string
  ashantiPrice: number
  greaterAccraPrice: number
  easternPrice: number
  weeklyChange: string
  direction: 'up' | 'down'
}

// ── COMPONENT ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'conflicts' | 'listings' | 'verifications' | 'paystack' | 'performance' | 'audit'>('dashboard')

  // ── MOCK DATA STATES ───────────────────────────────────────────────────────
  
  const [conflicts, setConflicts] = useState<MockConflict[]>([
    {
      id: 'CONF-001',
      orderId: 'ORD-894A',
      farmerName: 'Kofi Mensah',
      buyerName: 'Ama Serwaa',
      cropType: 'Cassava',
      amountGhs: 1200.00,
      issue: 'Quality discrepancy',
      date: '2026-07-08',
      status: 'pending',
      details: 'Buyer reports that the Cassava tubers received were smaller than listed and partially damaged during transport. Farmer claims they were in pristine condition when loaded.',
      chatLog: [
        { sender: 'buyer', message: 'Hi Kofi, these cassava tubers are much smaller than the 500kg catalog sample. Some have rot.', time: '09:12 AM' },
        { sender: 'farmer', message: 'Hello Ama, I harvested those tubers myself yesterday. They were fresh and clean.', time: '09:20 AM' },
        { sender: 'buyer', message: 'Look at the pictures I sent. They are bruised. I want a refund of GHS 600.', time: '09:35 AM' },
        { sender: 'farmer', message: 'No, that is transport damage. Take it up with the driver!', time: '09:42 AM' }
      ],
      evidence: {
        catalogReference: 'Fresh Cassava Tubers: grade A thick tubers, length 30cm - 45cm, harvested dry soil.',
        buyerPhotoLabel: 'Delivered tubers: short root sizes (<15cm), severe skin cuts, mold spots on 25% of load.',
        discrepancyNotes: 'Inspection shows physical packaging failure allowing water log to rot roots during transit.'
      }
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
      details: 'Transporter claims delivery was completed successfully, but the buyer was unable to receive or verify the 6-digit OTP verification PIN due to connectivity issues.',
      chatLog: [
        { sender: 'farmer', message: 'Kwame, has the delivery truck arrived at your warehouse yet?', time: '02:00 PM' },
        { sender: 'buyer', message: 'Yes, it is here. But the network in the market is completely down. I cannot receive the OTP sms.', time: '02:15 PM' },
        { sender: 'farmer', message: 'The transporter cannot offload without entering the delivery code in the portal.', time: '02:30 PM' }
      ],
      evidence: {
        catalogReference: 'Pona Yams (1200kg): medium size yams, straw tied bundles.',
        buyerPhotoLabel: 'No physical product issues noted. Transporter location confirmed at coordinates via cell tower.',
        discrepancyNotes: 'Escrow release pending manual administrator verification of driver drop-off manifest.'
      }
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
      details: 'Buyer states that tomatoes were delivered in loose crates rather than the agreed recommended standard ventilated baskets, resulting in crushing.',
      chatLog: [
        { sender: 'buyer', message: 'Yaw, why were these packed loose? The weight pressed down and half the crates are soup.', time: '11:05 AM' },
        { sender: 'farmer', message: 'Esi, I ran out of ventilated baskets. The crates are sturdy enough usually.', time: '11:15 AM' }
      ],
      evidence: {
        catalogReference: 'Ventilated baskets standard size: 25kg crates stacked maximum 3 units high.',
        buyerPhotoLabel: 'Loose sack bundles piled 5 units high. Bottom layers completely crushed with pulp leakage.',
        discrepancyNotes: 'Transporter reported that loose stacking was authorized by farmer to fit truck volume.'
      }
    }
  ])

  const [listings, setListings] = useState<MockListing[]>([
    { id: 'LIST-101', farmerName: 'Kofi Mensah', cropType: 'Plantain', quantityKg: 500, pricePerKgGhs: 12.50, status: 'active', region: 'Ashanti' },
    { id: 'LIST-102', farmerName: 'Yaa Konadu', cropType: 'Okra', quantityKg: 150, pricePerKgGhs: 8.00, status: 'pending_approval', region: 'Eastern' },
    { id: 'LIST-103', farmerName: 'Kwesi Appiah', cropType: 'Habanero Pepper', quantityKg: 80, pricePerKgGhs: 25.00, status: 'flagged', region: 'Brong Ahafo' },
    { id: 'LIST-104', farmerName: 'Ama Darko', cropType: 'Onions', quantityKg: 1200, pricePerKgGhs: 14.20, status: 'active', region: 'Greater Accra' }
  ])

  const [transactions, setTransactions] = useState<MockTransaction[]>([
    { id: 'TX-701', buyerName: 'Ama Serwaa', amountGhs: 1200.00, paymentMethod: 'Mobile Money', status: 'success', reference: 'pay_momo_8972', date: '2026-07-08' },
    { id: 'TX-702', buyerName: 'Kwame Boateng', amountGhs: 3450.00, paymentMethod: 'Card (Paystack)', status: 'success', reference: 'pay_card_9021', date: '2026-07-07' },
    { id: 'TX-703', buyerName: 'John Mahama', amountGhs: 450.00, paymentMethod: 'Mobile Money', status: 'failed', reference: 'pay_momo_0091', date: '2026-07-09' }
  ])

  const [verifications, setVerifications] = useState<AgentVerificationRequest[]>([
    {
      id: 'VER-001',
      agentName: 'Emmanuel Ofori',
      farmerName: 'Kwadwo Appiah',
      region: 'Western',
      vegetableType: 'Ginger',
      docsProvided: ['National ID Card', 'Farm Land Ownership Deed', 'Accreditation Photo'],
      status: 'pending',
      date: '2026-07-09'
    },
    {
      id: 'VER-002',
      agentName: 'Grace Mensah',
      farmerName: 'Rebecca Boateng',
      region: 'Central',
      vegetableType: 'Cabbage',
      docsProvided: ['Voter Card', 'Local Chief Reference Letter'],
      status: 'pending',
      date: '2026-07-08'
    }
  ])

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    { id: 'LOG-301', timestamp: '2026-07-09 09:15:33', actor: 'System Admin', action: 'Initialize Admin Panel', details: 'Sandbox environment loaded successfully.' }
  ])

  // 1. FLEET LOGISTICS STATE
  const [activeTrucks, setActiveTrucks] = useState<ActiveTruck[]>([
    { id: 'TRK-202', driverName: 'Emmanuel Badu', cargo: 'Cassava Roots', weightKg: 1200, route: 'Kumasi to Accra', position: { lat: 6.204, lng: -0.803 }, speedKmh: 65, status: 'in_transit' },
    { id: 'TRK-405', driverName: 'Robert Osei', cargo: 'Tomatoes', weightKg: 500, route: 'Techiman to Tema', position: { lat: 7.583, lng: -1.933 }, speedKmh: 72, status: 'in_transit' },
    { id: 'TRK-911', driverName: 'Kojo Antwi', cargo: 'Yam straw bundles', weightKg: 3000, route: 'Tamale to Kumasi', position: { lat: 9.400, lng: -0.839 }, speedKmh: 0, status: 'loading' }
  ])

  // 2. CROP PRICE INDEX STATE
  const [cropPrices] = useState<CropPrice[]>([
    { crop: 'Cassava Tubers', ashantiPrice: 12.00, greaterAccraPrice: 15.50, easternPrice: 11.20, weeklyChange: '+3.4%', direction: 'up' },
    { crop: 'Tomatoes', ashantiPrice: 28.50, greaterAccraPrice: 34.00, easternPrice: 26.80, weeklyChange: '-4.8%', direction: 'down' },
    { crop: 'Okra', ashantiPrice: 8.50, greaterAccraPrice: 10.20, easternPrice: 8.00, weeklyChange: '+1.2%', direction: 'up' },
    { crop: 'Pona Yam', ashantiPrice: 22.00, greaterAccraPrice: 27.50, easternPrice: 20.00, weeklyChange: '+5.6%', direction: 'up' }
  ])

  // 3. MARKETPLACE ESCROW LEDGER STATE
  const [escrowAccounts, setEscrowAccounts] = useState<EscrowAccount[]>([
    { id: 'ESC-701', orderId: 'ORD-894A', farmerName: 'Kofi Mensah', buyerName: 'Ama Serwaa', amountGhs: 1200.00, status: 'held', dateDeposited: '2026-07-08' },
    { id: 'ESC-702', orderId: 'ORD-302B', farmerName: 'Abena Osei', buyerName: 'Kwame Boateng', amountGhs: 3450.00, status: 'disputed', dateDeposited: '2026-07-07' },
    { id: 'ESC-703', orderId: 'ORD-991A', farmerName: 'Yaw Addo', buyerName: 'Esi Ansah', amountGhs: 850.00, status: 'held', dateDeposited: '2026-07-09' }
  ])

  // 4. AGENT COMMISSIONS LEDGER STATE
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([
    { id: 'AG-901', agentName: 'Emmanuel Ofori', region: 'Western', farmersRegistered: 14, totalTradeVolumeGhs: 24500, commissionEarnedGhs: 612.50, commissionPaid: false },
    { id: 'AG-902', agentName: 'Grace Mensah', region: 'Central', farmersRegistered: 9, totalTradeVolumeGhs: 11200, commissionEarnedGhs: 280.00, commissionPaid: false },
    { id: 'AG-903', agentName: 'Frank Appiah', region: 'Ashanti', farmersRegistered: 28, totalTradeVolumeGhs: 68000, commissionEarnedGhs: 1700.00, commissionPaid: true }
  ])

  // Paystack Settings
  const [paystackMode, setPaystackMode] = useState<'sandbox' | 'live'>('sandbox')
  const [webhookUrl] = useState('https://api.vegelink.gov.gh/v1/payments/webhook')

  // Performance metrics simulated state
  const [cpuUsage, setCpuUsage] = useState(24)
  const [memUsage] = useState(48)
  const [latency, setLatency] = useState(12)

  const [selectedConflict, setSelectedConflict] = useState<MockConflict | null>(null)
  const [successNotification, setSuccessNotification] = useState<string | null>(null)

  // Simulation timer for fleet updates
  useEffect(() => {
    const timer = setInterval(() => {
      setCpuUsage(Math.floor(18 + Math.random() * 15))
      setLatency(Math.floor(8 + Math.random() * 8))

      // Simulate slight driver coordinate updates
      setActiveTrucks(prev => prev.map(t => {
        if (t.status === 'in_transit') {
          return {
            ...t,
            position: {
              lat: t.position.lat + (Math.random() - 0.5) * 0.002,
              lng: t.position.lng + (Math.random() - 0.5) * 0.002
            },
            speedKmh: Math.floor(60 + Math.random() * 15)
          }
        }
        return t
      }))
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const showToast = (message: string) => {
    setSuccessNotification(message)
    setTimeout(() => setSuccessNotification(null), 4000)
  }

  const logAction = (action: string, details: string) => {
    const newEntry: AuditLogEntry = {
      id: `LOG-${Math.floor(300 + Math.random() * 700)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor: 'Admin Agent (You)',
      action,
      details
    }
    setAuditLogs(prev => [newEntry, ...prev])
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
    const resText = resolution === 'refund' ? 'Disbursed Refund to Buyer' : resolution === 'release' ? 'Funds Released to Farmer' : 'Marked Investigating'
    showToast(`Conflict ${conflictId} resolved: ${resText}`)
    logAction('Resolve Conflict', `ID: ${conflictId} - Action: ${resText}`)
  }

  const handleListingModeration = (listingId: string, action: 'approve' | 'flag') => {
    setListings(prev => prev.map(l => {
      if (l.id === listingId) {
        return { ...l, status: action === 'approve' ? 'active' : 'flagged' }
      }
      return l
    }))
    showToast(`Listing ${listingId} updated to ${action === 'approve' ? 'Active' : 'Flagged'}`)
    logAction('Moderate Listing', `ID: ${listingId} - Set to ${action === 'approve' ? 'Active' : 'Flagged'}`)
  }

  const handleVerifyAgentFarmer = (id: string, action: 'approve' | 'reject') => {
    setVerifications(prev => prev.map(v => {
      if (v.id === id) {
        return { ...v, status: action === 'approve' ? 'approved' : 'rejected' }
      }
      return v
    }))
    showToast(`Verification ${id} request has been ${action === 'approve' ? 'Approved' : 'Rejected'}`)
    logAction('Verify Farmer Registration', `Request ID: ${id} - Decision: ${action.toUpperCase()}`)
  }

  // FORCE ESCROW RELEASE INTERACTION
  const handleReleaseEscrow = (escrowId: string) => {
    setEscrowAccounts(prev => prev.map(e => {
      if (e.id === escrowId) {
        return { ...e, status: 'released' }
      }
      return e
    }))
    showToast(`Escrow Account ${escrowId} released successfully!`)
    logAction('Force Payout Release', `Escrow Account ID: ${escrowId} payout initiated manually by Administrator override.`)
  }

  // AGENT COMMISSION PAYOUT INTERACTION
  const handlePayAgentCommission = (agentId: string) => {
    setAgentPerformance(prev => prev.map(a => {
      if (a.id === agentId) {
        return { ...a, commissionPaid: true }
      }
      return a
    }))
    showToast(`Commission payout processed successfully!`)
    logAction('Payout Agent Commission', `Commission for Agent ID ${agentId} marked paid.`)
  }

  const triggerMockWebhook = () => {
    const mockRef = `pay_mock_${Math.floor(1000 + Math.random() * 9000)}`
    const mockAmount = Math.floor(150 + Math.random() * 1500)
    const newTx: MockTransaction = {
      id: `TX-${Math.floor(700 + Math.random() * 300)}`,
      buyerName: 'Ama Serwaa (Mock Webhook)',
      amountGhs: mockAmount,
      paymentMethod: 'Paystack Sandbox',
      status: 'success',
      reference: mockRef,
      date: new Date().toISOString().substring(0, 10)
    }
    setTransactions(prev => [newTx, ...prev])
    showToast(`Webhook Sent! Captured transaction ${mockRef} worth GHS ${mockAmount}`)
    logAction('Paystack Webhook Simulation', `Captured transaction ${mockRef} value GHS ${mockAmount}`)
  }

  return (
    <div className="admin-page-container">
      {/* Dynamic CSS styles injected specifically for this admin dashboard */}
      <style>{`
        .admin-page-container {
          display: grid;
          grid-template-columns: 240px 1fr;
          min-height: calc(100vh - 120px);
          gap: 20px;
          margin-top: 10px;
        }
        
        .admin-sidebar {
          background: #264123;
          border-radius: 16px;
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          color: #f8faf5;
          height: fit-content;
          box-shadow: 0 4px 12px rgba(38, 65, 35, 0.08);
        }

        .admin-sidebar-header {
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 12px;
        }

        .admin-sidebar-header h4 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #d6ffcd;
        }

        .admin-sidebar-header span {
          font-size: 0.65rem;
          opacity: 0.6;
        }

        .admin-sidebar-btn {
          background: none;
          border: none;
          color: rgba(248, 250, 245, 0.8);
          padding: 12px 16px;
          border-radius: 8px;
          text-align: left;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 150ms, color 150ms;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .admin-sidebar-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
        }

        .admin-sidebar-btn.active {
          background: #d6ffcd;
          color: #264123;
        }

        .admin-main-panel {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .admin-card {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 6px -1px rgba(38, 65, 35, 0.05);
          padding: 24px;
        }

        .admin-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .admin-title-row h3 {
          margin: 0;
          color: #264123;
          font-size: 1.25rem;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .admin-table th {
          padding: 12px;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #6b7280;
          border-bottom: 2px solid #f3f4f6;
        }

        .admin-table td {
          padding: 12px;
          font-size: 0.85rem;
          border-bottom: 1px solid #f3f4f6;
          vertical-align: middle;
        }

        .perf-bar {
          height: 8px;
          border-radius: 4px;
          background: #e5e7eb;
          overflow: hidden;
          margin-top: 4px;
        }

        .perf-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 300ms ease;
        }

        .chat-bubble {
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 0.8rem;
          max-width: 80%;
          line-height: 1.4;
          margin-bottom: 8px;
        }

        .chat-buyer {
          background: rgba(38, 65, 35, 0.06);
          color: #264123;
          align-self: flex-start;
          border-bottom-left-radius: 2px;
        }

        .chat-farmer {
          background: #264123;
          color: #ffffff;
          align-self: flex-end;
          border-bottom-right-radius: 2px;
        }

        /* Fleet Tracker Simulation Grid styling */
        .fleet-tracker-panel {
          background: #111827;
          border-radius: 12px;
          padding: 20px;
          color: #10b981;
          font-family: 'Courier New', Courier, monospace;
          margin-bottom: 20px;
          border: 1px solid #065f46;
        }

        .fleet-header {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #065f46;
          padding-bottom: 10px;
          margin-bottom: 14px;
          font-size: 0.85rem;
        }

        .truck-node {
          padding: 8px 12px;
          border-radius: 6px;
          background: rgba(16, 185, 129, 0.05);
          border: 1px dashed rgba(16, 185, 129, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          margin-bottom: 8px;
        }

        .conflict-evidence-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .conflict-parties-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .conflict-footer {
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-top: 1px solid #e5e7eb;
          padding-top: 16px;
        }

        .conflict-buttons {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }

        @media (min-width: 768px) {
          .conflict-evidence-grid {
            grid-template-columns: 1fr 1fr;
          }
          .conflict-parties-grid {
            grid-template-columns: 1fr 1fr;
          }
          .conflict-footer {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
          .conflict-buttons {
            flex-direction: row;
            width: auto;
          }
        }

        @media (max-width: 868px) {
          .admin-page-container {
            grid-template-columns: 1fr;
          }
          
          .admin-sidebar {
            flex-direction: row;
            overflow-x: auto;
            white-space: nowrap;
            padding: 12px;
          }
          
          .admin-sidebar-header {
            display: none;
          }
        }
      `}</style>

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
          <span>🌿</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{successNotification}</span>
        </div>
      )}

      {/* ── SIDEBAR NAVIGATION ────────────────────────────────────────────────── */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h4>VegeLink Systems</h4>
          <span>Operations Command</span>
        </div>
        <button
          className={`admin-sidebar-btn ${activeMenu === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveMenu('dashboard')}
        >
          📊 Dashboard Overview
        </button>
        <button
          className={`admin-sidebar-btn ${activeMenu === 'conflicts' ? 'active' : ''}`}
          onClick={() => setActiveMenu('conflicts')}
        >
          ⚖️ Dispute Mediation ({conflicts.filter(c => c.status === 'pending').length})
        </button>
        <button
          className={`admin-sidebar-btn ${activeMenu === 'listings' ? 'active' : ''}`}
          onClick={() => setActiveMenu('listings')}
        >
          🌾 Catalog Moderation
        </button>
        <button
          className={`admin-sidebar-btn ${activeMenu === 'verifications' ? 'active' : ''}`}
          onClick={() => setActiveMenu('verifications')}
        >
          👥 Agent Auditing ({verifications.filter(v => v.status === 'pending').length})
        </button>
        <button
          className={`admin-sidebar-btn ${activeMenu === 'paystack' ? 'active' : ''}`}
          onClick={() => setActiveMenu('paystack')}
        >
          💳 Paystack Integrations
        </button>
        <button
          className={`admin-sidebar-btn ${activeMenu === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveMenu('performance')}
        >
          📈 System Performance
        </button>
        <button
          className={`admin-sidebar-btn ${activeMenu === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveMenu('audit')}
        >
          📑 Operations Log
        </button>
      </aside>

      {/* ── MAIN CONTENT VIEWPORT ─────────────────────────────────────────────── */}
      <main className="admin-main-panel">
        
        {/* 1. DASHBOARD OVERVIEW */}
        {activeMenu === 'dashboard' && (
          <>
            {/* Fleet Logistics Live Tracker Panel */}
            <div className="fleet-tracker-panel">
              <div className="fleet-header">
                <strong>🛰️ FLEET GPS LIVE TRACKER SIMULATOR</strong>
                <span>Active Channels: {activeTrucks.length} Node Links</span>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {activeTrucks.map(truck => (
                  <div key={truck.id} className="truck-node">
                    <div>
                      <span style={{ color: '#34d399', fontWeight: 'bold' }}>[{truck.id}]</span> - {truck.driverName} ({truck.cargo})
                      <br />
                      <span style={{ color: '#6ee7b7', fontSize: '0.7rem' }}>Route: {truck.route} | GPS: {truck.position.lat.toFixed(5)}, {truck.position.lng.toFixed(5)}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: truck.speedKmh > 0 ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>
                        {truck.status.toUpperCase()}
                      </span>
                      <br />
                      <span style={{ fontSize: '0.7rem', color: '#6ee7b7' }}>{truck.speedKmh} KM/H</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <span>Total Payment Intake</span>
                <strong>GHS 128,450.00</strong>
              </div>
              <div className="stat-card">
                <span>Active Conflict Disputes</span>
                <strong style={{ color: '#d97706' }}>
                  {conflicts.filter(c => c.status === 'pending').length}
                </strong>
              </div>
              <div className="stat-card">
                <span>Agent Farmers Registered</span>
                <strong>142</strong>
              </div>
              <div className="stat-card">
                <span>API Health Load</span>
                <strong>{latency} ms</strong>
              </div>
            </div>

            <div className="two-column-card">
              <div className="admin-card">
                <div className="admin-title-row">
                  <h3>Operations Status Checklist</h3>
                </div>
                <div style={{ display: 'grid', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: 10 }}>
                    <span style={{ fontWeight: 600 }}>Paystack Webhook Handler</span>
                    <span style={{ color: '#15803d', fontWeight: 700 }}>🟢 Operational</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: 10 }}>
                    <span style={{ fontWeight: 600 }}>SMS Verification Gateway</span>
                    <span style={{ color: '#15803d', fontWeight: 700 }}>🟢 Active</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: 10 }}>
                    <span style={{ fontWeight: 600 }}>PostGIS Spatial Engine</span>
                    <span style={{ color: '#15803d', fontWeight: 700 }}>🟢 Linked</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600 }}>Paystack Gateway Mode</span>
                    <span style={{ color: paystackMode === 'sandbox' ? '#d97706' : '#15803d', fontWeight: 800, textTransform: 'uppercase' }}>
                      {paystackMode}
                    </span>
                  </div>
                </div>
              </div>

              <div className="admin-card">
                <div className="admin-title-row">
                  <h3>Recent Audit Log</h3>
                  <button onClick={() => setActiveMenu('audit')} style={{ background: 'none', border: 'none', color: '#15803d', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>View All</button>
                </div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {auditLogs.slice(0, 3).map(log => (
                    <div key={log.id} style={{ padding: '8px 12px', background: '#f9fafb', borderRadius: 8, fontSize: '0.8rem' }}>
                      <span style={{ fontWeight: 700, color: '#6b7280' }}>[{log.timestamp}]</span> <span style={{ fontWeight: 600, color: '#264123' }}>{log.action}</span>
                      <p style={{ margin: '2px 0 0 0', opacity: 0.8 }}>{log.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* 2. DISPUTE MEDIATION (CONFLICTS) */}
        {activeMenu === 'conflicts' && (
          <div className="admin-card">
            <div className="admin-title-row">
              <h3>Discrepancy Mediation Hub</h3>
              <span style={{ background: 'rgba(217,119,6,0.1)', color: '#d97706', padding: '4px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700 }}>
                {conflicts.filter(c => c.status === 'pending').length} Actions Required
              </span>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>Conflict ID</th>
                  <th>Order Ref</th>
                  <th>Issue Description</th>
                  <th>Parties Involved</th>
                  <th>Value</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {conflicts.map(conflict => (
                  <tr key={conflict.id}>
                    <td style={{ fontWeight: 700, color: '#6b7280' }}>{conflict.id}</td>
                    <td style={{ fontWeight: 600 }}>{conflict.orderId}</td>
                    <td>{conflict.issue}</td>
                    <td>
                      <span style={{ fontWeight: 600 }}>Farmer:</span> {conflict.farmerName}<br />
                      <span style={{ fontWeight: 600 }}>Buyer:</span> {conflict.buyerName}
                    </td>
                    <td style={{ fontWeight: 700 }}>GHS {conflict.amountGhs.toFixed(2)}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800,
                        background: conflict.status === 'pending' ? 'rgba(217,119,6,0.1)' : conflict.status === 'investigating' ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)',
                        color: conflict.status === 'pending' ? '#d97706' : conflict.status === 'investigating' ? '#2563eb' : '#059669'
                      }}>
                        {conflict.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <button
                        className="primary-button"
                        style={{ minHeight: 32, padding: '0 12px', fontSize: '0.75rem' }}
                        onClick={() => setSelectedConflict(conflict)}
                      >
                        Mediate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. CATALOG MODERATION (LISTINGS) */}
        {activeMenu === 'listings' && (
          <div style={{ display: 'grid', gap: 20 }}>
            {/* Crop Price Index Comparison Card (Market Intelligence) */}
            <div className="admin-card">
              <div className="admin-title-row">
                <h3>Regional crop price indexes (Market Intelligence Benchmark)</h3>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Pricing group averages per KG</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Produce Item</th>
                      <th>Ashanti region</th>
                      <th>Greater Accra region</th>
                      <th>Eastern region</th>
                      <th>Weekly Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cropPrices.map((cp, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 700, color: '#264123' }}>{cp.crop}</td>
                        <td style={{ fontWeight: 600 }}>GHS {cp.ashantiPrice.toFixed(2)}</td>
                        <td style={{ fontWeight: 600 }}>GHS {cp.greaterAccraPrice.toFixed(2)}</td>
                        <td style={{ fontWeight: 600 }}>GHS {cp.easternPrice.toFixed(2)}</td>
                        <td>
                          <span style={{
                            padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800,
                            background: cp.direction === 'up' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            color: cp.direction === 'up' ? '#059669' : '#dc2626'
                          }}>
                            {cp.weeklyChange}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-title-row">
                <h3>Produce Catalog Moderation</h3>
              </div>

              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Listing ID</th>
                    <th>Farmer</th>
                    <th>Vegetable</th>
                    <th>Quantity / Price</th>
                    <th>Region</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map(l => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 700, color: '#6b7280' }}>{l.id}</td>
                      <td style={{ fontWeight: 600 }}>{l.farmerName}</td>
                      <td>{l.cropType}</td>
                      <td>{l.quantityKg} kg @ GHS {l.pricePerKgGhs.toFixed(2)}</td>
                      <td>{l.region} Region</td>
                      <td>
                        <span style={{
                          padding: '4px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800,
                          background: l.status === 'active' ? 'rgba(16,185,129,0.1)' : l.status === 'flagged' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                          color: l.status === 'active' ? '#059669' : l.status === 'flagged' ? '#dc2626' : '#d97706'
                        }}>
                          {l.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td style={{ display: 'flex', gap: 6 }}>
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

        {/* 4. AGENT FARMER VERIFICATIONS */}
        {activeMenu === 'verifications' && (
          <div style={{ display: 'grid', gap: 20 }}>
            <div className="admin-card">
              <div className="admin-title-row">
                <h3>Agent Farmer Registration Audit Queue</h3>
                <span className="section-note">Documents Verification Checks</span>
              </div>

              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Submitting Agent</th>
                    <th>Farmer Name</th>
                    <th>Region & Crop</th>
                    <th>Verification Files</th>
                    <th>Status</th>
                    <th>Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {verifications.map(v => (
                    <tr key={v.id}>
                      <td style={{ fontWeight: 700, color: '#6b7280' }}>{v.id}</td>
                      <td style={{ fontWeight: 600 }}>{v.agentName}</td>
                      <td style={{ fontWeight: 600 }}>{v.farmerName}</td>
                      <td>{v.region} Region · {v.vegetableType}</td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {v.docsProvided.map((doc, idx) => (
                            <span key={idx} style={{ fontSize: '0.65rem', background: '#f3f4f6', color: '#374151', padding: '2px 6px', borderRadius: 4 }}>
                              📄 {doc}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800,
                          background: v.status === 'pending' ? 'rgba(245,158,11,0.1)' : v.status === 'approved' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          color: v.status === 'pending' ? '#d97706' : v.status === 'approved' ? '#059669' : '#dc2626'
                        }}>
                          {v.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ display: 'flex', gap: 6 }}>
                        {v.status === 'pending' && (
                          <>
                            <button
                              className="primary-button"
                              style={{ minHeight: 32, padding: '0 12px', fontSize: '0.75rem', background: '#15803d' }}
                              onClick={() => handleVerifyAgentFarmer(v.id, 'approve')}
                            >
                              Approve
                            </button>
                            <button
                              className="secondary-button"
                              style={{ minHeight: 32, padding: '0 12px', fontSize: '0.75rem', borderColor: '#dc2626', color: '#dc2626' }}
                              onClick={() => handleVerifyAgentFarmer(v.id, 'reject')}
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Agent Onboarding Commissions Ledger */}
            <div className="admin-card">
              <div className="admin-title-row">
                <h3>Agent Performance & Onboarding Commission Ledger</h3>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Agent ID</th>
                    <th>Agent Name</th>
                    <th>Region</th>
                    <th>Farmers Onboarded</th>
                    <th>Gross Sales Closed</th>
                    <th>Commission Earned (2.5%)</th>
                    <th>Payout Action</th>
                  </tr>
                </thead>
                <tbody>
                  {agentPerformance.map(ap => (
                    <tr key={ap.id}>
                      <td style={{ fontWeight: 700, color: '#6b7280' }}>{ap.id}</td>
                      <td style={{ fontWeight: 600 }}>{ap.agentName}</td>
                      <td>{ap.region} Region</td>
                      <td style={{ fontWeight: 700 }}>{ap.farmersRegistered}</td>
                      <td style={{ fontWeight: 600 }}>GHS {ap.totalTradeVolumeGhs.toFixed(2)}</td>
                      <td style={{ fontWeight: 700, color: '#15803d' }}>GHS {ap.commissionEarnedGhs.toFixed(2)}</td>
                      <td>
                        {ap.commissionPaid ? (
                          <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 'bold' }}>🟢 Disbursed</span>
                        ) : (
                          <button
                            className="secondary-button"
                            style={{ minHeight: 32, padding: '0 12px', fontSize: '0.75rem', borderColor: '#15803d', color: '#15803d' }}
                            onClick={() => handlePayAgentCommission(ap.id)}
                          >
                            Pay Commission
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

        {/* 5. PAYSTACK INTEGRATION ENVIRONMENT */}
        {activeMenu === 'paystack' && (
          <div className="admin-card">
            <div className="admin-title-row">
              <h3>Paystack Payment Gateway Settings</h3>
            </div>

            <div style={{ display: 'grid', gap: 20 }}>
              <div className="two-column-card">
                <div style={{ padding: 18, border: '1px solid #e5e7eb', borderRadius: 12, background: '#fcfdfa' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#264123' }}>Environment Selector</h4>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      className={`filter-chip ${paystackMode === 'sandbox' ? 'active' : ''}`}
                      onClick={() => {
                        setPaystackMode('sandbox')
                        logAction('Change Paystack Mode', 'Set environment to Sandbox.')
                      }}
                    >
                      🧪 Sandbox Test
                    </button>
                    <button
                      className={`filter-chip ${paystackMode === 'live' ? 'active' : ''}`}
                      onClick={() => {
                        setPaystackMode('live')
                        logAction('Change Paystack Mode', 'Set environment to Live (Production).')
                      }}
                    >
                      ⚡ Production Live
                    </button>
                  </div>
                </div>

                <div style={{ padding: 18, border: '1px solid #e5e7eb', borderRadius: 12, background: '#fcfdfa' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#264123' }}>Webhook Simulation Tools</h4>
                  <p style={{ margin: '0 0 10px 0', fontSize: '0.75rem', color: '#6b7280' }}>
                    Send a test payload to <code>{webhookUrl}</code>.
                  </p>
                  <button
                    className="primary-button"
                    style={{ minHeight: 38, fontSize: '0.8rem' }}
                    onClick={triggerMockWebhook}
                  >
                    Simulate Payment Hook
                  </button>
                </div>
              </div>

              {/* Escrow Vault Management Section */}
              <div>
                <h4 style={{ margin: '0 0 10px 0', color: '#264123' }}>Marketplace Escrow holding accounts</h4>
                <table className="admin-table" style={{ marginBottom: 20 }}>
                  <thead>
                    <tr>
                      <th>Escrow ID</th>
                      <th>Order ID</th>
                      <th>Farmer Name</th>
                      <th>Buyer Name</th>
                      <th>Total Escrowed</th>
                      <th>Status</th>
                      <th>Payout Override</th>
                    </tr>
                  </thead>
                  <tbody>
                    {escrowAccounts.map(e => (
                      <tr key={e.id}>
                        <td style={{ fontWeight: 700, color: '#6b7280' }}>{e.id}</td>
                        <td style={{ fontWeight: 600 }}>{e.orderId}</td>
                        <td>{e.farmerName}</td>
                        <td>{e.buyerName}</td>
                        <td style={{ fontWeight: 700 }}>GHS {e.amountGhs.toFixed(2)}</td>
                        <td>
                          <span style={{
                            padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800,
                            background: e.status === 'held' ? 'rgba(245,158,11,0.1)' : e.status === 'released' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            color: e.status === 'held' ? '#d97706' : e.status === 'released' ? '#059669' : '#dc2626'
                          }}>
                            {e.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {e.status === 'released' ? (
                            <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 'bold' }}>🟢 Released</span>
                          ) : (
                            <button
                              className="primary-button"
                              style={{ minHeight: 32, padding: '0 12px', fontSize: '0.75rem', background: '#15803d' }}
                              onClick={() => handleReleaseEscrow(e.id)}
                            >
                              Force Payout Release
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <h4 style={{ margin: '0 0 10px 0', color: '#264123' }}>Recent Transactions Ledger</h4>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>TX ID</th>
                      <th>Buyer Name</th>
                      <th>Amount</th>
                      <th>Reference</th>
                      <th>Method</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(t => (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 700, color: '#6b7280' }}>{t.id}</td>
                        <td style={{ fontWeight: 600 }}>{t.buyerName}</td>
                        <td style={{ fontWeight: 700 }}>GHS {t.amountGhs.toFixed(2)}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{t.reference}</td>
                        <td>{t.paymentMethod}</td>
                        <td>{t.date}</td>
                        <td>
                          <span style={{
                            padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800,
                            background: t.status === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            color: t.status === 'success' ? '#059669' : '#dc2626'
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
          </div>
        )}

        {/* 6. PERFORMANCE & INFRASTRUCTURE */}
        {activeMenu === 'performance' && (
          <div className="admin-card">
            <div className="admin-title-row">
              <h3>System Cluster Metrics</h3>
            </div>

            <div style={{ display: 'grid', gap: 20 }}>
              <div className="stats-grid">
                <div className="stat-card">
                  <span>Server Nodes</span>
                  <strong>03 (US-East)</strong>
                </div>
                <div className="stat-card">
                  <span>Active Connections</span>
                  <strong>1,492 / sec</strong>
                </div>
                <div className="stat-card">
                  <span>DB Connection Pool</span>
                  <strong>32 / 50 Active</strong>
                </div>
                <div className="stat-card">
                  <span>Cache Hit Rate</span>
                  <strong>99.85 %</strong>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 16, padding: 18, border: '1px solid #e5e7eb', borderRadius: 12 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600 }}>CPU Performance load</span>
                    <strong>{cpuUsage}%</strong>
                  </div>
                  <div className="perf-bar">
                    <div className="perf-bar-fill" style={{ width: `${cpuUsage}%`, background: cpuUsage > 75 ? '#dc2626' : '#15803d' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600 }}>Memory load</span>
                    <strong>{memUsage}%</strong>
                  </div>
                  <div className="perf-bar">
                    <div className="perf-bar-fill" style={{ width: `${memUsage}%`, background: '#15803d' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600 }}>API latency (Vercel Edge Gateway)</span>
                    <strong>{latency} ms</strong>
                  </div>
                  <div className="perf-bar">
                    <div className="perf-bar-fill" style={{ width: `${latency * 4}%`, background: '#15803d' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. OPERATIONS LOG (AUDIT LOGS) */}
        {activeMenu === 'audit' && (
          <div className="admin-card">
            <div className="admin-title-row">
              <h3>Platform Operations Audit Trail</h3>
            </div>
            
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Log ID</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Event Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ color: '#6b7280' }}>{log.timestamp}</td>
                    <td style={{ fontWeight: 700, color: '#6b7280' }}>{log.id}</td>
                    <td style={{ fontWeight: 600 }}>{log.actor}</td>
                    <td style={{ fontWeight: 600, color: '#264123' }}>{log.action}</td>
                    <td>{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </main>

      {/* ── CONFLICT DETAIL MEDIATION PANEL MODAL ────────────────────────────────────── */}
      {selectedConflict && (
        <Modal maxWidth={720} onClose={() => setSelectedConflict(null)}>
          <ModalHeader
            eyebrow="Conflict Resolution Panel"
            title="Resolve Conflict Dispute"
            onClose={() => setSelectedConflict(null)}
          />
          
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ padding: 16, background: '#fcfdfa', border: '1px solid #e5e7eb', borderRadius: 12 }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6b7280' }}>
                DISPUTE ID: {selectedConflict.id} · ORDER: {selectedConflict.orderId}
              </span>
              <h3 style={{ margin: '8px 0 12px 0', color: '#264123' }}>{selectedConflict.issue}</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>{selectedConflict.details}</p>
            </div>

            {/* Chat log visual mediation trail */}
            <div>
              <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                💬 Chat Mediation Log Trail
              </span>
              <div style={{
                maxHeight: 180, overflowY: 'auto', padding: 12, border: '1px solid #e5e7eb',
                borderRadius: 8, background: '#f9fafb', display: 'flex', flexDirection: 'column'
              }}>
                {selectedConflict.chatLog.map((chat, idx) => (
                  <div
                    key={idx}
                    className={`chat-bubble ${chat.sender === 'farmer' ? 'chat-farmer' : 'chat-buyer'}`}
                  >
                    <strong style={{ display: 'block', fontSize: '0.65rem', marginBottom: 2 }}>
                      {chat.sender === 'farmer' ? selectedConflict.farmerName : selectedConflict.buyerName} ({chat.time})
                    </strong>
                    {chat.message}
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Dispute Evidence Board visual elements */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, background: '#f9fafb' }}>
              <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                📸 Dispute Evidence Inspection Board
              </span>
              <div className="conflict-evidence-grid">
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }}>
                  <strong style={{ fontSize: '0.7rem', color: '#15803d', display: 'block', marginBottom: 4 }}>Catalog Reference Photo Check</strong>
                  <div style={{ height: 80, background: '#e2e8f0', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px dashed #cbd5e1' }}>
                    📦
                  </div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.68rem', color: '#4b5563', lineHeight: 1.3 }}>
                    {selectedConflict.evidence.catalogReference}
                  </p>
                </div>

                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 10 }}>
                  <strong style={{ fontSize: '0.7rem', color: '#dc2626', display: 'block', marginBottom: 4 }}>Buyer Uploaded Dispute Evidence</strong>
                  <div style={{ height: 80, background: '#fee2e2', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px dashed #fca5a5' }}>
                    ⚠️
                  </div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.68rem', color: '#4b5563', lineHeight: 1.3 }}>
                    {selectedConflict.evidence.buyerPhotoLabel}
                  </p>
                </div>
              </div>
              <div style={{ marginTop: 10, background: 'rgba(217,119,6,0.06)', borderLeft: '3px solid #d97706', padding: 8, borderRadius: 4, fontSize: '0.7rem', color: '#b45309' }}>
                <strong>Mediator notes:</strong> {selectedConflict.evidence.discrepancyNotes}
              </div>
            </div>

            <div className="conflict-parties-grid">
              <div style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
                <strong style={{ fontSize: '0.8rem', color: '#6b7280' }}>FARMER PARTY</strong>
                <p style={{ margin: '4px 0 0 0', fontWeight: 600, fontSize: '0.9rem' }}>{selectedConflict.farmerName}</p>
              </div>
              <div style={{ padding: 12, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
                <strong style={{ fontSize: '0.8rem', color: '#6b7280' }}>BUYER PARTY</strong>
                <p style={{ margin: '4px 0 0 0', fontWeight: 600, fontSize: '0.9rem' }}>{selectedConflict.buyerName}</p>
              </div>
            </div>

            <div className="conflict-footer">
              <div>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600 }}>DISPUTED VALUE</span>
                <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#264123' }}>GHS {selectedConflict.amountGhs.toFixed(2)}</p>
              </div>
              
              <div className="conflict-buttons">
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
