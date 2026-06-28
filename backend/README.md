# 🌿 VegeLink Ghana

> **Farmer-to-Buyer Digital Marketplace Platform**  
> GDSS-PSInno AgriTech Innovation Challenge 2026 — Greater Accra Vegetable Belt

[![Challenge](https://img.shields.io/badge/Challenge-GDSS--PSInno%202026-2E7D32?style=flat-square)](https://datasciencenet.org)
[![Stack](https://img.shields.io/badge/Stack-TypeScript%20%7C%20Node.js%20%7C%20PostgreSQL-0D47A1?style=flat-square)](#tech-stack)
[![License](https://img.shields.io/badge/License-Internal%20Only-red?style=flat-square)](#)
[![Status](https://img.shields.io/badge/Status-In%20Development-orange?style=flat-square)](#timeline)

---

## Table of Contents

- [What is VegeLink?](#what-is-vegelink)
- [The Problem](#the-problem)
- [Our Solution](#our-solution)
- [Who It Serves](#who-it-serves)
- [Core Modules](#core-modules)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [API Overview](#api-overview)
- [Farmer Order Confirmation System](#farmer-order-confirmation-system)
- [Delivery Confirmation](#delivery-confirmation)
- [Security](#security)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Development Timeline](#development-timeline)
- [User Roles](#user-roles)
- [Packaging Module](#packaging-module)
- [SMS & Payments](#sms--payments)
- [Accessibility](#accessibility)
- [Team & Contact](#team--contact)

---

## What is VegeLink?

VegeLink Ghana is a cross-platform digital marketplace that directly connects smallholder vegetable farmers with buyers (retailers, restaurants, processors, households) while integrating **logistics coordination** and a **smart packaging system** — all in a single accessible platform.

It is built for the realities of Ghana's agricultural sector: users with no smartphone experience, intermittent connectivity, and basic feature phones sit alongside urban buyers who expect a fast, modern web experience. VegeLink works for all of them.

```
Farmer ──────────────────────────────────────────────────────────────── Buyer
  │   List produce          Browse & order          Pay via Paystack   │
  │   Confirm orders   ◄──  SMS / Agent / Auto  ──►  Track delivery    │
  │   Request transport                                Rate & review    │
  └────────────────────────── Transporter ──────────────────────────────┘
```

---

## The Problem

Ghana's agricultural sector contributes ~20% of GDP and employs over 30% of the workforce. Yet smallholder farmers face a chain of failures that cost the country **$1.9B–$3B annually** in post-harvest losses:

| Pain Point | Impact |
|---|---|
| No reliable market access | Farmers receive 20–30% of final consumer price via middlemen |
| Post-harvest losses | 20–50% of fruits and vegetables lost after harvest |
| Fragmented logistics | Delays and spoilage from uncoordinated transport |
| Inadequate packaging | Bruising and contamination causes buyer rejection |
| Payment insecurity | Informal cash transactions expose both parties to fraud |
| Buyer-side friction | Retailers cannot verify suppliers or coordinate delivery |

**Focus Region:** Greater Accra Vegetable Belt — Dawhenya, Afienya, and surrounding areas. Chosen for high farmer density, proximity to urban buyers, and realistic MVP scope.

---

## Our Solution

VegeLink addresses the **full produce journey** — not just listing and discovery:

```
Farm → Listing → Order → Confirmation → Packaging → Transport → Delivery → Payment → Rating
 ✓       ✓         ✓          ✓              ✓            ✓           ✓          ✓        ✓
```

**Better matching + Timely delivery + Proper packaging = Fresher produce, lower losses, higher incomes, stronger trust.**

---

## Who It Serves

| Role | Who They Are | How VegeLink Helps |
|---|---|---|
| **Farmer** | Smallholder vegetable growers in Greater Accra belt | List produce, receive orders, get paid to mobile money |
| **Buyer** | Retailers, restaurants, processors, households | Search, order, pay securely, track delivery |
| **Transporter** | Pickup truck owners in the region | Find nearby jobs, earn per delivery |
| **Agent** | Field officers who assist non-tech farmers | Register clients, manage listings on their behalf |
| **Admin** | Internal VegeLink team | Platform management, dispute resolution, analytics |

---

## Core Modules

### 🛒 Marketplace

- Produce listings with images, quantity, price, harvest date, and location
- Advanced search and filtering (crop type, price range, location radius, packaging standard)
- Order placement, price negotiation, and order history
- In-app messaging and five-star ratings

### 🚛 Logistics

- Transporter registration and job board
- PostGIS-powered nearest-transporter matching (ST_DWithin within 15km)
- Real-time delivery status updates with SMS notifications at every stage
- Haversine distance-based transport cost estimation

### 📦 Packaging

- Standardised catalog: Ventilated Crates, Plastic Baskets, Mesh Bags, Export Boxes, Bulk Sacks
- Crop-specific packaging recommendations (e.g. ventilated crates for tomatoes)
- Packaging cost automatically added to order total
- Transporter briefed on packaging requirements for proper loading

### 💳 Payments

- Paystack integration: MTN MoMo, Vodafone Cash, AirtelTigo Money, Visa/Mastercard
- HMAC-verified webhook handler for reliable server-side payment confirmation
- Automatic SMS receipt to both farmer and buyer on payment success

### 📱 SMS Notifications (Arkesel)

- Ghana-native SMS gateway with direct MTN, Vodafone, AirtelTigo carrier routing
- Every critical event (order, payment, delivery) triggers an SMS regardless of internet access
- Inbound SMS commands for offline farmer order confirmation (see below)

---

## Tech Stack

### Why These Choices?

| Layer | Technology | Why |
|---|---|---|
| **Language** | TypeScript | Compile-time safety, shared types across layers, IDE intellisense |
| **Runtime** | Node.js 20 | JavaScript everywhere (shared with frontend), native async, Socket.io for real-time |
| **Framework** | Express 4 | Minimal boilerplate — first CRUD route in under an hour. Chose over Django for JS consistency and speed |
| **Database** | PostgreSQL 16 + PostGIS | ACID compliance, referential integrity for financial data, native geospatial queries |
| **ORM** | TypeORM | First-class TypeScript, migration system, PostGIS query builder |
| **Validation** | Zod | Infers TypeScript types from schemas — no duplication between compile and runtime |
| **Auth** | JWT (RS256) + bcrypt | Asymmetric signing — public key cannot forge tokens. bcrypt cost 12 for PINs |
| **Cache / Blacklist** | Redis (ioredis) | Refresh token blacklist, OTP TTL, rate limit counters |
| **Payments** | Paystack | Ghana-native, supports all three major mobile money networks, free sandbox |
| **SMS** | Arkesel | Ghana-based carrier routing, GHS pricing, inbound SMS webhook support |
| **Images** | Cloudinary | WebP auto-conversion for mobile, thumbnail transformations, free tier |
| **Maps** | Leaflet + OpenStreetMap | No API billing risk. Ghana coverage excellent for Greater Accra. |
| **Frontend Web** | React.js | Shared JS codebase with mobile, large ecosystem |
| **Frontend Mobile** | React Native | Single codebase for Android and iOS, runs on low-end Android devices |
| **Hosting** | Vercel (frontend) + Render (backend) | Zero DevOps setup, GitHub auto-deploy, free tier |

> **Why not Django?** Express has minimal boilerplate, keeps the stack in JavaScript (matching the frontend), and handles WebSockets natively for delivery tracking. Django would require Channels as an add-on and a language switch.  
> **Why not AWS?** Vercel/Render deploy from GitHub in minutes. AWS DevOps setup (IAM, VPCs, RDS) costs 1–2 days before a single line of application code runs. Post-challenge migration is straightforward.  
> **Why not Flutter?** React Native shares hooks, validation logic, and API calls with the React.js web app. Flutter is a separate Dart codebase — two languages under a 10-day deadline.

---

## Architecture

VegeLink uses **Layered Clean Architecture** — not microservices.

> Microservices introduce distributed systems complexity (inter-service auth, network failures, distributed tracing) that would consume the entire build window. Layered Clean Architecture gives full testability and a clear path to extracting services post-challenge.

```
┌─────────────────────────────────────────────────────┐
│                   Routes / Controllers               │  ← HTTP boundary, Zod validation
├─────────────────────────────────────────────────────┤
│                      Services                        │  ← Business logic, state machines
├─────────────────────────────────────────────────────┤
│                    Repositories                      │  ← All DB queries (no SQL in services)
├─────────────────────────────────────────────────────┤
│                   Domain Models                      │  ← TypeScript types, entities, DTOs
├─────────────────────────────────────────────────────┤
│                  Infrastructure                      │  ← Paystack, Arkesel, Cloudinary, Redis
└─────────────────────────────────────────────────────┘
```

### Request Lifecycle

Every request passes through security gates **before** any business logic executes:

```
Request → CORS check → Rate limit → JWT verify → RBAC role guard
        → Zod schema validation → Controller → Service → Repository → Response
```

---

## Project Structure

```
vegelink-backend/
├── src/
│   ├── config/                    # App, database, Redis, Swagger config
│   ├── common/
│   │   ├── constants/             # Enums: UserRole, OrderStatus, Events
│   │   ├── dto/                   # Shared DTOs: ApiResponse, Pagination
│   │   ├── exceptions/            # Custom error classes
│   │   ├── middleware/            # authenticate, authorize (RBAC), rate-limit, error-handler
│   │   └── utils/                 # hash, otp, paginate, virtual-email
│   ├── infrastructure/
│   │   ├── paystack/              # Paystack HTTP client + types
│   │   ├── arkesel/               # Arkesel SMS client + message templates
│   │   ├── cloudinary/            # Image upload client
│   │   ├── redis/                 # Redis client (blacklist + OTP TTL)
│   │   └── jwt/                   # RS256 sign + verify
│   ├── features/
│   │   ├── auth/                  # Register, OTP, login, refresh, logout
│   │   ├── users/                 # Profile management, agent relationships
│   │   ├── listings/              # Produce listings CRUD, image upload
│   │   ├── packaging/             # Catalog CRUD, recommendation engine
│   │   ├── orders/
│   │   │   ├── order-state-machine.ts
│   │   │   └── order-confirmation/
│   │   │       ├── confirmation-router.service.ts   # Mode detection
│   │   │       ├── agent-confirmation.service.ts    # Option 1
│   │   │       ├── preauth-confirmation.service.ts  # Option 2
│   │   │       ├── sms-reply-confirmation.service.ts # Option 3
│   │   │       ├── trusted-buyer.service.ts         # Option 4
│   │   │       └── inbound-sms.controller.ts        # Shared webhook
│   │   ├── payments/              # Paystack init, webhook handler
│   │   ├── transport/             # Matching, job board, delivery tracking
│   │   ├── messages/              # Order-linked chat
│   │   ├── ratings/               # Post-delivery ratings
│   │   ├── farmers/trusted-buyers/ # Trusted buyer management
│   │   ├── agent/                 # Agent order queue and digest
│   │   └── admin/                 # User management, analytics
│   ├── jobs/                      # Background cron jobs
│   │   ├── sms-expiry.job.ts      # Cancel expired pending orders (every 15min)
│   │   ├── farmer-digest.job.ts   # Daily 6pm summary SMS to farmers
│   │   ├── trusted-buyer-reset.job.ts  # Midnight counter reset
│   │   └── trust-eligibility.job.ts   # Send trust invitations after 3 orders
│   ├── database/
│   │   ├── migrations/            # 012 migration files
│   │   ├── seeds/                 # Demo data for judging
│   │   └── entities/              # TypeORM entity classes
│   ├── app.ts                     # Express app factory
│   └── server.ts                  # Entry point
├── tests/e2e/                     # End-to-end integration tests
├── .github/workflows/             # CI (ci.yml) + Deploy (deploy.yml)
├── docker/
│   ├── Dockerfile                 # Production multi-stage build
│   └── Dockerfile.dev             # Development with hot-reload
├── docker-compose.yml             # api + PostGIS + Redis
├── docker-compose.test.yml        # Isolated test environment
└── .env.example                   # All required env vars documented
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Git

### 1. Clone and install

```bash
git clone https://github.com/your-org/vegelink-backend.git
cd vegelink-backend
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
# Fill in all values — see Environment Variables section below
```

### 3. Generate RS256 key pair (JWT signing)

```bash
mkdir keys
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
```

### 4. Start the full local stack

```bash
docker-compose up -d
# Starts: API (port 3000) + PostgreSQL with PostGIS (port 5432) + Redis (port 6379)
```

### 5. Run database migrations

```bash
npm run migration:run
```

### 6. Seed demo data (optional — for testing and demo)

```bash
npm run seed
```

### 7. Access

| Service | URL |
|---|---|
| API | `http://localhost:3000/api/v1` |
| Swagger UI | `http://localhost:3000/api/docs` |
| Health check | `http://localhost:3000/api/health` |

---

## Environment Variables

All required variables are documented in `.env.example`. Never commit `.env`.

```bash
# ── Server ──────────────────────────────────────────────────────────────────
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# ── Database ────────────────────────────────────────────────────────────────
DATABASE_URL=postgres://vegelink:secret@localhost:5432/vegelink_dev

# ── Redis ───────────────────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── JWT (RS256 — asymmetric) ────────────────────────────────────────────────
JWT_PRIVATE_KEY_PATH=./keys/private.pem
JWT_PUBLIC_KEY_PATH=./keys/public.pem
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# ── Paystack ────────────────────────────────────────────────────────────────
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_WEBHOOK_SECRET=...

# ── Arkesel ─────────────────────────────────────────────────────────────────
ARKESEL_API_KEY=...
ARKESEL_SENDER_ID=VegeLink
ARKESEL_INBOUND_WEBHOOK_SECRET=...
ARKESEL_IP_WHITELIST=41.242.116.0/24   # Arkesel's documented IP range

# ── Cloudinary ──────────────────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# ── CORS ────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS=http://localhost:5173,https://vegelink.vercel.app

# ── Virtual email domain (Paystack) ─────────────────────────────────────────
VIRTUAL_EMAIL_DOMAIN=vegelink.app

# ── Rate limiting ────────────────────────────────────────────────────────────
RATE_LIMIT_WINDOW_MS=900000       # 15 minutes
RATE_LIMIT_MAX_GENERAL=100
RATE_LIMIT_MAX_AUTH=5

# ── Jobs ────────────────────────────────────────────────────────────────────
DIGEST_CRON_SCHEDULE=0 18 * * *   # 6pm daily
EXPIRY_CRON_SCHEDULE=*/15 * * * * # Every 15 minutes
RESET_CRON_SCHEDULE=0 0 * * *     # Midnight daily
GHANA_TIMEZONE=Africa/Accra

# ── Transport cost ───────────────────────────────────────────────────────────
TRANSPORT_RATE_PER_KM_GHS=2.50
TRANSPORT_MATCH_RADIUS_KM=15
```

---

## Database

### Setup

```bash
# Run all migrations
npm run migration:run

# Generate a new migration after entity changes
npm run migration:generate -- src/database/migrations/MyMigration

# Revert last migration
npm run migration:revert
```

### Key Tables

| Table | Purpose |
|---|---|
| `users` | All roles: farmer, buyer, transporter, agent, admin. PostGIS location point. |
| `refresh_tokens` | SHA-256 hashed refresh tokens with revocation support |
| `produce_listings` | Farmer listings with PostGIS location and pre-auth fields |
| `packaging_options` | Standardised packaging catalog |
| `orders` | Full order lifecycle with status machine and confirmation mode |
| `payments` | Paystack transaction records with webhook state |
| `transport_requests` | PostGIS pickup/dropoff points, delivery status |
| `trusted_buyers` | Trusted buyer relationships with guardrails |
| `sms_reply_logs` | All inbound Arkesel SMS commands and their processing status |
| `messages` | Order-linked chat between farmer and buyer |
| `ratings` | Post-delivery ratings (one per rater per order) |
| `audit_logs` | Every write operation for dispute resolution and forensics |
| `sms_logs` | Every outbound Arkesel SMS attempt |

### PostGIS Spatial Queries

```sql
-- Find transporters within 15km of a farm location
SELECT u.id, u.name,
  ST_Distance(u.location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) / 1000 AS distance_km
FROM users u
WHERE u.role = 'transporter'
  AND ST_DWithin(u.location::geography, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, 15000)
ORDER BY distance_km ASC;
```

---

## API Overview

**Base URL:** `/api/v1`  
**Auth:** `Authorization: Bearer <access_token>` on all protected routes  
**Swagger UI:** `/api/docs` (development and staging only)

### Response Envelope

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human readable description" } }
```

### Endpoint Groups

| Group | Base Path | Description |
|---|---|---|
| Auth | `/auth` | Register, OTP verify, login, refresh, logout |
| Users | `/users` | Profile management, agent client registration |
| Listings | `/listings` | Produce listings CRUD, image upload, search + filter |
| Packaging | `/packaging` | Catalog browse, crop recommendations, admin CRUD |
| Orders | `/orders` | Place, confirm, negotiate, cancel, history |
| Payments | `/payments` | Paystack initialize, webhook handler, transaction history |
| Transport | `/transport` | Request transport, job board, delivery status updates |
| Messages | `/messages` | Order-linked chat |
| Ratings | `/ratings` | Post-delivery ratings submission |
| Farmers | `/farmers` | Trusted buyer management, pre-auth settings |
| Agent | `/agent` | Agent order queue, client digest preview |
| Admin | `/admin` | User management, analytics, packaging catalog |
| Health | `/health` | Health check (public) |

### Key Status Codes Used

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Resource created |
| `400` | Bad request (invalid file type, malformed body) |
| `401` | Unauthenticated (missing or invalid JWT) |
| `403` | Forbidden (authenticated but wrong role or resource ownership) |
| `404` | Resource not found |
| `409` | Conflict (duplicate, invalid state transition, listing sold) |
| `410` | OTP expired |
| `422` | Validation error (Zod schema failed) |
| `429` | Rate limit exceeded |
| `503` | Service degraded (DB or Redis unreachable) |

---

## Farmer Order Confirmation System

One of VegeLink's most important innovations. The challenge: a farmer receiving 50 orders per day cannot respond to 50 OTP codes on a basic phone with no internet. VegeLink implements **four confirmation modes** that work for every farmer type.

### Mode Priority

When an order is placed, the system checks modes in this order:

```
1. Trusted Buyer?  →  Auto-confirm instantly (Option 4)
2. Pre-auth set?   →  Auto-confirm within ceiling (Option 2)
3. Has an agent?   →  Route to agent for confirmation (Option 1)
4. Default         →  Send SMS reply request to farmer (Option 3)
```

---

### Option 1 — Agent Proxy

The farmer's registered agent confirms orders on their behalf. The farmer receives a summary SMS only — not one SMS per order.

```
Order placed → SMS to Agent → Agent consults farmer → Agent confirms in app
                                                     → Farmer gets outcome SMS
             → Farmer daily digest at 6pm: "3 orders confirmed. 85kg. GHS 382."
```

**Farmer safety valve:** Reply `STOP-[last4]` to block any agent confirmation from a basic phone.

---

### Option 2 — Pre-Authorisation

Farmer sets terms once per listing. All matching orders auto-confirm instantly.

```javascript
// Set on listing creation or update
{
  auto_confirm_until_kg: 200,       // total quantity willing to commit
  auto_confirm_price_floor_ghs: 4.00  // minimum acceptable price/kg
}
```

- Orders within terms → **instant auto-confirm**, no farmer action required
- Quantity ceiling reached → listing automatically marked `sold`
- Farmer receives **one digest SMS at 6pm** with the day's summary
- Reply `PAUSE` to halt auto-confirmation. Reply `RESUME` to restart.

> ⚠️ The ceiling check and `committed_kg` increment run inside a single `SERIALIZABLE` transaction with `SELECT FOR UPDATE` to prevent race conditions.

---

### Option 3 — SMS Reply

Default for farmers without an agent or pre-authorisation. One SMS per order, fully self-contained, actionable from any basic phone.

```
SMS to farmer:
"VegeLink: Order from Kwame: 30kg tomatoes @ GHS4.50/kg.
Total: GHS135. Reply YES-4829 to confirm or NO-4829 to decline.
Expires: 4:30pm."
```

- Farmer replies `YES-4829` or `NO-4829` — standard SMS, no internet needed
- Arkesel delivers the reply to `POST /orders/inbound-sms`
- Server matches last-4 code **and** sender phone number — two-factor match
- No reply within 2 hours → order expires → buyer notified

---

### Option 4 — Trusted Buyer

After 3 successful completed orders, the farmer can mark a buyer as trusted. Future orders from that buyer auto-confirm silently within configurable guardrails.

```
Guardrails (configurable per trusted buyer):
  max_quantity_per_order_kg   → default 50kg
  min_price_per_kg_floor_ghs  → default 80% of listing price
  max_orders_per_day          → default 5
```

**Opt-in:** Farmer replies `TRUST-XXXX` (last-4 of buyer ID) after receiving the trust invitation SMS.  
**Revoke:** Reply `UNTRUST-XXXX` at any time or use the app.

---

### Inbound SMS Command Reference

All farmer SMS replies are handled by `POST /orders/inbound-sms` (Arkesel webhook).

| Command | Effect |
|---|---|
| `YES-[last4]` | Confirm the matching pending order |
| `NO-[last4]` | Decline the matching pending order |
| `STOP-[last4]` | Block agent confirmation on a specific order |
| `PAUSE` | Halt all auto-confirmation (Option 2) |
| `RESUME` | Restart auto-confirmation |
| `TRUST-[last4buyer]` | Add buyer to trusted list |
| `UNTRUST-[last4buyer]` | Revoke buyer trust |
| `TRUSTMAX-[last4]-[qty]` | Update max quantity guardrail |
| `TRUSTPRICE-[last4]-[price]` | Update price floor guardrail |
| `TRUSTLIMIT-[last4]-[count]` | Update daily order cap |
| `DISPUTE` | Raise a dispute on the most recent order |

---

## Delivery Confirmation

Delivery uses **Arkesel OTP** — the only place in VegeLink where OTP is used. It works here because it is one code, one phone, one physical moment.

```
Transporter → in_transit update
  → Arkesel generates OTP → SMS to buyer's phone
  → Transporter arrives → buyer reads code aloud
  → Transporter enters code in app
  → Server calls Arkesel verify OTP
  → ✅ status: delivered | otp_verified_at: timestamped
```

```bash
# Arkesel Generate OTP
POST https://sms.arkesel.com/api/otp/generate
{ "phone_number": "+233244123456", "via": "sms", "code_length": 6, "expiry": 10 }

# Arkesel Verify OTP
POST https://sms.arkesel.com/api/otp/verify
{ "phone_number": "+233244123456", "code": "847291" }
```

---

## Security

### Authentication

| Mechanism | Detail |
|---|---|
| JWT algorithm | RS256 (asymmetric) — private key signs, public key verifies |
| Access token | 15-minute expiry, sent in `Authorization: Bearer` header |
| Refresh token | 7-day expiry, stored as SHA-256 hash in DB, sent as `httpOnly` `Secure` `SameSite=Strict` cookie |
| Token rotation | Every refresh issues a new pair and revokes the old. Reuse of a revoked token terminates all sessions. |
| OTP | `crypto.randomInt` (CSPRNG, not `Math.random`). Stored as bcrypt hash. 10-minute TTL in Redis. 3-attempt lockout. |

### RBAC

Every route declares permitted roles. The `authorize(role)` middleware guard runs before any controller. Resource ownership is a secondary check inside the Service layer.

### Input Validation

Every request body, query param, and route param is validated by a **Zod schema** before reaching the controller. All database queries use **TypeORM parameterised queries** — no string concatenation, no SQL injection possible.

### Rate Limiting

| Route Group | Limit |
|---|---|
| General routes | 100 requests / 15 minutes per IP |
| Auth routes (`/auth/*`) | 5 requests / 15 minutes per IP |
| Inbound SMS webhook | 20 commands / hour per phone number |

Rate limit counters stored in Redis — consistent across multiple server instances.

### Additional Controls

- **Helmet.js** — 14 security HTTP headers (CSP, HSTS, X-Frame-Options, etc.)
- **Paystack webhook** — HMAC-SHA512 signature verified before any processing
- **Arkesel inbound webhook** — IP whitelist + shared secret header verified
- **Audit log** — every write operation recorded with user ID, resource, changes, IP, and request ID
- **Error responses** — production never exposes stack traces or raw DB errors
- **File uploads** — MIME type and size validated before Cloudinary upload

---

## Testing

### Strategy

```
Unit Tests (Jest)          → Services, state machine, parsers, utilities — no DB
Integration Tests (Supertest + Testcontainers) → Full HTTP → real PostgreSQL
E2E Tests                  → Complete user journeys — all 4 confirmation modes
```

**Target: 80% coverage minimum across all features.**

### Commands

```bash
npm run test              # Unit tests only (fast, no DB)
npm run test:integration  # Integration tests (spins up Docker test DB)
npm run test:e2e          # E2E tests (full stack required)
npm run test:coverage     # Unit + integration with coverage report
npm run test:watch        # Unit tests in watch mode (development)
npm run lint              # ESLint with TypeScript rules
npm run type-check        # TypeScript compiler check (no emit)
```

### Critical Test Scenarios

| Scenario | What Is Verified |
|---|---|
| Pre-auth race condition | Two simultaneous orders — only one confirms within ceiling |
| SMS reply idempotency | Same YES reply arriving twice does not double-confirm |
| JWT token reuse detection | Revoked refresh token use terminates all sessions |
| Paystack webhook forgery | Invalid HMAC signature returns 401, no processing |
| Agent scope isolation | Agent cannot act on another agent's client — 403 |
| Delivery OTP expiry | OTP entered after 10 minutes returns 422 |

---

## CI/CD

### Pipeline Overview

```
Every push / PR               Merge to main
      │                             │
      ▼                             ▼
  ┌─────────┐               ┌──────────────┐
  │  lint   │               │ Full CI gate │
  │ type-check              │ Build image  │
  │ unit tests              │ Push to GHCR │
  │ integration tests       │ Deploy Render│
  │ build check             │ Run migrations
  │ security scan           │ Health check │
  └─────────┘               └──────────────┘
```

### Branch Strategy

```
main         ← Production. Protected. No direct pushes.
develop      ← Integration branch. All PRs target here first.
feature/*    ← Feature branches. PR → develop → main.
```

### GitHub Actions Workflows

| File | Trigger | Jobs |
|---|---|---|
| `.github/workflows/ci.yml` | Every push, every PR | lint, type-check, unit-tests, integration-tests, build, security-scan |
| `.github/workflows/deploy.yml` | Merge to main | Full CI gate → Docker build → push to GHCR → Render deploy → health check |

### Required GitHub Secrets

```
RENDER_DEPLOY_HOOK_URL
CODECOV_TOKEN
JWT_PRIVATE_KEY
JWT_PUBLIC_KEY
PAYSTACK_SECRET_KEY
```

---

## Development Timeline

**Challenge Period: 29 June – 10 July 2026**

| Day | Date | Focus | End-of-Day Target |
|---|---|---|---|
| 1 | 29 Jun | Setup + Auth CRUD | Users, tokens, OTP, JWT, Arkesel wired. Repo + hosting live. |
| 2 | 30 Jun | Marketplace + Packaging CRUD | All listing, order, packaging, message, rating endpoints done. |
| 3 | 1 Jul | Payments + Transport CRUD + Frontend shell | Paystack + webhook live. React routing shell deployed. |
| 4 | 2 Jul | Order workflow + Paystack checkout | Full order lifecycle and checkout working end-to-end with SMS. |
| 5 | 3 Jul | Logistics workflow | Transporter matching, job acceptance, delivery status updates. |
| 6 | 4 Jul | Full frontend build | All role-based screens built. Full journeys walkable in browser. |
| 7 | 5 Jul | Map + messaging + ratings | Leaflet map, in-app chat, rating submission working. |
| 8 | 6 Jul | Analytics + demo seed data | Admin dashboard live. Seeding script creates complete journey. |
| 9 | 7 Jul | Demo dry run + fixes | Three full dry runs. SMS confirmed on real phones. |
| 10 | 8 Jul | Documentation + final deploy | API docs, ER diagram, production URLs stable. |
| 11 | 9 Jul | 🛌 Team rest | No work. |
| 12 | 10 Jul | 🛌 Team rest | No work. |

> The last two days are **non-negotiable rest time**. All demo-ready work must be complete by end of Day 10. The team performs better in the final judging presentation (24 July) when well-rested.

---

## User Roles

### Farmer

List produce, manage orders, confirm via SMS/app, request transport, receive Paystack MoMo payment.

### Buyer

Search listings, place orders, negotiate price, pay via Paystack (MoMo or card), track delivery in real time.

### Transporter

Browse nearby jobs (PostGIS-matched), accept transport requests, update delivery status through each stage.

### Agent *(Accessibility Bridge)*

Register farmers, transporters, and buyers on their behalf. Create listings for assigned farmers. Confirm orders on behalf of farmers. Farmers retain full ownership — agents never receive payments or ratings.

> The Agent role is VegeLink's most important accessibility feature. Many farmers will not self-register on a digital platform. Agents are cooperative field officers or trained community members who bridge the gap.

### Admin

Platform management, user suspension, packaging catalog administration, dispute resolution, analytics.

---

## Packaging Module

The packaging module is VegeLink's standout differentiator. Post-harvest packaging failures contribute significantly to Ghana's $1.9B–$3B annual losses. VegeLink embeds packaging decisions into the transaction workflow.

### Catalog (Seeded)

| Option | Suitable For | Protection | Cost |
|---|---|---|---|
| Ventilated Crates | Tomatoes, peppers | High | Varies |
| Plastic Baskets | Garden eggs, okra | Medium | Varies |
| Mesh Bags | Leafy greens | Low | Varies |
| Export-grade Boxes | High-value produce | High | Varies |
| Bulk Sacks | Root vegetables | Low | Varies |

### Workflow

1. Farmer selects crop → system **recommends** best packaging
2. Buyer confirms or changes packaging preference on order
3. Packaging cost **auto-added** to order total
4. Transporter sees packaging type and handling notes on their job card

---

## SMS & Payments

### Paystack

```
Buyer checkout → Paystack popup (MoMo or card)
              → Redirect back to VegeLink
              → Paystack webhook (HMAC verified) → payment confirmed
              → SMS to farmer + buyer
              → Order proceeds to logistics
```

**Paystack email handling:** Farmers and transporters do not have email addresses. VegeLink auto-generates a Paystack-compatible virtual email at registration:

```
user_233244123456@vegelink.app
```

This is accepted by Paystack as a valid reference field. The email is never sent to.

### Arkesel SMS Events

| Event | Recipients |
|---|---|
| OTP on registration | New user |
| New order placed | Farmer (or agent) |
| Order confirmed | Buyer |
| Payment confirmed | Farmer + Buyer |
| Transporter assigned | Farmer + Buyer |
| Produce picked up | Buyer |
| Order delivered | Farmer + Buyer |
| New message received | Counterparty |
| Daily order digest | Farmer |
| Trust invitation | Farmer (after 3rd completed order with a buyer) |

---

## Accessibility

VegeLink is built for users with **no tech knowledge, low literacy, and basic phones**.

| Requirement | Implementation |
|---|---|
| No email required | Phone-only OTP registration. Paystack email auto-generated. |
| No reading required for core actions | Icon + short label combinations. No text-only actions. |
| Large touch targets | All tappable elements minimum 48×48px |
| Plain language | No jargon. Reviewed by a non-technical person before demo. |
| SMS fallback for all key events | Arkesel SMS fires regardless of internet connectivity |
| Agent-assisted onboarding | Non-smartphone users registered and managed by an Agent |
| Low-bandwidth images | Cloudinary thumbnail URLs on listing cards. Full image on detail only. |
| Mobile money payments | No bank account required. Paystack supports MTN, Vodafone, AirtelTigo. |
| Offline-first farmer confirmation | SMS reply, pre-auth, and agent proxy all work without internet |
| Basic phone delivery confirmation | Buyer SMS OTP readable on any phone — no internet needed |

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

**VegeLink Ghana** — Built for Abena in Dawhenya. Ready for Kwame in East Legon.

*Connecting Ghana's farms to Ghana's tables.*

</div>
