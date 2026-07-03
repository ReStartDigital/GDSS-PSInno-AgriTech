import type { IconName } from './components/Icon'

export type PageKey = 'home' | 'auth' | 'marketplace' | 'listings' | 'orders' | 'profile'

export const appPages: PageKey[] = ['home', 'auth', 'marketplace', 'listings', 'orders', 'profile']

export const siteNavItems: Array<{ key: PageKey; label: string; icon: IconName }> = [
  { key: 'home', label: 'Overview', icon: 'leaf' },
  { key: 'auth', label: 'Auth', icon: 'shield' },
  { key: 'marketplace', label: 'Marketplace', icon: 'shopping' },
  { key: 'listings', label: 'Listings', icon: 'bag' },
  { key: 'orders', label: 'Orders', icon: 'truck' },
  { key: 'profile', label: 'Profile', icon: 'user' },
]

export const platformStats = [
  { value: '4', label: 'roles supported' },
  { value: '7', label: 'core routes mirrored' },
  { value: '1', label: 'shared design system' },
]

export const roles = [
  { id: 'farmer', label: 'Farmer', summary: 'List produce, manage orders, and confirm supply on the ground.', accent: 'Fresh inventory' },
  { id: 'buyer', label: 'Buyer', summary: 'Browse the marketplace, place orders, and track delivery progress.', accent: 'Market access' },
  { id: 'transporter', label: 'Transporter', summary: 'Accept delivery jobs, view routes, and update live status.', accent: 'Live logistics' },
  { id: 'agent', label: 'Agent', summary: 'Support farmers, verify listings, and clear pending orders.', accent: 'Field operations' },
] as const

export const workflows = [
  { title: 'Register', detail: 'Phone number, role, and location for field-ready onboarding.' },
  { title: 'Verify OTP', detail: 'SMS verification backed by the backend challenge flow.' },
  { title: 'Set PIN', detail: 'Short-lived registration token completes account activation.' },
  { title: 'Login', detail: 'Cookie-backed refresh session for returning users.' },
] as const

export const marketplaceListings = [
  { name: 'Fresh tomatoes', price: 'GH₵ 28 / crate', farm: 'Amasaman Growers', location: 'Kumasi', freshness: 'High', icon: 'pin' as const },
  { name: 'Garden eggs', price: 'GH₵ 18 / basket', farm: 'Tema Coastal Farms', location: 'Tema West', freshness: 'Medium', icon: 'clock' as const },
  { name: 'Onions', price: 'GH₵ 36 / sack', farm: 'Dodowa Valley', location: 'Shai Osudoku', freshness: 'High', icon: 'map' as const },
  { name: 'Pepper mix', price: 'GH₵ 24 / crate', farm: 'Madina Fields', location: 'Madina', freshness: 'Urgent', icon: 'shopping' as const },
] as const

export const farmerListings = [
  { title: 'Tomatoes - 24 crates', status: 'Live', price: 'GH₵ 28 / crate', location: 'Amasaman', note: 'Two transport requests awaiting confirmation.' },
  { title: 'Okra - 12 baskets', status: 'Draft', price: 'GH₵ 19 / basket', location: 'Kpong', note: 'Awaiting camera upload and GPS lock.' },
  { title: 'Pepper mix - 8 crates', status: 'Sold', price: 'GH₵ 24 / crate', location: 'Nsawam', note: 'Buyer payment received through mobile money.' },
] as const

export const orderItems = [
  { id: 'ORD-204', name: 'Tomatoes', actor: 'Buyer: Nana Foods', status: 'Pending payment', amount: 'GH₵ 672', eta: 'Due in 2 hours' },
  { id: 'ORD-201', name: 'Garden eggs', actor: 'Transporter: Kojo Logistics', status: 'In transit', amount: 'GH₵ 324', eta: 'En route' },
  { id: 'ORD-198', name: 'Onions', actor: 'Agent review', status: 'Awaiting confirmation', amount: 'GH₵ 540', eta: 'Waiting' },
] as const

export const profileSummary = [
  { label: 'Role', value: 'Farmer' },
  { label: 'Phone', value: '+233 24 000 0000' },
  { label: 'Verification', value: 'SMS verified' },
  { label: 'Session', value: 'Cookie refresh active' },
] as const

export const authSteps = [
  { title: 'Register', detail: 'Phone, role, and location entry.', action: 'Create account' },
  { title: 'Verify', detail: 'OTP delivered by SMS, then short-lived token issued.', action: 'Confirm OTP' },
  { title: 'Set PIN', detail: 'Final registration step before login becomes active.', action: 'Save PIN' },
  { title: 'Login', detail: 'Secure refresh cookie resumes the session for web users.', action: 'Enter app' },
] as const