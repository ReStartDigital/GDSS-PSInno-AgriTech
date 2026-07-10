# 🌿📱 VegeLink Ghana — Farmer-to-Buyer Digital Marketplace

> **Cross-Platform Digital Marketplace for the Greater Accra and Kumasi Vegetable Belts**  
> GDSS-PSInno AgriTech Innovation Challenge 2026

[![Challenge](https://img.shields.io/badge/Challenge-GDSS--PSInno%202026-2E7D32?style=flat-square)](https://datasciencenet.org)
[![Backend Stack](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%20%7C%20PostgreSQL%20%7C%20Redis-0D47A1?style=flat-square)](#backend-api)
[![Web Stack](https://img.shields.io/badge/Web-React%2019%20%7C%20Vite%208%20%7C%20Plain%20CSS-827717?style=flat-square)](#web-app)
[![Mobile Stack](https://img.shields.io/badge/Mobile-React%20Native%20%7C%20Expo%2057%20%7C%20NativeWind-00695C?style=flat-square)](#mobile-app)
[![Status](https://img.shields.io/badge/Status-In%20Development-orange?style=flat-square)](#development-timeline)

---

## Table of Contents

- [What is VegeLink?](#what-is-vegelink)
- [Monorepo Architecture](#monorepo-architecture)
- [User Roles & Access Matrix](#user-roles--access-matrix)
- [Key Innovations & Workflows](#key-innovations--workflows)
  - [1. Farmer Order Confirmation System](#1-farmer-order-confirmation-system)
  - [2. Delivery OTP Verification](#2-delivery-otp-verification)
  - [3. Smart Packaging Module](#3-smart-packaging-module)
- [Technology Stacks](#technology-stacks)
  - [Backend API](#backend-api)
  - [Web App](#web-app)
  - [Mobile App](#mobile-app)
  - [Shared Package](#shared-package)
- [Monorepo Structure](#monorepo-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Step 1: Running the Backend API](#step-1-running-the-backend-api)
  - [Step 2: Running the Web App](#step-2-running-the-web-app)
  - [Step 3: Running the Mobile App](#step-3-running-the-mobile-app)
- [Environment Variables Guide](#environment-variables-guide)
- [Accessibility & Localization](#accessibility--localization)
- [Development Timeline](#development-timeline)
- [Team & Contact](#team--contact)

---

## What is VegeLink?

**VegeLink Ghana** is a comprehensive, cross-platform digital marketplace that directly connects smallholder vegetable farmers with buyers (retailers, restaurants, processors, and households) while integrating **logistics coordination** and a **smart packaging system** to reduce post-harvest losses.

Post-harvest losses cost Ghana **$1.9B–$3B annually**. VegeLink addresses the full produce journey (Listing → Negotiation/Order → Multi-mode Confirmation → Standardized Packaging → Geospatial Logistics → Delivery Verification → Paystack Payments) to increase farmer incomes and ensure fresher produce for buyers.

---

## Monorepo Architecture

VegeLink is structured as a monorepo containing three primary sub-projects and a local shared package:

```
                      ┌─────────────────────────────────┐
                      │            Web Client           │
                      │       (React 19 + Vite 8)       │
                      └────────────────┬────────────────┘
                                       │ REST API (/api/v1)
                                       ▼
┌──────────────────┐  REST API   ┌───────────┐   REST API    ┌─────────────────┐
│    Mobile App    ├────────────►│  Express  ├──────────────►│ PostgreSQL DB   │
│  (React Native)  │             │  Backend  │               │ (PostGIS enabled)│
│  (Expo SDK 57)   │◄───────────►│  Node.js  │               └─────────────────┘
└────────┬─────────┘  WebSockets └─────┬─────┘                        ▲
         │                             │                              │ TypeORM
         │                             ├─► Redis (Auth Blacklist)     │
         ▼                             ├─► Paystack (Mobile Money) ───┘
   ┌───────────┐                       ├─► Arkesel SMS Gateway (Inbound & Outbound)
   │  Shared   │                       └─► Cloudinary (Produce Images)
   │  Package  │
   │  Zustand  │
   └───────────┘
```

* **Backend API (`/backend`)**: Powerhouse running Express, PostgreSQL + PostGIS, and Redis. Integrates with Paystack for mobile money payments, Arkesel for offline SMS flows, and Cloudinary for media.
* **Web App (`/web`)**: A responsive browser client built using React 19, React Router v7, and a vanilla CSS design system. Designed for buyers, agents, and administrators.
* **Mobile App (`/mobile`)**: A cross-platform React Native client built with Expo 57, NativeWind v4, and Expo Router. Optimized for farmers, transporters, buyers, and agents operating in the field.
* **Shared Package (`/mobile/packages/shared`)**: Local dependency containing common models, type definitions, and Zustand store logic shared across frontend environments.

---

## User Roles & Access Matrix

VegeLink adapts its user interface based on the authenticated user's role:

| Role | Web Experience | Mobile App Experience | SMS / Offline Experience | Key Actions |
|---|---|---|---|---|
| **Farmer** | Overview, Listings, Orders, Profile | Home, Listings, Orders, Profile | Order alerts, interactive SMS confirmations, daily summaries | List crops (camera + GPS), accept orders, track earnings |
| **Buyer** | Overview, Marketplace, Orders, Profile | Home, Marketplace, Orders, Profile | Payment receipts, status SMS alerts | Browse crops, place orders, make Paystack MoMo payments |
| **Transporter** | Overview, Orders, Profile | Home, Jobs, Orders, Profile | Delivery OTP text message alerts | View nearby jobs, accept shipments, verify deliveries |
| **Agent** | Overview, Clients, Orders, Profile | Home, Clients, Orders, Profile | Digest notifications | Register offline farmers, manage listings and orders |
| **Admin** | Full Management & Analytics portals | *N/A (Uses Web Client)* | System logs and emergency alerts | User moderation, packaging catalog, disputes, metrics |

---

## Key Innovations & Workflows

### 1. Farmer Order Confirmation System

A major challenge in Ghanaian agriculture is that smallholder farmers may lack stable internet or smartphones. VegeLink solves this with **four fallback confirmation modes** checked sequentially when an order is placed:

```
Order Placed
   │
   ├──► [Option 1] Trusted Buyer? ─────────► Auto-confirm instantly
   │
   ├──► [Option 2] Pre-Auth Terms Met? ────► Auto-confirm within limits
   │
   ├──► [Option 3] Agent Assigned? ────────► Route to Agent app portal
   │
   └──► [Option 4] Default (All Users) ────► Send interactive SMS reply request
```

* **Option 1: Trusted Buyer**: After 3 successful completions, a farmer can trust a buyer. Future orders within quantity limits auto-confirm.
* **Option 2: Pre-Authorisation**: Farmers specify quantity limits and price floors on listings. Matching orders auto-confirm instantly.
* **Option 3: Agent Proxy**: Field agents manage listings and confirm orders on behalf of offline/non-literate farmers.
* **Option 4: SMS Interactive Reply**: Default fallback. The system texts the farmer via Arkesel: `Reply YES-4829 to confirm or NO-4829 to decline`.

---

### 2. Delivery OTP Verification

Secure delivery completion uses an SMS OTP code sent directly to the buyer when a transporter updates a job to `in_transit`. Upon arrival, the transporter collects the OTP from the buyer and enters it into the mobile app, triggering a backend verification check to mark the order as `delivered` securely.

---

### 3. Smart Packaging Module

To combat mechanical damage during transport, the system matches crops to standardized packaging options (e.g., *Tomatoes* are matched with *Ventilated Crates*, while *Root Vegetables* use *Bulk Sacks*). The cost of recommended packaging is auto-calculated and added to the order invoice.

---

## Technology Stacks

### Backend API
* **Language & Runtime**: TypeScript, Node.js 20, Express 4
* **Database**: PostgreSQL 16 (with PostGIS extension) + TypeORM
* **Cache & Storage**: Redis (token revocation, OTP throttling, rate limiting)
* **Integrations**: Paystack API (Mobile Money / Cards), Arkesel SMS API (Ghana-specific routing), Cloudinary (optimized image storage)

### Web App
* **Framework & Build**: React 19 + Vite 8
* **Routing**: React Router v7 (nested layouts & role-based route guards)
* **Styling**: Plain CSS design system (custom variables, zero runtime overhead)
* **State & Querying**: Zustand 5 (persistent auth stores), TanStack React Query 5 (2-minute query caching)
* **Forms & Validation**: React Hook Form 7 + Zod 4

### Mobile App
* **Framework**: React Native 0.86 + Expo SDK 57 (managed workflow)
* **Routing**: Expo Router (file-system routing with strict typed navigation)
* **Styling**: NativeWind v4 (compiled Tailwind CSS for native platforms)
* **Hardware APIs**: `expo-location` (GPS listing autofill) & `expo-image-picker` (produce camera captures)
* **Storage**: `expo-secure-store` (keychain authentication tokens)
* **Real-time Updates**: Socket.io-client for live transport coordinates

### Shared Package
* **Location**: `mobile/packages/shared/`
* **Features**: Shares common user roles, type definitions, and the global Zustand auth store logic between native and web clients.

---

## Monorepo Structure

```
GDSS-PSInno-AgriTech/
├── backend/                   # Node.js + Express + PostgreSQL Backend
│   ├── src/                   # Source code (Clean Layered Architecture)
│   ├── tests/                 # E2E & Integration tests
│   └── docker-compose.yml     # PostGIS & Redis local containers
├── web/                       # React 19 + Vite Web Application
│   ├── src/                   # Source components, pages, hooks, and routing
│   └── public/                # Static SVGs, icons, and assets
├── mobile/                    # React Native + Expo Mobile Application
│   ├── app/                   # Expo Router screens (tabs, authentication)
│   ├── components/            # Native components (maps, bottom sheets)
│   └── packages/
│       └── shared/            # Shared Zustand state, TypeScript types
└── README.md                  # Root documentation (this file)
```

---

## Getting Started

### Prerequisites
* **Node.js**: Version 20.x or newer
* **Docker & Docker Compose**: For starting PostgreSQL and Redis
* **Expo Go App**: Downloaded on your iOS/Android device for mobile testing

---

### Step 1: Running the Backend API

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install package dependencies:
   ```bash
   npm install
   ```
3. Set up environment configuration:
   ```bash
   cp .env.example .env
   # Open .env and fill in variables (see Environment Variables section)
   ```
4. Generate the JWT RS256 signing keys:
   ```bash
   mkdir keys
   openssl genrsa -out keys/private.pem 2048
   openssl rsa -in keys/private.pem -pubout -out keys/public.pem
   ```
5. Start local PostGIS and Redis containers:
   ```bash
   docker-compose up -d
   ```
6. Run migrations and seed demo data:
   ```bash
   npm run migration:run
   npm run seed
   ```
7. Start the server:
   ```bash
   npm run dev
   # Server runs at http://localhost:3000
   # Swagger documentation available at http://localhost:3000/api/docs
   ```

---

### Step 2: Running the Web App

1. Navigate to the web directory:
   ```bash
   cd ../web
   ```
2. Install package dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   # Runs locally at http://localhost:5173
   # Proxy configuration automatically routes '/api/*' requests to port 3000
   ```

---

### Step 3: Running the Mobile App

1. Navigate to the mobile directory:
   ```bash
   cd ../mobile
   ```
2. Install package dependencies:
   ```bash
   npm install
   ```
3. Set up local environment variables:
   ```bash
   cp .env.example .env
   # Configure EXPO_PUBLIC_API_URL and EXPO_PUBLIC_SOCKET_URL
   ```
4. Start the Expo development server:
   ```bash
   npm start
   ```
5. Scan the QR code displayed in the terminal using your phone camera (iOS) or the Expo Go application (Android).
   * *For Android Emulators / iOS Simulators*: Press `a` or `i` in the terminal to boot the app directly in your virtual device.

---

## Environment Variables Guide

### Backend variables (`backend/.env`)
* `DATABASE_URL`: `postgres://vegelink:secret@localhost:5432/vegelink_dev`
* `REDIS_URL`: `redis://localhost:6379`
* `PAYSTACK_SECRET_KEY`: Paystack sandbox secret key
* `ARKESEL_API_KEY`: Arkesel gateway API Key
* `CLOUDINARY_URL`: Cloudinary API secret credentials URL

### Mobile variables (`mobile/.env`)
* `EXPO_PUBLIC_API_URL`: URL of the API gateway (e.g., `http://10.0.2.2:3000/api/v1` for Android emulator, or `http://localhost:3000/api/v1` for iOS simulator)
* `EXPO_PUBLIC_SOCKET_URL`: WebSocket gateway URL (`http://localhost:3000`)

### Web variables (`web/` environment)
* Vite handles proxy routing during local development automatically. For production builds, configure the `VITE_API_URL` environment variable to point to your live backend domain.

---

## Accessibility & Localization
* **No Email Required**: All authentication (web and mobile) is built on phone numbers and SMS verification codes.
* **Optimized Bandwidth**: High-resolution produce uploads are automatically compressed via Cloudinary to WebP format, serving smaller sizes on listing cards to preserve data.
* **Offline Safeguards**: Local caching powered by React Query serves stale data during network drops. Outbound SMS fallback is activated for critical delivery and ordering alerts.

---

## Development Timeline

| Phase | Duration | Goals |
|---|---|---|
| **Phase 1: Foundation** | Days 1 - 3 | Monorepo scaffolding, auth modules, database schema design, and initial listing CRUD endpoints. |
| **Phase 2: Core Workflows** | Days 4 - 6 | Multi-mode order confirmation, Paystack checkout integration, and job boards. |
| **Phase 3: Integration** | Days 7 - 8 | Real-time map tracking, agent interfaces, image uploads, and physical hardware testing. |
| **Phase 4: Verification** | Days 9 - 10 | End-to-end user scenario testing (all 5 roles), documentation, and production deployments. |
| **Phase 5: Rest & Demo** | Days 11 - 12 | Developer recovery prior to challenge presentations on **24 July 2026**. |

---

## Team & Contact

* **Organiser**: Ghana Data Science Summit (GDSS) 2026
* **Sponsor**: GIZ / PSInno Programme
* **Contact Email**: programs@datasciencenet.org

---

<div align="center">
  <strong>VegeLink Ghana</strong> — Connecting farm harvests to family tables.
</div>
