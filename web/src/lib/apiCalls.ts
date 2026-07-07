import type { RegisterFormData, LoginFormData, PlaceOrderFormData, CreateListingFormData } from '../schemas'
import type { Order } from '../types/api'

// ── LOCAL STORAGE ENGINE ──────────────────────────────────────────────────────

interface UserStore {
  id: string
  phone: string
  firstName: string
  lastName: string
  email?: string | null
  role: string
  pin?: string
  isActive: boolean
  createdAt: string
  region?: string
  language?: string
}

interface ClientAssignment {
  id: string
  agentId: string
  clientId: string
  createdAt: string
}

interface TransportJob {
  id: string
  orderId: string
  transporterId: string | null
  status: string
  costGhs: number
  distanceKm: number
  route: string
  createdAt: string
}

// Initial default seed accounts
const DEFAULT_USERS: UserStore[] = [
  { id: 'user-farmer', phone: '0244123456', firstName: 'Kwame', lastName: 'Mensah', email: 'kwame@agritech.com', role: 'farmer', pin: '1234', isActive: true, createdAt: new Date().toISOString(), region: 'Ashanti', language: 'twi' },
  { id: 'user-buyer', phone: '0244654321', firstName: 'Nana', lastName: 'Ampadu', email: 'nana@agritech.com', role: 'buyer', pin: '1234', isActive: true, createdAt: new Date().toISOString(), region: 'Greater Accra', language: 'ga' },
  { id: 'user-agent', phone: '0200000002', firstName: 'Ama', lastName: 'Osei', email: 'ama.agent@agritech.com', role: 'agent', pin: '1234', isActive: true, createdAt: new Date().toISOString(), region: 'Ashanti', language: 'twi' },
  { id: 'user-transporter', phone: '0200000003', firstName: 'Kojo', lastName: 'Logistics', email: 'kojo@agritech.com', role: 'transporter', pin: '1234', isActive: true, createdAt: new Date().toISOString(), region: 'Eastern', language: 'twi' },
  { id: 'user-admin', phone: '0233999999', firstName: 'Abena', lastName: 'Admin', email: 'admin@vegelink.app', role: 'admin', pin: '1234', isActive: true, createdAt: new Date().toISOString(), region: 'Greater Accra', language: 'english' },
]

const DEFAULT_LISTINGS: any[] = [
  {
    id: 'list-1',
    farmerId: 'user-farmer',
    farmer: { firstName: 'Kwame', lastName: 'Mensah', phone: '0244123456' },
    vegetable_type: 'Tomatoes',
    quantity_kg: 200,
    price_per_kg_ghs: 4.5,
    harvest_date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    status: 'active',
    images: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    freshness: 'High',
    agriScore: 94,
    isUrgent: true
  },
  {
    id: 'list-2',
    farmerId: 'user-farmer',
    farmer: { firstName: 'Kwame', lastName: 'Mensah', phone: '0244123456' },
    vegetable_type: 'Pepper',
    quantity_kg: 100,
    price_per_kg_ghs: 6.0,
    harvest_date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    status: 'active',
    images: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    freshness: 'Medium',
    agriScore: 82,
    isUrgent: false
  },
  {
    id: 'list-3',
    farmerId: 'user-farmer',
    farmer: { firstName: 'Kwame', lastName: 'Mensah', phone: '0244123456' },
    vegetable_type: 'Onions',
    quantity_kg: 350,
    price_per_kg_ghs: 3.5,
    harvest_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    status: 'active',
    images: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    freshness: 'High',
    agriScore: 88,
    isUrgent: false
  }
]

// Get state helpers
const getLocalStorage = <T>(key: string, defaultValue: T): T => {
  const item = localStorage.getItem(key)
  if (!item) {
    localStorage.setItem(key, JSON.stringify(defaultValue))
    return defaultValue
  }
  return JSON.parse(item)
}

const setLocalStorage = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value))
}

const getUsers = () => getLocalStorage<UserStore[]>('vl_users', DEFAULT_USERS)
const getListings = () => getLocalStorage<any[]>('vl_listings', DEFAULT_LISTINGS)
const getOrders = () => getLocalStorage<any[]>('vl_orders', [])
const getAssignments = () => getLocalStorage<ClientAssignment[]>('vl_assignments', [])
const getTransportJobs = () => getLocalStorage<TransportJob[]>('vl_transport', [])

