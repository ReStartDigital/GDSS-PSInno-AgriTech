# 📱 VegeLink Ghana — Mobile App

> **React Native Client for the Farmer-to-Buyer Digital Marketplace**  
> GDSS-PSInno AgriTech Innovation Challenge 2026 — Greater Accra Vegetable Belt

[![Challenge](https://img.shields.io/badge/Challenge-GDSS--PSInno%202026-2E7D32?style=flat-square)](https://datasciencenet.org)
[![Stack](https://img.shields.io/badge/Stack-React%20Native%20%7C%20Expo%2057%20%7C%20TypeScript-0D47A1?style=flat-square)](#tech-stack)
[![License](https://img.shields.io/badge/License-Internal%20Only-red?style=flat-square)](#)
[![Status](https://img.shields.io/badge/Status-In%20Development-orange?style=flat-square)](#development-timeline)

---

## Table of Contents

- [What is This?](#what-is-this)
- [How It Fits](#how-it-fits)
- [Who It Serves](#who-it-serves)
- [Core Screens](#core-screens)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Navigation & Routing](#navigation--routing)
- [Component Library](#component-library)
- [State Management](#state-management)
- [Shared Package](#shared-package)
- [Styling](#styling)
- [Native Permissions](#native-permissions)
- [Accessibility](#accessibility)
- [Testing](#testing)
- [Development Timeline](#development-timeline)
- [Team & Contact](#team--contact)

---

## What is This?

This is the **React Native mobile client** for VegeLink Ghana — a cross-platform digital marketplace that directly connects smallholder vegetable farmers with buyers, transporters, and field agents in the Greater Accra Vegetable Belt.

The mobile app is the primary interface for **farmers**, **buyers**, **transporters**, and **agents** — the people who interact with VegeLink daily in the field. It runs on Android and iOS, targeting low-end Android devices common among Ghanaian smallholder farmers.

```
Farmer opens app → Lists produce with camera photo + GPS location
Buyer opens app  → Browses marketplace → Places order → Pays via MoMo
Transporter      → Sees nearby jobs → Accepts delivery → Updates status
Agent            → Manages clients → Confirms orders on behalf of farmers
```

---

## How It Fits

VegeLink is a monorepo with three main components. This README covers the **mobile** directory.

```
GDSS-PSInno-AgriTech/
├── backend/              ← Express API, PostgreSQL, Paystack, Arkesel SMS
├── mobile/               ← This directory — React Native (Expo) client
│   └── packages/shared/  ← Shared types, stores (Zustand auth state)
└── ...
```

The mobile app communicates with the backend via REST API (`/api/v1`) and real-time WebSocket (Socket.io) for delivery tracking and messaging.

```
Mobile App ──── REST API ────── Backend ──── PostgreSQL + PostGIS
    │                              │
    └───── Socket.io ──────────────┘         Redis (cache, rate limits)
                                             Paystack (payments)
                                             Arkesel (SMS)
                                             Cloudinary (images)
```

---

## Who It Serves

The mobile app presents a **role-adaptive interface** — the same app binary, different tabs and screens based on who logs in.

| Role | What They See | Key Actions |
|---|---|---|
| **Farmer** | Home, My Listings, Orders, Profile | List produce (camera + GPS), manage orders, view earnings |
| **Buyer** | Home, Marketplace, Orders, Profile | Browse listings, place orders, pay via MoMo, track delivery |
| **Transporter** | Home, Jobs, Orders, Profile | View nearby transport jobs, accept deliveries, update status |
| **Agent** | Home, Clients, Pending Orders, Profile | Register farmers, create listings on their behalf, confirm orders |

---

## Core Screens

### 🔐 Authentication

- **Login** — Phone-only entry. No email required. Brand introduction with "Get Started" CTA.
- **Register** — Phone number + role selection. Matches the backend's phone-only registration flow.
- **OTP Verify** — SMS OTP input. Works with Arkesel backend delivery. Demo mode available for development.

### 🏠 Home (All Roles)

Role-aware dashboard. Entry point after authentication.

### 🛒 Marketplace (Buyer)

- Browse all available produce listings
- FlatList with listing cards showing crop name, price per kg, and farmer info
- Map view for nearby listings (react-native-maps)

### 🌿 My Listings (Farmer)

- View all farmer's own produce listings
- Create new listing with camera image capture + GPS location auto-fill
- Edit and manage listing status

### 📦 Orders (All Roles)

- Order detail view with full lifecycle status
- Order history and tracking
- Role-specific actions (farmer: confirm/decline, buyer: pay, transporter: update status)

### 🚛 Jobs (Transporter)

- Nearby transport job board
- Accept/decline transport requests
- Live delivery tracking map (requires development build for full native map)

### 👤 Agent

- **Clients** — List of farmers managed by this agent
- **Pending Orders** — Orders awaiting agent confirmation on behalf of farmers

### 🔧 Profile (All Roles)

- User info display (name, phone, role)
- Logout with auth state clearing

---

## Tech Stack

### Why These Choices?

| Layer | Technology | Why |
|---|---|---|
| **Framework** | React Native 0.86 + Expo SDK 57 | Single codebase for Android + iOS. Expo managed workflow eliminates native build tooling. Runs on low-end Android devices. |
| **Language** | TypeScript 6 (strict) | Compile-time safety, shared types with backend, IDE intellisense. Strict mode catches null/undefined bugs early. |
| **Routing** | Expo Router (file-based) | File-system routing with typed routes. Layouts, groups, and dynamic segments like Next.js — but for mobile. |
| **Styling** | NativeWind 4 + Tailwind CSS 3 | Utility-first styling compiled to native StyleSheet. Same mental model as web Tailwind. Zero runtime overhead. |
| **State** | Zustand 5 | Minimal boilerplate global state. Shared auth store with `@vegelink/shared` package. No Redux ceremony. |
| **Data Fetching** | TanStack React Query 5 | Automatic caching (2-min stale time), retry logic, and cache invalidation. Handles loading/error states. |
| **HTTP** | Axios | Interceptors for JWT token injection and refresh. Cleaner error handling than fetch. |
| **Forms** | React Hook Form 7 + Zod 4 | Uncontrolled form performance. Zod schemas shared with backend for runtime + compile-time validation. |
| **Maps** | react-native-maps | Native MapView for location selection and delivery tracking. |
| **Location** | expo-location | GPS auto-fill for farm coordinates on listing creation. |
| **Camera** | expo-image-picker | Produce photo capture for listings. |
| **Secure Storage** | expo-secure-store | JWT tokens stored in platform keychain (iOS) / keystore (Android). Not AsyncStorage. |
| **Push Notifications** | expo-notifications | Order updates, delivery alerts. Supplements Arkesel SMS for users with internet. |
| **Animations** | react-native-reanimated 4 | Gesture-driven animations and smooth transitions. 60fps on low-end devices. |
| **Gestures** | react-native-gesture-handler | Bottom sheets, swipe actions, pull-to-refresh. |
| **Real-time** | socket.io-client | Live delivery tracking updates via WebSocket connection to backend. |

> **Why not Flutter?** React Native shares hooks, validation logic (Zod schemas), and API layer patterns with the React.js web app. Flutter requires a separate Dart codebase — two languages under a 10-day deadline.  
> **Why Expo managed workflow?** Bare React Native requires Xcode + Android Studio setup, Gradle configuration, and CocoaPods. Expo eliminates all of this — `npx expo start` and scan a QR code. Post-challenge migration to bare workflow is straightforward via `npx expo prebuild`.  
> **Why NativeWind over StyleSheet?** NativeWind compiles Tailwind classes to native StyleSheet objects at build time — same performance as hand-written styles, but 3x faster to write. The team already knows Tailwind from the web app.

---

## Architecture

The mobile app uses **feature-based file routing** with a shared component library and centralised state management.

```
┌─────────────────────────────────────────────────────┐
│               Expo Router (file-based)               │  ← URL-driven navigation
├─────────────────────────────────────────────────────┤
│                    Screens (app/)                     │  ← Route components, minimal logic
├─────────────────────────────────────────────────────┤
│                  Components (components/)             │  ← Reusable UI, feature-specific
├─────────────────────────────────────────────────────┤
│                 State (Zustand stores)                │  ← Auth, UI state
├─────────────────────────────────────────────────────┤
│              Data Layer (React Query + Axios)         │  ← API calls, caching, mutations
├─────────────────────────────────────────────────────┤
│                 Shared (@vegelink/shared)             │  ← Types, auth store, constants
└─────────────────────────────────────────────────────┘
```

### Request Lifecycle

Every API call follows this path:

```
User action → React Query hook → Axios instance (JWT interceptor)
            → Backend REST API → Response cached by React Query
            → UI re-renders with new data
```

### Auth Flow

```
App launch → Check Zustand auth state
           → Authenticated?  → /(tabs)/home
           → Not authenticated? → /(auth)/login
                                → Register (phone + role)
                                → OTP verify (Arkesel SMS)
                                → Store JWT in SecureStore + Zustand
                                → Redirect to /(tabs)/home
```

---

## Project Structure

```
mobile/
├── app/                          # Expo Router — file-based routing
│   ├── _layout.tsx               # Root layout: SafeArea + QueryClient providers
│   ├── index.tsx                 # Entry redirect: auth check → tabs or login
│   ├── (auth)/                   # Auth group (unauthenticated users)
│   │   ├── _layout.tsx           # Auth stack layout
│   │   ├── login.tsx             # Phone login + brand landing
│   │   ├── register.tsx          # Phone + role registration
│   │   └── verify.tsx            # OTP verification screen
│   ├── (tabs)/                   # Main tab group (authenticated users)
│   │   ├── _layout.tsx           # Tab bar with role-based visibility
│   │   ├── home.tsx              # Dashboard (all roles)
│   │   ├── marketplace.tsx       # Browse listings (buyer only)
│   │   ├── listings.tsx          # My listings (farmer only)
│   │   ├── jobs.tsx              # Transport jobs (transporter only)
│   │   ├── orders.tsx            # Order history (all roles)
│   │   └── profile.tsx           # User profile + logout
│   ├── listings/                 # Listing detail routes
│   │   ├── [id].tsx              # Listing detail screen
│   │   ├── [id]/                 # Nested listing actions
│   │   └── new.tsx               # Create new listing (camera + GPS)
│   ├── orders/                   # Order detail routes
│   │   ├── [id].tsx              # Order detail screen
│   │   └── [id]/                 # Nested order actions
│   ├── transport/                # Transport detail routes
│   │   └── [id]/                 # Delivery tracking + status updates
│   └── agent/                    # Agent-specific routes
│       ├── clients.tsx           # Agent's registered farmers
│       └── pending.tsx           # Orders awaiting agent confirmation
├── components/                   # Reusable UI components
│   ├── common/                   # Cross-feature components
│   │   ├── MoMoSelector.tsx      # MTN MoMo / Telecel Cash / AT Money picker
│   │   └── OTPInput.tsx          # OTP digit input field
│   ├── layout/                   # App-wide layout components
│   │   ├── ScreenHeader.tsx      # Consistent screen header bar
│   │   └── BottomSheet.tsx       # Reusable bottom sheet (gesture-driven)
│   ├── listings/                 # Listing-specific components
│   │   ├── CameraImagePicker.tsx # Camera capture for produce photos
│   │   └── GPSLocationButton.tsx # Auto-fill GPS coordinates
│   ├── marketplace/              # Marketplace-specific components
│   │   ├── ListingFlatList.tsx   # Scrollable listing cards
│   │   └── MapScreen.tsx         # Map view for nearby listings
│   └── transport/                # Transport-specific components
│       └── LiveTrackingMap.tsx   # Real-time delivery map
├── packages/                     # Local packages
│   └── shared/                   # @vegelink/shared — shared with backend
│       ├── package.json          # Package manifest
│       ├── index.ts              # Barrel export
│       └── stores/
│           └── auth.store.ts     # Zustand auth store (user, token, role)
├── assets/                       # Static assets
│   ├── images/                   # App icons, splash screen
│   └── expo.icon/                # Expo-managed icon variants
├── app.json                      # Expo configuration (name, plugins, permissions)
├── babel.config.js               # Babel presets: expo + nativewind
├── metro.config.js               # Metro bundler: NativeWind + monorepo watchFolders
├── tailwind.config.js            # Tailwind CSS content paths + NativeWind preset
├── tsconfig.json                 # TypeScript: strict mode, path aliases (@/, @shared/)
├── global.css                    # Tailwind CSS entry point
├── package.json                  # Dependencies and scripts
└── .env                          # Environment variables (API URL, Socket URL)
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- [Expo Go](https://expo.dev/go) app on your Android/iOS device (for quick testing)
- Git

### 1. Clone and install

```bash
git clone https://github.com/your-org/GDSS-PSInno-AgriTech.git
cd GDSS-PSInno-AgriTech/mobile
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
# Fill in your backend API URL — see Environment Variables section below
```

### 3. Start the development server

```bash
npm start
# or
npx expo start
```

### 4. Run on device

| Method | Command | Best For |
|---|---|---|
| **Expo Go** (QR scan) | `npx expo start` | Quick UI testing, no native modules |
| **Android emulator** | `npx expo start --android` | Full testing with native features |
| **iOS simulator** | `npx expo start --ios` | macOS only, full testing |
| **Development build** | `npx expo run:android` | Native modules (maps, notifications) |

> ⚠️ **Live map tracking** and **push notifications** require a [development build](https://docs.expo.dev/develop/development-builds/introduction/), not Expo Go. Run `npx expo prebuild` then `npx expo run:android` for full native functionality.

### 5. Ensure backend is running

The mobile app expects the backend API at the URL configured in `.env`. See the [backend README](../backend/README.md) for setup instructions.

---

## Environment Variables

All required variables are stored in `.env`. Never commit secrets.

```bash
# ── API ─────────────────────────────────────────────────────────────────────
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1    # Backend REST API base URL
EXPO_PUBLIC_SOCKET_URL=http://localhost:3000         # Socket.io server for real-time
```

> **`EXPO_PUBLIC_` prefix** — Required by Expo to expose environment variables to the client bundle. Variables without this prefix are not accessible in app code.

### Local Development

| Backend Running On | API URL | Notes |
|---|---|---|
| Same machine (emulator) | `http://10.0.2.2:3000/api/v1` | Android emulator localhost alias |
| Same machine (iOS sim) | `http://localhost:3000/api/v1` | iOS simulator uses host localhost |
| Physical device (LAN) | `http://192.168.x.x:3000/api/v1` | Use your machine's LAN IP |
| Deployed backend | `https://vegelink-api.onrender.com/api/v1` | Production/staging URL |

---

## Navigation & Routing

VegeLink uses [Expo Router](https://docs.expo.dev/router/introduction/) — file-system based routing with typed routes.

### Route Groups

| Group | Path | Purpose |
|---|---|---|
| `(auth)` | `/(auth)/login`, `/(auth)/register`, `/(auth)/verify` | Unauthenticated screens. No tab bar. |
| `(tabs)` | `/(tabs)/home`, `/(tabs)/marketplace`, etc. | Main app. Tab bar visible. Role-filtered tabs. |
| `listings` | `/listings/[id]`, `/listings/new` | Listing detail and creation. Stack navigation. |
| `orders` | `/orders/[id]` | Order detail. Stack navigation. |
| `transport` | `/transport/[id]` | Delivery tracking. Stack navigation. |
| `agent` | `/agent/clients`, `/agent/pending` | Agent-specific screens. |

### Role-Based Tab Visibility

The tab bar dynamically shows/hides tabs based on the authenticated user's role:

```
Farmer      → Home | My Listings | Orders | Profile
Buyer       → Home | Marketplace | Orders | Profile
Transporter → Home | Jobs        | Orders | Profile
Agent       → Home |             | Orders | Profile  (+ agent routes via navigation)
```

This is implemented in `(tabs)/_layout.tsx` using Expo Router's `href: null` to hide tabs:

```tsx
<Tabs.Screen
  name="marketplace"
  options={{
    title: "Marketplace",
    href: role === "buyer" ? "/(tabs)/marketplace" : null,
  }}
/>
```

---

## Component Library

### Common Components

| Component | Purpose |
|---|---|
| `MoMoSelector` | Ghana mobile money provider picker (MTN MoMo, Telecel Cash, AT Money) |
| `OTPInput` | SMS OTP digit input for phone verification |

### Layout Components

| Component | Purpose |
|---|---|
| `ScreenHeader` | Consistent header bar across all screens |
| `BottomSheet` | Gesture-driven bottom sheet (react-native-gesture-handler + reanimated) |

### Listing Components

| Component | Purpose |
|---|---|
| `CameraImagePicker` | Camera capture for produce photos (expo-image-picker) |
| `GPSLocationButton` | Auto-fill farm GPS coordinates (expo-location) |

### Marketplace Components

| Component | Purpose |
|---|---|
| `ListingFlatList` | Scrollable produce listing cards with crop name and price |
| `MapScreen` | Map view showing nearby listings (react-native-maps) |

### Transport Components

| Component | Purpose |
|---|---|
| `LiveTrackingMap` | Real-time delivery tracking map (Socket.io + react-native-maps) |

---

## State Management

### Zustand Stores

| Store | Location | State |
|---|---|---|
| `useAuthStore` | `packages/shared/stores/auth.store.ts` | `user`, `accessToken`, `isAuthenticated`, `setAuth()`, `clearAuth()` |

### React Query

Server state is managed by TanStack React Query with the following defaults:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,  // 2 minutes — reduces network calls on low bandwidth
      retry: 1,                   // Single retry — fail fast on flaky connections
    },
  },
});
```

> **Why 2-minute stale time?** Ghana's mobile networks (MTN, Telecel, AT) can be intermittent. A 2-minute cache window reduces unnecessary API calls while keeping data reasonably fresh. Listings and orders don't change second-by-second.

---

## Shared Package

The `@vegelink/shared` package lives at `packages/shared/` and contains code shared between the mobile app and (potentially) the web frontend.

### Current Exports

| Export | Type | Purpose |
|---|---|---|
| `useAuthStore` | Zustand store | Auth state: user object, JWT token, login/logout |
| `UserRole` | TypeScript type | `"farmer" \| "buyer" \| "transporter" \| "agent" \| "admin"` |
| `AuthUser` | TypeScript interface | User shape: `id`, `phone`, `role`, `fullName` |

### Path Aliases

The shared package is accessible via the `@shared/` alias configured in `tsconfig.json`:

```typescript
// In any mobile screen or component:
import { useAuthStore } from "@shared/stores/auth.store";
```

The `@/` alias maps to the mobile root for local imports:

```typescript
import { ScreenHeader } from "@/components/layout/ScreenHeader";
```

---

## Styling

VegeLink mobile uses **NativeWind 4** — Tailwind CSS compiled to React Native StyleSheet objects at build time.

### Configuration

| File | Purpose |
|---|---|
| `tailwind.config.js` | Content paths (`app/`, `components/`), NativeWind preset |
| `babel.config.js` | `babel-preset-expo` with NativeWind JSX import source |
| `metro.config.js` | Metro bundler integration via `withNativeWind` |
| `global.css` | Tailwind CSS entry point (imported in root `_layout.tsx`) |

### Design Language

| Token | Value | Usage |
|---|---|---|
| Primary | `green-800` / `green-900` | Buttons, headers, brand text |
| Background | `white` | Screen backgrounds |
| Text primary | `green-900` | Headings, important labels |
| Text secondary | `gray-600` / `gray-700` | Body text, descriptions |
| Text muted | `gray-500` | Metadata, timestamps |
| Accent | `red-700` | Destructive actions (logout) |
| Border | `gray-200` / `gray-300` | Card borders, dividers |
| Active state | `green-50` + `green-800` border | Selected MoMo provider, active filters |

### Usage Example

```tsx
// NativeWind — compiled to native StyleSheet at build time
<View className="flex-1 items-center justify-center bg-white px-6">
  <Text className="text-3xl font-bold text-green-900">VegeLink Ghana</Text>
</View>
```

---

## Native Permissions

Configured in `app.json` under `expo.plugins`:

| Permission | Plugin | Prompt Shown to User |
|---|---|---|
| **Location** | `expo-location` | "VegeLink needs your location to show nearby farmers and transport jobs." |
| **Camera / Photos** | `expo-image-picker` | "VegeLink needs access to your photos to upload produce images." |
| **Push Notifications** | `expo-notifications` | Standard OS notification prompt |
| **Secure Storage** | `expo-secure-store` | No prompt — uses platform keychain/keystore silently |

---

## Accessibility

VegeLink mobile is built for users with **no smartphone experience, low literacy, and basic Android devices**.

| Requirement | Implementation |
|---|---|
| No email required | Phone-only OTP registration. No email field anywhere in the app. |
| Large touch targets | All `Pressable` components use minimum `py-3` (48px+) hit area |
| Plain language | Short labels: "Get Started", "Verify", "Log Out". No jargon. |
| Icon + text everywhere | No icon-only buttons. All tappable elements have visible text labels. |
| Role-adaptive UI | Tab bar only shows relevant tabs. Farmers never see buyer-only screens. |
| Low-bandwidth images | Cloudinary thumbnail URLs on listing cards. Full resolution on detail only. |
| Offline-aware | React Query caching serves stale data when network is unavailable. |
| SMS fallback | All critical events (orders, payments, delivery) trigger backend SMS via Arkesel — no internet needed. |
| Low-end device support | React Native 0.86 Hermes engine. Reanimated 4 runs animations on UI thread. |
| Portrait lock | `"orientation": "portrait"` in `app.json` — no accidental landscape confusion. |

---

## Testing

### Strategy

```
Unit Tests (Jest)           → Components, stores, utilities — no device
Integration Tests (Detox)   → Full screen flows on emulator
Manual Testing              → Expo Go on physical Android device
```

### Commands

```bash
npm start                   # Start Expo dev server
npm run android             # Start on Android emulator
npm run ios                 # Start on iOS simulator (macOS only)
npm run web                 # Start web version (limited support)
npm run lint                # ESLint with Expo rules
npm run reset-project       # Reset to blank app directory
```

---

## Development Timeline

**Challenge Period: 29 June – 10 July 2026**

The mobile app development runs in parallel with the backend. API endpoints are consumed as they become available.

| Day | Date | Mobile Focus | End-of-Day Target |
|---|---|---|---|
| 1 | 29 Jun | Project scaffold + Auth screens | Expo project created. Login, register, OTP screens wired. |
| 2 | 30 Jun | Tab navigation + Listing screens | Role-based tabs working. Listing CRUD screens connected to API. |
| 3 | 1 Jul | Marketplace + Orders | Buyer browse, order placement, order detail screens live. |
| 4 | 2 Jul | Payments + MoMo integration | Paystack mobile checkout flow. MoMo provider selector. |
| 5 | 3 Jul | Transport + Maps | Transporter job board. Map view. Live delivery tracking. |
| 6 | 4 Jul | Agent screens + Polish | Agent client management. Pending order queue. UI polish pass. |
| 7 | 5 Jul | Camera + GPS + Notifications | Image picker, GPS auto-fill, push notifications working. |
| 8 | 6 Jul | Full flow testing | All 5 user roles tested end-to-end on physical device. |
| 9 | 7 Jul | Demo dry run + fixes | Three full demo walkthroughs. Fix issues found. |
| 10 | 8 Jul | Final deploy + documentation | EAS build submitted. README complete. Demo-ready. |
| 11 | 9 Jul | 🛌 Team rest | No work. |
| 12 | 10 Jul | 🛌 Team rest | No work. |

> The last two days are **non-negotiable rest time**. All demo-ready work must be complete by end of Day 10. The team performs better in the final judging presentation (24 July) when well-rested.

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

**VegeLink Ghana Mobile** — Built for Abena's farm in Dawhenya. Ready for Kwame's kitchen in East Legon.

*Connecting Ghana's farms to Ghana's tables — from your pocket.*

</div>
