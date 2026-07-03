# 🌿 VegeLink Ghana — Web App

> **React Web Client for the Farmer-to-Buyer Digital Marketplace**
> GDSS-PSInno AgriTech Innovation Challenge 2026 — Kumasi Vegetable Belt

[![Challenge](https://img.shields.io/badge/Challenge-GDSS--PSInno%202026-2E7D32?style=flat-square)](https://datasciencenet.org)
[![Stack](https://img.shields.io/badge/Stack-React%2019%20%7C%20Vite%208%20%7C%20TypeScript-0D47A1?style=flat-square)](#tech-stack)
[![License](https://img.shields.io/badge/License-Internal%20Only-red?style=flat-square)](#)
[![Status](https://img.shields.io/badge/Status-In%20Development-orange?style=flat-square)](#development-timeline)

---

## Table of Contents

- [What is This?](#what-is-this)
- [How It Fits](#how-it-fits)
- [Who It Serves](#who-it-serves)
- [Core Pages](#core-pages)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Routing](#routing)
- [Component Library](#component-library)
- [State Management](#state-management)
- [Styling](#styling)
- [Auth Flow](#auth-flow)
- [API Integration](#api-integration)
- [Testing](#testing)
- [Development Timeline](#development-timeline)
- [Team & Contact](#team--contact)

---

## What is This?

This is the **React web client** for VegeLink Ghana — a cross-platform digital marketplace that directly connects smallholder vegetable farmers with buyers, transporters, and field agents in the Kumasi Vegetable Belt.

The web app is the primary interface for **buyers**, **agents**, and **admin users** who prefer a desktop or browser experience. It runs in any modern browser and is fully responsive down to mobile viewports.

```
Farmer opens app  → Lists produce with GPS location
Buyer opens web   → Browses marketplace → Places order → Pays via MoMo
Agent opens web   → Manages farmer clients → Confirms orders on their behalf
Admin opens web   → Platform analytics, user management, dispute resolution
```

---

## How It Fits

VegeLink is a monorepo with three main components. This README covers the **web** directory.

```
GDSS-PSInno-AgriTech/
├── backend/    ← Express API, PostgreSQL, Paystack, Arkesel SMS
├── mobile/     ← React Native (Expo) client for farmers and transporters
└── web/        ← This directory — React + Vite web client
```

The web app communicates with the backend exclusively via REST API (`/api/v1`). The Vite dev server proxies all `/api` requests to `http://localhost:3000` to avoid CORS issues during development.

```
Web App ──── REST API ────── Backend ──── PostgreSQL + PostGIS
                                          Redis (sessions, rate limits)
                                          Paystack (payments)
                                          Arkesel (SMS)
                                          Cloudinary (images)
```

---

## Who It Serves

The web app presents a **role-adaptive interface** — the same build, different pages and navigation based on who logs in.

| Role | What They See | Key Actions |
|---|---|---|
| **Guest** | Overview, Marketplace | Browse listings, register, log in |
| **Farmer** | Overview, My Listings, Orders, Profile | Manage listings, confirm orders, view earnings |
| **Buyer** | Overview, Marketplace, Orders, Profile | Browse, place orders, pay via MoMo, track delivery |
| **Transporter** | Overview, Orders, Profile | View assigned deliveries, update status |
| **Agent** | Overview, Orders, Profile | Register farmers, manage listings, confirm orders |
| **Admin** | All of the above + admin routes | User management, analytics, dispute resolution |

---

## Core Pages

### 🔐 Authentication

- **Login** (`/auth/login`) — Phone + PIN entry. HttpOnly refresh cookie issued on success.
- **Register** (`/auth/register`) — Phone, name, and role selection. Triggers Arkesel OTP.
- **Verify OTP** (`/auth/verify`) — 6-digit SMS code input. Issues short-lived registration token.
- **Set PIN** (`/auth/set-pin`) — Final registration step. Requires valid registration token.

### 🏠 Overview (`/`)

Role-aware landing page. Shows platform stats, role cards, workflow steps, and a live dashboard summary for authenticated users (recent orders, listings).

### 🛒 Marketplace (`/marketplace`)

- Browse all active produce listings
- Filter by crop type (Tomatoes, Pepper, Onions, Garden Eggs, Okra)
- Place orders inline via modal (buyers only)
- Shows farmer name, price per kg, and available quantity

### 🌿 My Listings (`/listings`) — Farmer only, protected

- View all own produce listings with status badges
- Create new listing (crop type, quantity, price, harvest date)
- Delete listings with confirmation
- Listing lifecycle guide and status reference

### 📦 Orders (`/orders`) — Protected

- Full order history with status badges
- Click any order to open detail modal
- Role-specific actions: farmer can confirm, buyer/farmer can cancel
- Order lifecycle timeline and SMS alert reference

### 👤 Profile (`/profile`)

- Account info (phone, role, verification status)
- Quick links (Reset PIN, Verify phone, Update location)
- Role-specific shortcuts (farmer → listings, buyer → marketplace)
- Logout with session clearing

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | React 19 | Latest concurrent features, fast rendering |
| **Build Tool** | Vite 8 | Sub-second HMR, native ESM, minimal config |
| **Language** | TypeScript 6 (strict) | Compile-time safety, shared schema types with backend |
| **Routing** | React Router v7 | Declarative routing, nested layouts, protected routes |
| **Styling** | Plain CSS (design system) | Zero runtime overhead, full control, no class name collisions |
| **State** | Zustand 5 | Minimal boilerplate auth store with `persist` middleware |
| **Data Fetching** | TanStack React Query 5 | Automatic caching, retry logic, loading/error states |
| **HTTP** | Axios | JWT interceptor, automatic token refresh on 401 |
| **Forms** | React Hook Form 7 + Zod 4 | Uncontrolled performance, runtime + compile-time validation |
| **Linting** | Oxlint | Fast Rust-based linter with React and TypeScript rules |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              React Router (declarative)              │  ← URL-driven navigation
├─────────────────────────────────────────────────────┤
│                   Pages (pages/)                     │  ← Route components, minimal logic
├─────────────────────────────────────────────────────┤
│                Components (components/)              │  ← Reusable UI primitives
├─────────────────────────────────────────────────────┤
│              State (Zustand auth store)              │  ← Auth, session, role
├─────────────────────────────────────────────────────┤
│           Data Layer (React Query + Axios)           │  ← API calls, caching, mutations
├─────────────────────────────────────────────────────┤
│              Schemas (Zod — schemas/)                │  ← Shared validation with backend
└─────────────────────────────────────────────────────┘
```

### Request Lifecycle

```
User action → React Query mutation/query → Axios instance (JWT interceptor)
            → Backend REST API → Response cached by React Query
            → UI re-renders with new data
```

### Auth Flow

```
App load → Check Zustand persisted auth state
         → Authenticated?  → role-adaptive UI
         → Not authenticated? → /auth/login
                              → Register (phone + role)
                              → OTP verify (Arkesel SMS)
                              → Set PIN (registration token)
                              → Store JWT in Zustand + localStorage
                              → Redirect to /
```

---

## Project Structure

```
web/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Feedback.tsx      # Spinner, ErrorAlert, EmptyState, StatusBadge
│   │   │   └── Field.tsx         # Controlled input with label + error display
│   │   ├── Icon.tsx              # SVG icon component (leaf, truck, shopping, etc.)
│   │   └── RequireAuth.tsx       # Route guards: RequireAuth, RedirectIfAuth
│   ├── hooks/
│   │   ├── useAuth.ts            # useRegister, useVerifyOtp, useSetPin, useLogin, useLogout
│   │   ├── useListings.ts        # useMyListings, useAllListings, useCreateListing, useDeleteListing
│   │   └── useOrders.ts          # useMyOrders, usePlaceOrder, useConfirmOrder, useCancelOrder
│   ├── lib/
│   │   ├── api.ts                # Axios instance with JWT interceptor + refresh logic
│   │   ├── apiCalls.ts           # Typed API call functions (authApi, listingsApi, ordersApi, etc.)
│   │   └── queryClient.ts        # React Query client (2-min stale time, 1 retry)
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── VerifyPage.tsx
│   │   │   └── SetPinPage.tsx
│   │   ├── HomePage.tsx          # Overview + live dashboard summary
│   │   ├── MarketplacePage.tsx   # Listing browse + order modal
│   │   ├── ListingsPage.tsx      # Farmer listing management + create form
│   │   ├── OrdersPage.tsx        # Order history + detail modal
│   │   └── ProfilePage.tsx       # Account info + logout
│   ├── schemas/
│   │   └── index.ts              # Zod schemas: register, verifyOtp, setPin, login, createListing, placeOrder
│   ├── store/
│   │   └── auth.store.ts         # Zustand auth store (user, accessToken, role, persist)
│   ├── App.css                   # Full design system CSS
│   ├── App.tsx                   # Root layout (sidebar, topbar, routes)
│   ├── content.ts                # Static content: stats, roles, workflows, listings
│   ├── index.css                 # Global reset + Poppins font import
│   └── main.tsx                  # React root mount
├── docs/
│   ├── FRONTEND_SPEC.md.pdf      # Frontend specification document
│   └── VegeLink_Ghana_Design_System.docx
├── index.html
├── package.json
├── vite.config.ts                # Vite config + /api proxy to localhost:3000
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── .oxlintrc.json                # Oxlint rules (React hooks, export components)
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Backend running at `http://localhost:3000` (see [backend README](../backend/README.md))

### 1. Install dependencies

```bash
cd GDSS-PSInno-AgriTech/web
npm install
```

### 2. Start the dev server

```bash
npm run dev
```

Opens at `http://localhost:5173`. All `/api` requests are proxied to `http://localhost:3000`.

### 3. Build for production

```bash
npm run build
# Output in dist/
```

### 4. Preview production build

```bash
npm run preview
```

### 5. Lint

```bash
npm run lint
```

---

## Environment Variables

The Vite dev server proxy handles API routing in development — no `.env` file is required for local development.

For production deployments, set the following in your hosting environment:

```bash
VITE_API_URL=https://vegelink-api.onrender.com/api/v1
```

If `VITE_API_URL` is not set, the Axios instance falls back to `http://localhost:3000/api/v1`.

> **Note:** The Vite proxy in `vite.config.ts` only applies during `npm run dev`. Production builds must point directly at the backend URL via `VITE_API_URL`.

---

## Routing

All routes are declared in `App.tsx` using React Router v7.

| Path | Page | Auth Required | Notes |
|---|---|---|---|
| `/` | `HomePage` | No | Role-adaptive content |
| `/marketplace` | `MarketplacePage` | No | Order placement requires buyer role |
| `/listings` | `ListingsPage` | Yes | Farmer role only |
| `/orders` | `OrdersPage` | Yes | All authenticated roles |
| `/profile` | `ProfilePage` | No | Shows guest state if unauthenticated |
| `/auth/login` | `LoginPage` | Redirect if auth | |
| `/auth/register` | `RegisterPage` | Redirect if auth | |
| `/auth/verify` | `VerifyPage` | Redirect if auth | Requires `pendingPhone` in store |
| `/auth/set-pin` | `SetPinPage` | Redirect if auth | Requires `registrationToken` in store |

### Route Guards

- `RequireAuth` — redirects to `/auth/login` if `isAuthenticated` is false
- `RedirectIfAuth` — redirects to `/` if already authenticated (wraps all auth routes)

### Role-Based Navigation

The sidebar nav filters items based on the authenticated user's role:

```
Farmer      → Overview | My Listings | Orders | Profile
Buyer       → Overview | Marketplace | Orders | Profile
Transporter → Overview | Orders | Profile
Agent       → Overview | Orders | Profile
Guest       → Overview | Marketplace | Profile
```

---

## Component Library

### `components/ui/Feedback.tsx`

| Component | Props | Purpose |
|---|---|---|
| `Spinner` | — | Centered loading indicator |
| `ErrorAlert` | `message: string` | Red-tinted error banner |
| `EmptyState` | `message: string` | Dashed-border empty content placeholder |
| `StatusBadge` | `status: string` | Pill badge with status-mapped colors |

`StatusBadge` color map:

| Status | Background | Text |
|---|---|---|
| `active` / `live` / `delivered` / `confirmed` | Mint green | Forest green |
| `pending` | Amber tint | Amber dark |
| `in_transit` | Sage tint | Forest green |
| `cancelled` | Red tint | Red |
| `sold` / `draft` | Grey tint | Dark grey |

### `components/ui/Field.tsx`

Controlled input with label, error display, and dark mode support. Accepts all standard `InputHTMLAttributes` plus:

| Prop | Type | Purpose |
|---|---|---|
| `label` | `string` | Field label text |
| `error` | `FieldError` | React Hook Form error object |
| `dark` | `boolean` | White text + transparent bg for dark card contexts |

### `components/Icon.tsx`

SVG icon component. Available icons: `leaf`, `truck`, `shopping`, `shield`, `phone`, `spark`, `pin`, `bag`, `user`, `clock`, `map`.

```tsx
<Icon name="leaf" />
```

---

## State Management

### Auth Store (`store/auth.store.ts`)

Zustand store with `persist` middleware. Persisted to `localStorage` under the key `vegelink-auth`.

| Field | Type | Purpose |
|---|---|---|
| `user` | `AuthUser \| null` | `{ id, phone, role }` |
| `accessToken` | `string \| null` | JWT access token for API requests |
| `registrationToken` | `string \| null` | Short-lived token from OTP verify (not persisted) |
| `pendingPhone` | `string \| null` | Phone in progress during registration (not persisted) |
| `isAuthenticated` | `boolean` | Derived from user presence |

| Action | Purpose |
|---|---|
| `setAuth(user, accessToken)` | Called on login and set-pin success |
| `setAccessToken(token)` | Called by Axios interceptor on token refresh |
| `setRegistrationToken(token, phone)` | Called after OTP verify |
| `clearAuth()` | Called on logout |

Only `user` and `accessToken` are persisted — `registrationToken` and `pendingPhone` are session-only.

### React Query

Server state managed by TanStack React Query with these defaults:

```typescript
{
  staleTime: 1000 * 60 * 2,   // 2 minutes
  retry: 1,
  refetchOnWindowFocus: false,
}
```

---

## Styling

The web app uses a **plain CSS design system** defined in `App.css`. No CSS-in-JS, no utility framework at runtime.

### Design Tokens

| Token | Value | Usage |
|---|---|---|
| Forest Green | `#264123` | Primary buttons, headings, brand |
| Fresh Mint | `#D6FFCD` | Accents, badges, active states |
| Dark Text | `#1F2937` | Page headings |
| Body Text | `#374151` | Body copy, descriptions |
| Muted Text | `#6B7280` | Labels, metadata |
| Light BG | `#F8FAF5` | Page background |
| Border | `#E5E7EB` | Card borders, dividers |
| Danger | `#EF4444` | Destructive actions, error states |
| Warning | `#F59E0B` | Pending status |

### Border Radii

| Context | Value |
|---|---|
| Buttons, inputs, nav items | `6px` |
| Cards, panels | `12px` |
| Pills, badges | `999px` |

### Key CSS Classes

| Class | Purpose |
|---|---|
| `.app-shell` | Root two-column grid (sidebar + content) |
| `.sidebar` | Dark green sticky sidebar |
| `.content` | Main scrollable content area |
| `.section-card` | White card with border and shadow |
| `.accent-card` | Dark green card (used in auth forms) |
| `.primary-button` | Forest green filled button |
| `.secondary-button` | Transparent button with green border |
| `.listing-card` | Produce listing card |
| `.workflow-step` | Numbered step row |
| `.status-pill` | Mint green info pill |
| `.page-hero` | Full-width page header block |

---

## Auth Flow

The registration flow is a strict 3-step sequence enforced by both the frontend and backend:

```
Step 1 — POST /auth/register
  → Phone + name + role submitted
  → Backend sends OTP via Arkesel SMS
  → pendingPhone stored in Zustand (not persisted)
  → Redirect to /auth/verify

Step 2 — POST /auth/verify-otp
  → 6-digit OTP submitted
  → Backend returns short-lived registration_token (JWT, 5-min expiry)
  → registrationToken stored in Zustand (not persisted)
  → Redirect to /auth/set-pin

Step 3 — POST /auth/set-pin
  → PIN submitted with registration_token in Authorization header
  → Backend hashes PIN, activates account, returns accessToken + refreshToken
  → setAuth() called, redirect to /
```

Login flow:

```
POST /auth/login
  → Phone + PIN submitted
  → Backend validates, returns accessToken + sets HttpOnly refresh cookie
  → setAuth() called, redirect to /
```

Token refresh:

```
Axios 401 interceptor → POST /auth/refresh (sends HttpOnly cookie automatically)
  → New accessToken returned → setAccessToken() called → original request retried
  → If refresh fails → clearAuth() → redirect to /auth/login
```

---

## API Integration

### Axios Instance (`lib/api.ts`)

- Base URL: `VITE_API_URL` or `http://localhost:3000/api/v1`
- `withCredentials: true` — sends HttpOnly refresh cookie on every request
- Request interceptor: injects `Authorization: Bearer <accessToken>` from Zustand
- Response interceptor: handles 401 → refresh → retry

### API Call Modules (`lib/apiCalls.ts`)

| Module | Functions |
|---|---|
| `authApi` | `register`, `verifyOtp`, `setPin`, `login`, `refresh`, `logout`, `resendOtp` |
| `listingsApi` | `getMyListings`, `getAll`, `getById`, `create`, `update`, `delete` |
| `ordersApi` | `getMyOrders`, `getById`, `place`, `confirm`, `cancel` |
| `transportApi` | `getJobs`, `accept`, `updateStatus` |
| `usersApi` | `getProfile`, `updateProfile` |

### Validation Schemas (`schemas/index.ts`)

All form data is validated with Zod before submission. Schemas mirror the backend's Zod schemas exactly.

| Schema | Used By |
|---|---|
| `registerSchema` | `RegisterPage` |
| `verifyOtpSchema` | `VerifyPage` |
| `setPinSchema` | `SetPinPage` |
| `loginSchema` | `LoginPage` |
| `createListingSchema` | `ListingsPage` create form |
| `placeOrderSchema` | `MarketplacePage` order modal |

---

## Testing

```bash
npm run lint        # Oxlint — React hooks + TypeScript rules
npm run build       # TypeScript compile check + Vite production build
npm run preview     # Serve production build locally
```

Manual testing checklist:

- [ ] Register → OTP → Set PIN → land on Overview as correct role
- [ ] Login with existing account → correct role-adaptive nav
- [ ] Farmer: create listing → appears in My Listings
- [ ] Buyer: browse marketplace → place order → appears in Orders
- [ ] Farmer: confirm order from Orders page
- [ ] Logout → session cleared → redirected to login
- [ ] Refresh page → session restored from localStorage

---

## Development Timeline

**Challenge Period: 29 June – 10 July 2026**

| Day | Date | Web Focus | End-of-Day Target |
|---|---|---|---|
| 1 | 29 Jun | Project scaffold + Auth pages | Vite project live. Login, register, OTP, set-pin pages wired to backend. |
| 2 | 30 Jun | Layout + Listings page | Sidebar layout, role-based nav, farmer listings CRUD working. |
| 3 | 1 Jul | Marketplace + Orders | Buyer browse, order placement, order detail modal live. |
| 4 | 2 Jul | Payments + profile | Paystack checkout flow. Profile page. Session management. |
| 5 | 3 Jul | Dashboard + polish | Live dashboard summary. Design system compliance pass. |
| 6 | 4 Jul | Agent screens + full flow | Agent order queue. All 4 roles tested end-to-end. |
| 7 | 5 Jul | Responsive + accessibility | Mobile nav, responsive breakpoints, touch targets. |
| 8 | 6 Jul | Full flow testing | All roles tested on real devices and browsers. |
| 9 | 7 Jul | Demo dry run + fixes | Three full demo walkthroughs. Fix issues found. |
| 10 | 8 Jul | Final deploy + documentation | Vercel deploy stable. README complete. Demo-ready. |
| 11 | 9 Jul | 🛌 Team rest | No work. |
| 12 | 10 Jul | 🛌 Team rest | No work. |

---

## Team & Contact

**Challenge:** GDSS-PSInno AgriTech Innovation Challenge 2026
**Organised by:** Ghana Data Science Summit (GDSS)
**Sponsored by:** GIZ / PSInno Programme
**Challenge contact:** <programs@datasciencenet.org>

**Prize Pool:**

- 🥇 1st Prize: GHS 10,000
- 🥈 2nd Prize: GHS 7,000
- 🥉 3rd Prize: GHS 5,000

**Final Presentation & Judging:** 24 July 2026

---

<div align="center">

**VegeLink Ghana Web** — Built for Abena's farm in Ejisu. Ready for Kwame's kitchen in Kumasi.

*Connecting Ghana's farms to Ghana's tables — from your browser.*

</div>