// Session state tracking helper
const getActiveUser = (): UserStore | null => {
  const authState = localStorage.getItem('vegelink-auth')
  if (!authState) return null
  try {
    const parsed = JSON.parse(authState)
    const user = parsed.state?.user
    if (!user) return null
    return getUsers().find((u) => u.id === user.id) || null
  } catch {
    return null
  }
}

// ── Auth API Mock ─────────────────────────────────────────────────────────────

interface PendingRegistration {
  phone: string
  firstName: string
  lastName: string
  role: string
  region?: string
  language?: string
}

let pendingReg: PendingRegistration | null = null

export const authApi = {
  register: (data: RegisterFormData) => {
    pendingReg = {
      phone: data.phone,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      region: data.region,
      language: data.language,
    }
    return Promise.resolve({
      data: {
        success: true,
        message: 'Verification code dispatched successfully.',
        data: { expires_in_seconds: 600 }
      }
    } as any)
  },

  verifyOtp: (_phone: string, otp: string) => {
    if (!otp || otp.length !== 6) {
      return Promise.reject(new Error('Invalid OTP code. Must be 6 digits.'))
    }
    const token = 'mock-reg-token-' + Math.random().toString(36).substring(2)
    return Promise.resolve({
      data: {
        success: true,
        data: { registration_token: token }
      }
    } as any)
  },

  setPin: (pin: string, registrationToken: string) => {
    if (!pendingReg) {
      return Promise.reject(new Error('Registration sequence expired. Please restart.'))
    }
    const users = getUsers()
    const newUser: UserStore = {
      id: 'user-' + Math.random().toString(36).substring(2),
      phone: pendingReg.phone,
      firstName: pendingReg.firstName,
      lastName: pendingReg.lastName,
      role: pendingReg.role,
      region: pendingReg.region,
      language: pendingReg.language,
      pin,
      isActive: true,
      createdAt: new Date().toISOString()
    }
    users.push(newUser)
    setLocalStorage('vl_users', users)

    const responseUser = { id: newUser.id, phone: newUser.phone, role: newUser.role, fullName: `${newUser.firstName} ${newUser.lastName}`, region: newUser.region, language: newUser.language }
    return Promise.resolve({
      data: {
        success: true,
        data: {
          user: responseUser,
          accessToken: 'mock-access-token-' + registrationToken
        }
      }
    } as any)
  },

  login: (data: LoginFormData) => {
    const user = getUsers().find((u) => u.phone === data.phone && u.pin === data.pin)
    if (!user) {
      return Promise.reject({
        response: {
          data: {
            error: { message: 'Authentication failed. Please verify credentials.' }
          }
        }
      })
    }
    const responseUser = { id: user.id, phone: user.phone, role: user.role, fullName: `${user.firstName} ${user.lastName}`, region: user.region, language: user.language }
    return Promise.resolve({
      data: {
        success: true,
        data: {
          user: responseUser,
          accessToken: 'mock-access-token-' + Math.random().toString(36).substring(2)
        }
      }
    } as any)
  },

  refresh: () => {
    const user = getActiveUser()
    if (!user) return Promise.reject(new Error('Session signature missing.'))
    return Promise.resolve({
      data: {
        success: true,
        data: {
          accessToken: 'mock-refreshed-token-' + Math.random().toString(36).substring(2)
        }
      }
    } as any)
  },

  logout: () => {
    pendingReg = null
    return Promise.resolve({ data: { success: true } } as any)
  },

  resendOtp: (_phone: string) => {
    return Promise.resolve({
      data: {
        success: true,
        message: 'OTP code resent successfully.'
      }
    } as any)
  }
}

// ── Listings API Mock ─────────────────────────────────────────────────────────

