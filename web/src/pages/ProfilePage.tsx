import { useState, useCallback } from 'react'
import { useAuthStore } from '../store/auth.store'
import { useLogout, useUpdatePaymentDetails, useProfile, useUpdateProfile } from '../hooks/useAuth'
import { useMyOrders } from '../hooks/useOrders'
import { Icon } from '../components/Icon'
import { Link } from 'react-router-dom'
import { usersApi } from '../lib/apiCalls'
import { toast } from 'sonner'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ── Constants ──────────────────────────────────────────────────────────────────

function getInitials(fullName?: string, phone?: string): string {
  if (fullName && fullName.trim()) {
    return fullName.trim().split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  }
  return phone?.slice(-4) ?? 'VG'
}

const LANGUAGE_LABELS: Record<string, string> = {
  english: 'English', twi: 'Twi (Akan)', fante: 'Fante (Akan)', ga: 'Ga', ewe: 'Ewe',
  dagbani: 'Dagbani', frafra: 'Frafra (Gurenne)', dagaare: 'Dagaare', gonja: 'Gonja',
  mampruli: 'Mampruli', hausa: 'Hausa', nzema: 'Nzema',
}

const REGIONS = [
  'Greater Accra', 'Ashanti', 'Eastern', 'Western', 'Northern', 'Central',
  'Volta', 'Bono', 'Bono East', 'Ahafo', 'Savannah', 'North East',
  'Upper East', 'Upper West', 'Oti', 'Western North',
]

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  farmer:      { bg: 'rgba(34,197,94,0.12)',  text: '#15803d' },
  buyer:       { bg: 'rgba(59,130,246,0.12)', text: '#1d4ed8' },
  transporter: { bg: 'rgba(245,158,11,0.12)', text: '#d97706' },
  agent:       { bg: 'rgba(139,92,246,0.12)', text: '#7c3aed' },
}

// ── Location Picker Map ────────────────────────────────────────────────────────

const pinIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
})

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

interface LocationPickerProps {
  value: { lat: number; lng: number } | null
  onChange: (loc: { lat: number; lng: number }) => void
}

function LocationPickerMap({ value, onChange }: LocationPickerProps) {
  // Default center: Ghana centroid
  const center: [number, number] = value ? [value.lat, value.lng] : [7.9465, -1.0232]

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(38,65,35,0.15)', height: 260 }}>
      <MapContainer center={center} zoom={value ? 13 : 6} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapClickHandler onPick={(lat, lng) => onChange({ lat, lng })} />
        {value && <Marker position={[value.lat, value.lng]} icon={pinIcon} />}
      </MapContainer>
    </div>
  )
}

// ── Section Card wrapper ───────────────────────────────────────────────────────

