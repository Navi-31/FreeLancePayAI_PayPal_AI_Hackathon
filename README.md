# FreelancePay AI — Autonomous Wealth Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.1.7-black.svg)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue.svg)](https://www.typescriptlang.org)
[![Neon](https://img.shields.io/badge/Database-Neon%20Postgres-00E599.svg)](https://neon.tech)
[![PayPal](https://img.shields.io/badge/Payments-PayPal%20Sandbox-003087.svg)](https://developer.paypal.com)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-4285F4.svg)](https://ai.google.dev)
[![Test Suite](https://img.shields.io/badge/Tests-370%20Passed-brightgreen.svg)](#7-testing--verification)

> **PayPal AI Hackathon 2026 Submission**  
> Autonomous AI Financial Command Center & Counterparty Intelligence Engine for Independent Operators, Freelancers, and Boutique Agencies.

---

## 1. Executive Summary & Problem

Independent professionals, contractors, and boutique agencies face persistent cashflow friction throughout their client engagements: unpredictable settlement lags, hidden gateway fees, cross-border FX drag, manual bookkeeping, and unreliable cashflow forecasting. Furthermore, standard AI wrappers frequently hallucinate financial figures and propose disbursements without human oversight.

**FreelancePay AI** solves this with an enterprise-grade financial operating system that combines:
- **Autonomous Financial Telemetry:** Real-time visibility into liquid cash, tax vaults, receivables, and burn rates.
- **Deterministic Arithmetic Engine:** Zero floating-point drift; all calculations use fixed-point integer cents.
- **PayPal Commerce Rails:** Native invoice checkout, 2-phase milestone authorization/capture, and webhook idempotency.
- **Grounded Gemini AI Copilot:** Contextual financial intelligence with strict separation of historical facts, estimates, and forecasts.
- **Approval-First Guardrails:** No financial disbursements, refunds, or client notices occur without human confirmation.

---

## 2. Feature Highlights (22 Core Screens Across 4 Pillars)

### Core Protocol
- **Financial Dashboard (`/`):** Unified financial overview displaying vault reserves, live invoices, cashflow telemetry, and action radar.
- **Invoices Engine (`/invoices`, `/invoices/new`, `/invoices/[id]`):** Deterministic line item math, PDF generation, and PayPal checkout orders.
- **Payment Reminders (`/reminders`):** Smart reminder generation with polite, firm, formal, and executive tone escalation.
- **Milestones (`/milestones`):** Two-phase fund authorization and deliverable-based capture workflow.
- **Transactions (`/transactions`):** Full multi-channel settlement ledger with fee breakdown and net payouts.

### Autonomous AI
- **Financial Copilot (`/ai/copilot`):** Conversational AI grounded in Neon DB records with structured source figures and audit trails.
- **Payment Negotiator (`/ai/negotiator`):** AI payment plan and installment generator for past-due client collections.
- **Client Intelligence & Dossier (`/clients`, `/clients/[id]/dossier`, `/clients/memory`):** Empirical payment reliability ratings with insufficient-data safeguards.
- **Forecast Radar (`/forecast`):** Multi-scenario (Conservative, Expected, Optimistic) 30/60-day cashflow trajectory projections.
- **What-If Financial Simulator (`/simulator`):** Interactive sandbox testing rates, client losses, and expense adjustments.
- **Rescue Mode (`/ai/rescue`):** Emergency liquidity workflow with prioritized collections and non-essential burn freezing.

### Treasury & Fiscal
- **Fee & Currency Intelligence (`/treasury/currency`):** 5-channel interchange comparison matrix and statutory ACH fee cap calculations.
- **Spending Insights (`/spending`):** Operational outflow categorization and tax-deductible tracking.
- **SaaS Subscriptions (`/subscriptions`):** Recurring software audit and dormant subscription detection.
- **Tax Shield Estimator (`/tax`):** Safe-harbor quarterly 1040-ES calculation and automated reserve vault top-up.
- **Project Profitability (`/profitability`):** Real-time margin analytics, hourly yield tracking, and scope creep detection.

### Utility Engine
- **AI Document Scanner (`/scanner`):** Extraction of contracts, SOWs, and receipts into structured draft invoices.
- **Reports & P&L (`/reports`):** GAAP-aligned executive income statements with CPA CSV reconciliation export.
- **Workspace Settings (`/settings`):** Configurable base currency, tax ratios, AI autonomy boundaries, and tenant profile.

---

## 3. Technology Stack & Architecture

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | [Next.js 15.1.7](https://nextjs.org) (App Router, React 19, Standalone Output) |
| **Styling & Design** | Tailwind CSS with custom atmospheric glassmorphic tokens from Stitch |
| **Typography & Icons** | Geist (Headings/Numerals), Inter (Body), Google Material Symbols Outlined |
| **Database & ORM** | [Neon Serverless PostgreSQL](https://neon.tech) via [Prisma 7.10](https://www.prisma.io) |
| **Payment Rails** | [PayPal Commerce Platform](https://developer.paypal.com) (Orders v2 API, Authorizations, Refunds, Webhooks) |
| **AI Intelligence** | [Google Gemini 3.5 Flash](https://ai.google.dev) with deterministic fallback |
| **Authentication** | Stateless HTTP-only JWT sessions signed with HMAC-SHA256 (`jose`) |
| **Quality & Testing** | [Playwright](https://playwright.dev), [tsx](https://github.com/privatenumber/tsx), TypeScript 5.7, ESLint 9 |

---

## 4. Getting Started & Local Setup

### Prerequisites
- **Node.js** `20.x` or higher (Recommended: Node 22 LTS)
- **npm** `10.x` or higher
- **PostgreSQL Database** (Local instance or free [Neon](https://neon.tech) serverless database)

### Installation

1. **Clone repository:**
   ```bash
   git clone https://github.com/Navi-31/PayPal_AI_Hackathon.git
   cd PayPal_AI_Hackathon
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to provide your database URL and optional API credentials (see Section 5 below).*

4. **Initialize database schema:**
   - **Local Development / Prototyping:**
     ```bash
     npm run db:push
     ```
     *(Synchronizes the Prisma schema directly against your database without generating migration files).*
   - **Production Environments:**
     ```bash
     npm run db:migrate
     ```
     *(Applies versioned, tracked SQL migrations safely with zero unreviewed DDL execution).*

5. **Start local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Environment Configuration & Integration Truth Matrix

FreelancePay AI is designed with **transparent fallback resilience**: it operates cleanly out of the box in offline/demo mode, while activating live cloud rails as API credentials are provided.

| Environment Variable | Description | Default / Fallback Mode |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | Connects to Neon PostgreSQL; falls back to in-memory/demo seed if unconfigured. |
| `JWT_SECRET` | Secret key for JWT session signing | Development default provided; replace with high-entropy key in production. |
| `GEMINI_API_KEY` | Google Gemini API key | Optional. When omitted or exhausted, activates deterministic financial rule engine. |
| `GEMINI_MODEL` | Gemini model identifier | Defaults to `gemini-3.5-flash`. |
| `PAYPAL_CLIENT_ID` | PayPal Sandbox Client ID | Optional. When omitted, enables verified PayPal Sandbox simulation rails. |
| `PAYPAL_CLIENT_SECRET` | PayPal Sandbox Secret | Required for live PayPal Sandbox token issuance. |
| `PAYPAL_BASE_URL` | PayPal API Endpoint | Defaults to `https://api-m.sandbox.paypal.com`. |
| `RESEND_API_KEY` | Resend email API key | Optional. When omitted, logs dispatches to audit ledger with `[SIMULATED]` status. |
| `CRON_SECRET` | Bearer secret for `/api/cron/process-jobs` | Default provided for local background job testing. |

### Integration Truth Matrix & Execution Tiers

- **Neon PostgreSQL:** **LIVE TESTED**. Verified on a live Neon serverless instance. Validated connection, Prisma schema DDL, foreign key cascade rules, strict tenant query scoping, and transactional rollbacks.
- **Google Gemini AI (`gemini-3.5-flash`):** **CONFIGURED & FALLBACK VERIFIED**.
  - *Application Configuration:* The application code strictly targets `gemini-3.5-flash` (`src/lib/env.ts` and `src/lib/ai/aiProvider.ts`) using structured JSON schemas (`responseMimeType: "application/json"`).
  - *Infrastructure vs. Application Errors:* Transient 503 errors referencing `gemini-3.8-flash-medium` in earlier diagnostic logs originated from Antigravity's internal assistant harness infrastructure, not from FreelancePay AI application code.
  - *Quota Exhaustion Handling:* When free-tier Gemini API quota is depleted (HTTP 429 `RESOURCE_EXHAUSTED`) or network connectivity is unavailable, `runAICompletion` automatically engages `DeterministicFinancialFallback`. All metrics and schemas conform strictly to Zod definitions, guaranteeing zero application downtime or crashes.
- **PayPal Commerce Rails:** **CLIENT-LEVEL SIMULATION & MOCK TESTED (NON-ESCROW)**.
  - *Automated Test Execution:* Because `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` were unconfigured in the test environment, the 40 automated PayPal tests in Suites 5 and 13 ran against the client adapter's deterministic simulation/mock mode. No live HTTP network requests were dispatched to `api-m.sandbox.paypal.com`.
  - *Protocol Verification:* Verified complete Orders v2 lifecycle semantics: order creation (`ORD-SANDBOX-*`), two-step milestone authorization hold, deliverable capture (`CAP-*`), and partial refunds.
  - *Non-Escrow Compliance:* Uses standard commercial checkout and authorization APIs; never claims to be an escrow agent or escrow service.
  - *Live Sandbox / Production:* Connecting to live PayPal Sandbox endpoints requires supplying active credentials from the PayPal Developer Portal in `.env`.
- **Email Delivery:** **SIMULATED / AUDIT LOGGED**. Dispatches are recorded in user audit logs; never sends unapproved emails. Production delivery requires a verified Resend domain.
- **Background Jobs:** **INTERNAL QUEUE VERIFIED**. Authenticated `/api/cron/process-jobs` endpoint verified with bearer secret tokens and transactional idempotency. External scheduling requires configuring a cron runner.

### Deployment Readiness vs. Public Production Deployment
The application is **deployment-ready** (including an optimized standalone Next.js build, multi-stage Docker container, `/api/health` monitoring, and production Prisma migrations). However, it is currently hosted and tested locally in development/demo mode and has **NOT** been deployed to a public domain. Full public production requires the following manual external setups:
1. **Public HTTPS Domain:** Deployment to a host (Vercel, Render, AWS, Fly.io) with SSL/TLS certificate termination.
2. **PayPal Webhook Ingress:** Public registration of `https://<domain>/api/webhooks/paypal` in the PayPal Developer Dashboard and assigning `PAYPAL_WEBHOOK_ID`.
3. **Resend Domain Verification:** Creating an API key and adding SPF/DKIM DNS records for an official sending domain in Resend.
4. **External Cron Trigger:** Setting up an automated scheduler (e.g. Vercel Cron, GitHub Actions, AWS EventBridge) to trigger `/api/cron/process-jobs` periodically with the `CRON_SECRET` bearer token.

---

## 6. Demo Account & Non-Destructive Reset

For hackathon judges and evaluators, FreelancePay AI provides a realistic enterprise demo account with interconnected clients, invoices, payments, expenses, and subscriptions:

1. **Access Demo Account:** Navigate to [http://localhost:3000](http://localhost:3000). The app automatically provisions an initial demo context if unauthenticated.
2. **Safe Reset:** Click the **Demo Actions** menu in the top navigation bar and select **Reset Demo Data**.
3. **Targeted Deletion Scope:** The reset mechanism exclusively deletes records carrying the `DEMO_SYNTHETIC` marker or designated synthetic demo identifiers. Genuine user accounts, client dossiers, invoices, expenses, and transactions are **never deleted or modified**.

---

## 7. Testing & Verification

FreelancePay AI features a comprehensive multi-layered test suite covering financial precision, live database integration, security, and browser E2E workflows.

### Run All 370 Tests

```bash
npm test
```

### Verified Suite Results

```text
==================================================
 FREELANCEPAY AI — PRODUCTION BACKEND TEST SUITE  
==================================================
  1. Financial Calculations:              23 passed, 0 failed
  2. Authentication & Token Verification: 10 passed, 0 failed
  3. Data Isolation & Architecture:       13 passed, 0 failed
  4. Live Neon Integration:               12 passed, 0 failed
  5. PayPal Sandbox Integration & Rails:  40 passed, 0 failed
  6. AI Integration & Safety Guardrails:  36 passed, 0 failed
  7. Email Delivery, Notifications & Jobs:42 passed, 0 failed
  8. Security Audit & Safeguards (4E):    29 passed, 0 failed
  9. Workflows Integration (5B):          29 passed, 0 failed
 10. Browser E2E Journeys (5C):           17 passed, 0 failed
 11. Demo Readiness & Polish (5D):        34 passed, 0 failed
 12. Advanced AI & Intelligence (5E):     43 passed, 0 failed
 13. Final Validation & QA (5F):          42 passed, 0 failed
--------------------------------------------------
TOTAL SUITE RESULTS: 370 passed, 0 failed.
==================================================
```

### Code Quality Gates

```bash
# TypeScript type checking
npm run typecheck

# ESLint audit
npm run lint

# Next.js production build
npm run build
```

---

## 8. Production Deployment Guide

FreelancePay AI is configured for multi-cloud production deployment.

### Option A: Vercel (Recommended for Next.js)

1. Push repository to GitHub.
2. Import project into [Vercel](https://vercel.com).
3. Configure Environment Variables in the Vercel dashboard:
   - `DATABASE_URL`: Your production pooled Neon connection string.
   - `DATABASE_URL_UNPOOLED`: Your direct unpooled connection string.
   - `JWT_SECRET`: High-entropy secret (`openssl rand -base64 32`).
   - `PAYPAL_CLIENT_ID` & `PAYPAL_CLIENT_SECRET`: PayPal Sandbox/Live credentials.
   - `GEMINI_API_KEY`: Google Gemini API key.
   - `CRON_SECRET`: Random string for cron endpoint protection.
4. Set Build Command: `prisma generate && next build`
5. Deploy.

### Option B: Docker Container (Render, Fly.io, Cloud Run)

The repository includes an optimized multi-stage `Dockerfile`:

```bash
# Build production Docker container
docker build -t freelancepay-ai .

# Run container
docker run -p 3000:3000 --env-file .env freelancepay-ai
```

### Health Check Endpoint

Monitor uptime and service connectivity via `/api/health`:

```bash
curl http://localhost:3000/api/health
```

---

## 9. Hackathon Presentation & Judging Guide

- **Demonstration Script & Sequence:** Detailed 3–5 minute pitch script, feature tour, and judging checklist are available in [`HACKATHON_DEMO.md`](HACKATHON_DEMO.md).
- **Core Pitch:** FreelancePay AI turns freelancers from reactive invoice chasers into proactive financial CFOs—combining autonomous AI insights with deterministic math and PayPal rails.

---

## 10. License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