export const listingsApi = {
  getMyListings: () => {
    const user = getActiveUser()
    if (!user) return Promise.reject(new Error('Unauthorized'))
    const mine = getListings().filter((l) => l.farmerId === user.id)
    return Promise.resolve({ data: { success: true, data: mine } } as any)
  },

  getAll: (params?: Record<string, string>) => {
    let list = getListings().filter((l) => l.status === 'active')
    if (params) {
      if (params.vegetable_type) {
        list = list.filter((l) => l.vegetable_type.toLowerCase() === params.vegetable_type.toLowerCase())
      }
      if (params.farmer_id) {
        list = getListings().filter((l) => l.farmerId === params.farmer_id)
      }
    }
    return Promise.resolve({ data: { success: true, data: list } } as any)
  },

  getById: (id: string) => {
    const item = getListings().find((l) => l.id === id)
    if (!item) return Promise.reject(new Error('Listing not found'))
    return Promise.resolve({ data: { success: true, data: { listing: item } } } as any)
  },

  create: (data: CreateListingFormData & { farmer_id?: string }) => {
    const user = getActiveUser()
    if (!user) return Promise.reject(new Error('Unauthorized'))

    const targetFarmerId = (user.role === 'agent' && data.farmer_id) ? data.farmer_id : user.id
    const farmerAccount = getUsers().find((u) => u.id === targetFarmerId)

    const list = getListings()
    // Generate random but realistic freshness and AgriScore for mock listings
    const freshnessOptions = ['High', 'Medium', 'Low'] as const
    const freshness = freshnessOptions[Math.floor(Math.random() * freshnessOptions.length)]
    const agriScore = Math.floor(70 + Math.random() * 28) // 70 to 97
    const isUrgent = Math.random() > 0.6 // 40% chance of being urgent

    const newItem: any = {
      id: 'list-' + Math.random().toString(36).substring(2),
      farmerId: targetFarmerId,
      farmer: {
        firstName: farmerAccount?.firstName ?? 'Farmer',
        lastName: farmerAccount?.lastName ?? 'Client',
        phone: farmerAccount?.phone ?? '0000000000'
      },
      vegetable_type: data.vegetable_type,
      quantity_kg: Number(data.quantity_kg),
      price_per_kg_ghs: Number(data.price_per_kg_ghs),
      harvest_date: data.harvest_date,
      status: 'active',
      images: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      freshness,
      agriScore,
      isUrgent
    }
    list.push(newItem)
    setLocalStorage('vl_listings', list)
    return Promise.resolve({ data: { success: true, data: { listing: newItem } } } as any)
  },

  update: (id: string, data: Partial<CreateListingFormData & { status: string }>) => {
    const list = getListings()
    const idx = list.findIndex((l) => l.id === id)
    if (idx === -1) return Promise.reject(new Error('Listing not found'))

    const updated = {
      ...list[idx],
      ...data,
      quantity_kg: data.quantity_kg !== undefined ? Number(data.quantity_kg) : list[idx].quantity_kg,
      price_per_kg_ghs: data.price_per_kg_ghs !== undefined ? Number(data.price_per_kg_ghs) : list[idx].price_per_kg_ghs,
      status: (data.status as any) || list[idx].status,
      updated_at: new Date().toISOString()
    }
    list[idx] = updated
    setLocalStorage('vl_listings', list)
    return Promise.resolve({ data: { success: true, data: { listing: updated } } } as any)
  },

  delete: (id: string) => {
    const list = getListings()
    const idx = list.findIndex((l) => l.id === id)
    if (idx === -1) return Promise.reject(new Error('Listing not found'))
    list[idx].status = 'cancelled'
    setLocalStorage('vl_listings', list)
    return Promise.resolve({ data: { success: true, data: { message: 'Listing cancelled successfully' } } } as any)
  }
}

// ── Orders API Mock ───────────────────────────────────────────────────────────