function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: 20,
      border: '1px solid rgba(38,65,35,0.08)',
      padding: '28px 28px',
      boxShadow: '0 2px 12px rgba(38,65,35,0.06)',
      ...style,
    }}>
      {children}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(38,65,35,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {children}
    </span>
  )
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 46,
  padding: '10px 14px',
  borderRadius: 12,
  border: '1.5px solid rgba(38,65,35,0.15)',
  background: '#f8faf5',
  fontSize: '0.92rem',
  color: '#1a2e18',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 150ms ease',
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const { mutate: logout, isPending: loggingOut } = useLogout()
  const { data: orders } = useMyOrders()
  const { data: dbUser } = useProfile()
  const { mutate: updateProfile, isPending: updatingProfile } = useUpdateProfile()

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [region, setRegion] = useState('')
  const [language, setLanguage] = useState('')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showLocationPicker, setShowLocationPicker] = useState(false)

  const startEditing = () => {
    const current = dbUser || user
    const names = current?.fullName?.split(' ') || []
    setFirstName(dbUser?.firstName || names[0] || '')
    setMiddleName(dbUser?.middleName || (names.length > 2 ? names[1] : ''))
    setLastName(dbUser?.lastName || (names.length > 2 ? names.slice(2).join(' ') : names[1] || ''))
    setEmail(dbUser?.email || '')
    setRegion(dbUser?.region || current?.region || '')
    setLanguage(dbUser?.language || current?.language || '')
    setLocation(null)
    setShowLocationPicker(false)
    setIsEditing(true)
  }

  const handleLocationPick = useCallback((loc: { lat: number; lng: number }) => {
    setLocation(loc)
  }, [])

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First name and last name are required')
      return
    }
    updateProfile(
      {
        firstName: firstName.trim(),
        middleName: middleName.trim() || undefined,
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        region: region || undefined,
        language: language || undefined,
        location: location ?? undefined,
      },
      {
        onSuccess: () => { toast.success('Profile updated!'); setIsEditing(false) },
        onError: (err: any) => { toast.error(err?.response?.data?.error?.message || 'Failed to update profile') },
      },
    )
  }

  // Payment state
  const { mutate: updatePayment, isPending: updatingPayment } = useUpdatePaymentDetails()
  const [mobileNumber, setMobileNumber] = useState(user?.mobileMoneyNumber || '')
  const [mobileNetwork, setMobileNetwork] = useState(user?.mobileMoneyNetwork || 'mtn')
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [showChangeWallet, setShowChangeWallet] = useState(false)

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError('')
    setPaymentSuccess(false)
    if (!mobileNumber.trim()) { setValidationError('Mobile money phone number is required'); return }
    if (!/^(\+?233|0)?\d{9}$/.test(mobileNumber.trim())) { setValidationError('Enter a valid Ghanaian phone number (e.g. 0244123456)'); return }
    updatePayment(
      { mobile_number: mobileNumber.trim(), mobile_network: mobileNetwork },
      {
        onSuccess: async () => {
          setPaymentSuccess(true)
          try {
            const profileRes = await usersApi.getProfile()
            const u = profileRes.data.data.user
            const fullName = [u.firstName, u.middleName, u.lastName].filter(Boolean).join(' ')
            useAuthStore.getState().setAuth(
              { id: u.id, phone: u.phone, role: u.role, fullName, region: u.region ?? undefined, language: u.language ?? undefined, paymentDetailsSet: u.paymentDetailsSet, mobileMoneyNumber: u.mobileMoneyNumber, mobileMoneyNetwork: u.mobileMoneyNetwork },
              useAuthStore.getState().accessToken!,
            )
          } catch { /* ignore */ }
        },
        onError: (err: any) => { setValidationError(err?.response?.data?.error?.message || 'Failed to update payment details') },
      },
    )
  }

  const initials = getInitials(user?.fullName, user?.phone)
  const displayName = user?.fullName ?? user?.phone ?? 'Guest'
  const orderCount = Array.isArray(orders) ? orders.length : 0
  const languageLabel = user?.language ? (LANGUAGE_LABELS[user.language] ?? user.language) : '—'
  const roleStyle = ROLE_COLORS[user?.role ?? ''] ?? { bg: 'rgba(107,114,128,0.1)', text: '#374151' }

  return (
    <div className="page-stack">
      {/* ── Hero ── */}
      <section className="page-hero">
        <div>
          <p className="eyebrow">My Account</p>
          <h2>Your profile.</h2>
          <p>Manage your identity, location, and payment settings.</p>
        </div>
        <Link to="/" className="secondary-button" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', minHeight: 48, padding: '0 18px' }}>
          Back home
        </Link>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>

        {/* ── Identity card ── */}
        <SectionCard>
          {!isEditing ? (
            <>
              {/* Avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
                <div style={{
                  width: 68, height: 68, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #264123 0%, #3d6b38 100%)',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem', fontWeight: 800, flexShrink: 0,
                  boxShadow: '0 4px 16px rgba(38,65,35,0.25)',
                }}>
                  {initials}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1a2e18' }}>{displayName}</h3>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: roleStyle.bg, color: roleStyle.text, textTransform: 'capitalize' }}>
                      {user?.role ?? 'Guest'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>{user?.phone ?? ''}</p>
                </div>
              </div>

              {/* Stat pills */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                {[
                  { icon: '📦', label: 'Orders', value: String(orderCount) },
                  { icon: '📍', label: 'Region', value: dbUser?.region ?? user?.region ?? '—' },
                ].map((s) => (
                  <div key={s.label} style={{ flex: 1, textAlign: 'center', padding: '10px 4px', background: 'rgba(214,255,205,0.22)', borderRadius: 12, border: '1px solid rgba(38,65,35,0.07)' }}>
                    <div style={{ fontSize: '1rem', marginBottom: 2 }}>{s.icon}</div>
                    <strong style={{ display: 'block', fontSize: '0.9rem', color: '#264123', lineHeight: 1.1 }}>{s.value}</strong>
                    <span style={{ fontSize: '0.68rem', color: '#6b7280' }}>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Detail rows */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'First Name',   value: dbUser?.firstName  ?? user?.fullName?.split(' ')[0] ?? '—' },
                  { label: 'Last Name',    value: dbUser?.lastName   ?? user?.fullName?.split(' ').slice(1).join(' ') ?? '—' },
                  { label: 'Region',       value: dbUser?.region ?? user?.region ?? '—' },
                  { label: 'Language',     value: languageLabel },
                ].map((item) => (
                  <div key={item.label} style={{ background: '#f8faf5', borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(38,65,35,0.06)' }}>
                    <FieldLabel>{item.label}</FieldLabel>
                    <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#1a2e18', fontWeight: 600 }}>{item.value}</p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={startEditing}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                ✏️ Edit Profile
              </button>
            </>
          ) : (
            <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#264123,#3d6b38)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>{initials}</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#1a2e18' }}>Edit Profile</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>Update your details below</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FieldGroup label="First Name">
                  <input style={inputStyle} type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </FieldGroup>
                <FieldGroup label="Middle Name (Opt)">
                  <input style={inputStyle} type="text" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
                </FieldGroup>
              </div>

              <FieldGroup label="Last Name">
                <input style={inputStyle} type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </FieldGroup>

              <FieldGroup label="Email">
                <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </FieldGroup>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FieldGroup label="Region">
                  <select style={inputStyle} value={region} onChange={(e) => setRegion(e.target.value)}>
                    <option value="">Select Region</option>
                    {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </FieldGroup>
                <FieldGroup label="Language">
                  <select style={inputStyle} value={language} onChange={(e) => setLanguage(e.target.value)}>
                    <option value="">Select Language</option>
                    {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
                      <option key={code} value={code}>{label}</option>
                    ))}
                  </select>
                </FieldGroup>
              </div>

              {/* Location picker toggle */}
              <div style={{ borderRadius: 14, border: '1.5px dashed rgba(38,65,35,0.2)', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setShowLocationPicker((v) => !v)}
                  style={{ width: '100%', padding: '12px 16px', background: showLocationPicker ? 'rgba(214,255,205,0.3)' : 'rgba(38,65,35,0.03)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.88rem', color: '#264123' }}
                >
                  <span>📍 {location ? `Location set (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})` : 'Set my GPS location (optional)'}</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{showLocationPicker ? '▲ Hide' : '▼ Show map'}</span>
                </button>
                {showLocationPicker && (
                  <div style={{ padding: '0 12px 12px' }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '8px 0 8px' }}>
                      Tap anywhere on the map to drop your location pin.
                    </p>
                    <LocationPickerMap value={location} onChange={handleLocationPick} />
                    {location && (
                      <button type="button" onClick={() => setLocation(null)} style={{ marginTop: 8, fontSize: '0.75rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        ✕ Remove pin
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" className="secondary-button" onClick={() => setIsEditing(false)} style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={updatingProfile} style={{ flex: 1, justifyContent: 'center' }}>
                  {updatingProfile ? 'Saving…' : '✓ Save Changes'}
                </button>
              </div>
            </form>
          )}
        </SectionCard>

        {/* ── Payment Settings card ── */}
        {(user?.role === 'farmer' || user?.role === 'transporter') && (
          <SectionCard>
            <div style={{ marginBottom: 20 }}>
              <p className="eyebrow">Settlements</p>
              <h3 style={{ margin: '4px 0 0', color: '#1a2e18' }}>Mobile Money (MoMo)</h3>
            </div>

            {user.paymentDetailsSet ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(214,255,205,0.2)', border: '1px solid rgba(38,65,35,0.12)', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#d6ffcd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>💳</div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem', color: '#264123' }}>Settlement Ledger Active</p>
                    <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#6b7280', textTransform: 'capitalize' }}>
                      {user.mobileMoneyNetwork} · {user.mobileMoneyNumber}
                    </p>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: '0.7rem', fontWeight: 700, color: '#15803d', background: 'rgba(22,163,74,0.1)', padding: '3px 10px', borderRadius: 20 }}>Active</span>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowChangeWallet((v) => !v)}
                  style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
                >
                  {showChangeWallet ? '✕ Cancel change' : '✏️ Change wallet'}
                </button>

                {showChangeWallet && (
                  <form onSubmit={handlePaymentSubmit} style={{ display: 'grid', gap: 14, marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(38,65,35,0.08)' }}>
                    <FieldGroup label="Mobile Money Network">
                      <select value={mobileNetwork} onChange={(e) => setMobileNetwork(e.target.value)} style={inputStyle}>
                        <option value="mtn">MTN Mobile Money</option>
                        <option value="vodafone">Telecel Cash</option>
                        <option value="airteltigo">AirtelTigo Money</option>
                      </select>
                    </FieldGroup>

                    <FieldGroup label="Wallet Phone Number">
                      <input type="tel" placeholder="0244123456" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} style={inputStyle} />
                    </FieldGroup>

                    {validationError && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', fontSize: '0.8rem', color: '#dc2626', fontWeight: 600 }}>
                        ⚠️ {validationError}
                      </div>
                    )}

                    {paymentSuccess && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)', fontSize: '0.8rem', color: '#15803d', fontWeight: 600 }}>
                        ✓ Settlement wallet updated!
                      </div>
                    )}

                    <button type="submit" disabled={updatingPayment} className="primary-button" style={{ width: '100%', justifyContent: 'center', minHeight: 46 }}>
                      {updatingPayment ? 'Saving…' : '💳 Update Wallet'}
                    </button>
                  </form>
                )}
              </>
            ) : (
              <>
                <p style={{ fontSize: '0.85rem', color: '#6b7280', lineHeight: 1.6, marginBottom: 20 }}>
                  Set up your mobile money wallet to automatically receive split payments for your trades.
                </p>

                <form onSubmit={handlePaymentSubmit} style={{ display: 'grid', gap: 14 }}>
                  <FieldGroup label="Mobile Money Network">
                    <select value={mobileNetwork} onChange={(e) => setMobileNetwork(e.target.value)} style={inputStyle}>
                      <option value="mtn">MTN Mobile Money</option>
                      <option value="vodafone">Telecel Cash</option>
                      <option value="airteltigo">AirtelTigo Money</option>
                    </select>
                  </FieldGroup>

                  <FieldGroup label="Wallet Phone Number">
                    <input type="tel" placeholder="0244123456" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} style={inputStyle} />
                  </FieldGroup>

                  {validationError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', fontSize: '0.8rem', color: '#dc2626', fontWeight: 600 }}>
                      ⚠️ {validationError}
                    </div>
                  )}

                  {paymentSuccess && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)', fontSize: '0.8rem', color: '#15803d', fontWeight: 600 }}>
                      ✓ Settlement wallet saved successfully!
                    </div>
                  )}

                  <button type="submit" disabled={updatingPayment} className="primary-button" style={{ width: '100%', justifyContent: 'center', minHeight: 46 }}>
                    {updatingPayment ? 'Configuring…' : '💳 Configure Wallet'}
                  </button>
                </form>
              </>
            )}
          </SectionCard>
        )}

        {/* ── Account tools card ── */}
        <SectionCard>
          <p className="eyebrow">Account</p>
          <h3 style={{ margin: '4px 0 20px', color: '#1a2e18' }}>Tools & actions.</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            <button type="button" className="quick-link">
              <Icon name="shield" /> Reset PIN
            </button>

            {user?.role === 'farmer' && (
              <Link to="/listings" className="quick-link" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                <Icon name="bag" /> My Listings
              </Link>
            )}
            {user?.role === 'buyer' && (
              <Link to="/marketplace" className="quick-link" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                <Icon name="shopping" /> Marketplace
              </Link>
            )}
            {user?.role === 'agent' && (
              <Link to="/clients" className="quick-link" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                <Icon name="user" /> My Clients
              </Link>
            )}
            {user?.role === 'transporter' && (
              <Link to="/jobs" className="quick-link" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                <Icon name="truck" /> Transport Jobs
              </Link>
            )}
          </div>

          <div style={{ height: 1, background: 'rgba(38,65,35,0.07)', marginBottom: 16 }} />

          {user ? (
            <button
              type="button"
              onClick={() => logout()}
              disabled={loggingOut}
              style={{
                width: '100%', minHeight: 46, padding: '0 16px', borderRadius: 12,
                border: '1.5px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)',
                color: '#dc2626', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 150ms ease',
              }}
            >
              {loggingOut ? 'Logging out…' : '→ Log Out'}
            </button>
          ) : (
            <Link to="/auth/login" className="primary-button" style={{ textDecoration: 'none', display: 'inline-flex', width: '100%', justifyContent: 'center', minHeight: 48 }}>
              Log In
            </Link>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