export const ordersApi = {
  getMyOrders: () => {
    const user = getActiveUser()
    if (!user) return Promise.reject(new Error('Unauthorized'))

    const all = getOrders()
    let filtered: Order[] = []

    if (user.role === 'buyer') {
      filtered = all.filter((o) => o.buyerId === user.id)
    } else if (user.role === 'farmer') {
      filtered = all.filter((o) => o.listing?.farmerId === user.id)
    } else if (user.role === 'agent') {
      // Find farmers represented by this agent
      const representedFarmerIds = getAssignments()
        .filter((a) => a.agentId === user.id)
        .map((a) => a.clientId)
      filtered = all.filter((o) => representedFarmerIds.includes(o.listing?.farmerId || ''))
    } else {
      filtered = all
    }

    return Promise.resolve({ data: { success: true, data: filtered } } as any)
  },

  getById: (id: string) => {
    const order = getOrders().find((o) => o.id === id)
    if (!order) return Promise.reject(new Error('Order not found'))
    return Promise.resolve({ data: { success: true, data: order } } as any)
  },

  place: (listingId: string, data: PlaceOrderFormData) => {
    const user = getActiveUser()
    if (!user) return Promise.reject(new Error('Unauthorized'))

    const listing = getListings().find((l) => l.id === listingId)
    if (!listing) return Promise.reject(new Error('Produce listing not found'))

    const orders = getOrders()
    const quantity = Number(data.quantity_kg)
    const totalGhs = quantity * listing.price_per_kg_ghs

    const newOrder: any = {
      id: 'ord-' + Math.random().toString(36).substring(2),
      buyerId: user.id,
      buyer: { firstName: user.firstName, lastName: user.lastName, phone: user.phone },
      listingId,
      listing,
      quantity_kg: quantity,
      price_per_kg_ghs: listing.price_per_kg_ghs,
      total_ghs: totalGhs,
      delivery_address: data.delivery_address,
      status: 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    orders.push(newOrder)
    setLocalStorage('vl_orders', orders)

    // If delivery fulfillment mode is selected, also create a transport job
    if (data.mode === 'delivery') {
      const jobs = getTransportJobs()
      jobs.push({
        id: 'job-' + Math.random().toString(36).substring(2),
        orderId: newOrder.id,
        transporterId: null,
        status: 'pending',
        costGhs: Math.round(50 + Math.random() * 80),
        distanceKm: Math.round(5 + Math.random() * 25),
        route: `Farm in Ejisu -> ${data.delivery_address}`,
        createdAt: new Date().toISOString()
      })
      setLocalStorage('vl_transport', jobs)
    }

    return Promise.resolve({ data: { success: true, data: newOrder } } as any)
  },

  confirm: (id: string) => {
    const orders = getOrders()
    const idx = orders.findIndex((o) => o.id === id)
    if (idx === -1) return Promise.reject(new Error('Order not found'))
    orders[idx].status = 'confirmed'
    setLocalStorage('vl_orders', orders)
    return Promise.resolve({ data: { success: true, data: orders[idx] } } as any)
  },

  cancel: (id: string, _reason: string) => {
    const orders = getOrders()
    const idx = orders.findIndex((o) => o.id === id)
    if (idx === -1) return Promise.reject(new Error('Order not found'))
    orders[idx].status = 'cancelled'
    setLocalStorage('vl_orders', orders)

    // Cancel related transport job too if any exists
    const jobs = getTransportJobs()
    const jobIdx = jobs.findIndex((j) => j.orderId === id)
    if (jobIdx !== -1) {
      jobs[jobIdx].status = 'cancelled'
      setLocalStorage('vl_transport', jobs)
    }

    return Promise.resolve({ data: { success: true, data: orders[idx] } } as any)
  }
}

// ── Transport API Mock ────────────────────────────────────────────────────────

export const transportApi = {
  getJobs: () => {
    const jobs = getTransportJobs()
    const orders = getOrders()
    const formattedJobs = jobs.map((job) => {
      const order = orders.find((o) => o.id === job.orderId)
      return {
        ...job,
        order
      }
    })
    return Promise.resolve({ data: { success: true, data: formattedJobs } } as any)
  },

  accept: (id: string) => {
    const user = getActiveUser()
    if (!user) return Promise.reject(new Error('Unauthorized'))

    const jobs = getTransportJobs()
    const idx = jobs.findIndex((j) => j.id === id)
    if (idx === -1) return Promise.reject(new Error('Transport job not found'))

    jobs[idx].transporterId = user.id
    jobs[idx].status = 'assigned'
    setLocalStorage('vl_transport', jobs)

    // Update matching order status to 'in_transit'
    const orders = getOrders()
    const orderIdx = orders.findIndex((o) => o.id === jobs[idx].orderId)
    if (orderIdx !== -1) {
      orders[orderIdx].status = 'in_transit'
      setLocalStorage('vl_orders', orders)
    }

    return Promise.resolve({ data: { success: true, data: jobs[idx] } } as any)
  },

  updateStatus: (id: string, status: string) => {
    const jobs = getTransportJobs()
    const idx = jobs.findIndex((j) => j.id === id)
    if (idx === -1) return Promise.reject(new Error('Transport job not found'))

    jobs[idx].status = status
    setLocalStorage('vl_transport', jobs)

    // Map transport statuses to order statuses
    const orders = getOrders()
    const orderIdx = orders.findIndex((o) => o.id === jobs[idx].orderId)
    if (orderIdx !== -1) {
      if (status === 'delivered') {
        orders[orderIdx].status = 'delivered'
      } else if (status === 'in_transit') {
        orders[orderIdx].status = 'in_transit'
      }
      setLocalStorage('vl_orders', orders)
    }

    return Promise.resolve({ data: { success: true, data: jobs[idx] } } as any)
  }
}

// ── Users API Mock ────────────────────────────────────────────────────────────

export const usersApi = {
  getProfile: () => {
    const user = getActiveUser()
    if (!user) return Promise.reject(new Error('Session signature missing.'))
    return Promise.resolve({ data: { success: true, data: user } } as any)
  },

  updateProfile: (data: { firstName?: string; lastName?: string }) => {
    const user = getActiveUser()
    if (!user) return Promise.reject(new Error('Session signature missing.'))

    const users = getUsers()
    const idx = users.findIndex((u) => u.id === user.id)
    if (idx === -1) return Promise.reject(new Error('User not found'))

    users[idx].firstName = data.firstName ?? users[idx].firstName
    users[idx].lastName = data.lastName ?? users[idx].lastName
    setLocalStorage('vl_users', users)

    // Sync auth store copy
    const authState = localStorage.getItem('vegelink-auth')
    if (authState) {
      const parsed = JSON.parse(authState)
      if (parsed.state?.user) {
        parsed.state.user.firstName = users[idx].firstName
        parsed.state.user.lastName = users[idx].lastName
        localStorage.setItem('vegelink-auth', JSON.stringify(parsed))
      }
    }

    return Promise.resolve({ data: { success: true, data: users[idx] } } as any)
  },

  // ── Agent Client Management Mocks (formerly implemented in hook) ──────────

  getClients: () => {
    const user = getActiveUser()
    if (!user) return Promise.reject(new Error('Unauthorized'))

    const assignedIds = getAssignments()
      .filter((a) => a.agentId === user.id)
      .map((a) => a.clientId)
    
    const clientProfiles = getUsers().filter((u) => assignedIds.includes(u.id))
    return Promise.resolve({
      data: {
        success: true,
        data: { data: clientProfiles }
      }
    } as any)
  },

  registerClient: (data: { phone: string; firstName: string; lastName: string; email?: string; region?: string; language?: string }) => {
    const user = getActiveUser()
    if (!user) return Promise.reject(new Error('Unauthorized'))

    const users = getUsers()
    const existing = users.find((u) => u.phone === data.phone)
    if (existing) {
      return Promise.reject(new Error('A client with this phone number is already registered.'))
    }

    const newClient: UserStore = {
      id: 'user-client-' + Math.random().toString(36).substring(2),
      phone: data.phone,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || null,
      role: 'farmer',
      region: data.region,
      language: data.language,
      isActive: true,
      createdAt: new Date().toISOString()
    }
    users.push(newClient)
    setLocalStorage('vl_users', users)

    // Create tracking relationship assignment
    const assignments = getAssignments()
    assignments.push({
      id: 'assign-' + Math.random().toString(36).substring(2),
      agentId: user.id,
      clientId: newClient.id,
      createdAt: new Date().toISOString()
    })
    setLocalStorage('vl_assignments', assignments)

    return Promise.resolve({ data: { success: true, data: newClient } } as any)
  },

  unassignClient: (clientId: string) => {
    const user = getActiveUser()
    if (!user) return Promise.reject(new Error('Unauthorized'))

    let assignments = getAssignments()
    assignments = assignments.filter((a) => !(a.agentId === user.id && a.clientId === clientId))
    setLocalStorage('vl_assignments', assignments)

    return Promise.resolve({
      data: {
        success: true,
        data: { message: 'Client management mapping tracking card unlinked cleanly.' }
      }
    } as any)
  }
}
