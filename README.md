# FreelancePay AI — Autonomous Cross-Border Financial Operating System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js 15](https://img.shields.io/badge/Next.js-15.1.7-black.svg)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue.svg)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Database-Cloud%20Firestore-FFCA28.svg)](https://firebase.google.com)
[![PayPal](https://img.shields.io/badge/Payments-PayPal%20Sandbox-003087.svg)](https://developer.paypal.com)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-4285F4.svg)](https://ai.google.dev)

> **PayPal AI Hackathon 2026 Submission**  
> An autonomous AI financial copilot, milestone escrow engine, and cross-border billing platform built on the **PayPal Developer Platform** for global freelancers and independent operators.

---

## 1. Executive Summary & Problem

Global freelancers deliver world-class engineering, design, and consulting work to international clients, with PayPal serving as their primary payment bridge. However, managing cross-border freelance finance is fraught with friction:
1. **Manual Invoicing & Math Errors:** Creating invoices in spreadsheets or documents frequently leads to incorrect tax calculations and currency confusion.
2. **Payment Chasing & Overdue Anxiety:** Following up on overdue invoices is uncomfortable and time-consuming.
3. **Silent Fee & FX Attrition:** Cross-border clearing fees and foreign exchange rate margins erode take-home income:
   $$\text{Take-Home Income} = \text{Invoice Gross} - (\text{Gateway Fees} + \text{FX Spread Loss})$$
4. **Unprotected Deliverables & Client Ghosting:** Delivering milestone work without upfront authorization leaves contractors unprotected against delayed sign-offs or disappearing clients.
5. **Tax & Runway Blindspot:** Freelancers often have no clear visibility into their actual quarterly net income or how much to set aside for advance tax.

**FreelancePay AI** provides an institutional-grade financial command center that handles the entire lifecycle: **natural-language invoicing, two-phase milestone escrow on PayPal rails, tone-adaptive outreach, real-time USD/EUR/INR currency intelligence, autonomous tax shielding, and cashflow forecasting.**

---

## 2. Core Feature Highlights

### ⚡ Core Invoicing & PayPal Rails
- **Natural Language Invoice Builder (`/invoices/new`):** Generates structured PayPal invoices from conversational prompts (e.g., *"Invoice Horizon Studio $5,500 for Design System tokens, Net-14 terms"*).
- **Two-Phase Milestone Escrow (`/milestones`):** Built on the **PayPal Orders API**. Clients authorize payment upfront; funds are held in an authorized hold state and captured only when deliverables are approved.
- **Instant PayPal Sandbox Checkout & Refunds (`/invoices/[id]`):** Invoices generate live PayPal checkout orders. Full or partial dispute refunds execute directly via the PayPal REST API.
- **Directional Receivable Transparency (`/invoices`):** Prominently tags outgoing client invoices with clear `RECEIVABLE — Client owes you` badges.

### 🌐 Live Multi-Currency Engine (USD, EUR, INR ₹)
- **Zero-Corruption Architecture:** Invoices and transactions are stored immutably in their native currency.
- **Live Exchange Rate Synchronization:** Dashboard totals, KPI summaries, and reports convert on-the-fly using live exchange rates from `open.er-api.com` ($1 \text{ USD} \approx \text{₹}94.11 \approx €0.8958$) with 1-hour caching and offline resilience.
- **Authentic Regional Formatting:** Supports Indian numbering notation (e.g., `₹1,23,456.78`) alongside European and US formatting.
- **Persistent Preferences:** The user's selected display currency synchronizes across sessions via Firestore user profiles and local storage.

### 🧠 Grounded Gemini AI Copilot & Cashflow Rescue
- **Deterministic Math Core:** Zero hallucinated arithmetic. All financial aggregates, fees, and currency conversions are computed using strict fixed-point integer cents in TypeScript:
  $$\text{Cents} = \operatorname{round}(\text{Amount} \times 100), \quad \text{Total} = \frac{\sum \text{Cents}_i}{100}$$
- **AI Financial Copilot (`/ai/copilot`):** Conversational AI grounded in verified database records, providing clear cashflow forecasts, client reliability insights, and expense answers.
- **Tone-Adaptive Smart Outreach:** Invoices nearing or past due trigger multi-tiered follow-up drafts across three distinct registers: *Diplomatic & Polite*, *Firm & Contractual*, or *Urgent Pre-Collections*.
- **Cashflow Rescue Mode (`/ai/rescue`):** Automated diagnostic analyzing accounts receivable aging, burn rate, and a 3-step prioritized liquidity recovery strategy.
- **Human-in-the-Loop Safety:** The AI never moves funds, sends client emails, or initiates refunds without explicit user approval.

### 📊 Institutional Transaction Ledger & Treasury
- **Authoritative 6-Metric Ledger (`/payments/transactions`):**
  $$\text{Net Cash Received} = \text{Gross Settled Inflows} - \text{Processing Fees} - \text{FX Costs} - \text{Refunds \& Reversals}$$
  Strictly segregates settled money from pending authorizations to prevent phantom income or double-counting.
- **Autonomous Tax Shield Vault (`/treasury`):** Automatically reserves 20%–25% of settled inflows into a virtual tax reserve.
- **Cashflow Velocity & Runway:** Real-time runway calculations based on verified liquid reserves and average monthly burn rate.

---

## 3. Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | [Next.js 15](https://nextjs.org) (App Router, React 19, Standalone Output) |
| **Language** | [TypeScript 5.7](https://www.typescriptlang.org) |
| **Styling & Design** | Tailwind CSS with custom Auric Glassmorphism tokens and Google Material Symbols |
| **Database & Persistence** | [Google Cloud Firestore](https://firebase.google.com) via Firebase Admin SDK with Prisma-compatible abstraction adapter |
| **Payment Platform** | [PayPal Developer Platform](https://developer.paypal.com) (Invoicing API, Orders v2 Authorize/Capture, Payments & Refunds, Webhooks) |
| **AI & LLM** | [Google Gemini](https://ai.google.dev) with deterministic financial rule engine fallback |
| **Authentication** | Secure HTTP-only session cookies, bcrypt password hashing, and rate-limited endpoints |
| **Transactional Email** | [Resend](https://resend.com) API with nodemailer SMTP fallback |
| **Exchange Rates** | Open Exchange Rates API (`open.er-api.com`) with in-memory caching |

---

## 4. Architectural Overview

```mermaid
flowchart TD
    User["Freelancer / Client"] -->|HTTPS / Next.js 15| UI["Atmospheric Glassmorphic UI"]
    UI -->|Authenticated Session (HTTP-Only Cookie)| API["Next.js App Router API Routes"]
    
    subgraph DataLayer["Persistence & Safety Layer"]
        Firestore[("Google Cloud Firestore")]
        Cache["Session & Exchange Rate Cache"]
        FixedPoint["Deterministic Fixed-Point Arithmetic (toCents/fromCents)"]
    end

    subgraph ExternalRails["External Infrastructure"]
        PayPal["PayPal Sandbox REST APIs (Invoicing, Orders, Refunds)"]
        Gemini["Google Gemini AI (Flash / Pro with Tool-Calling)"]
        Resend["Resend Transactional Email Engine"]
        RatesAPI["Open Exchange Rates API (open.er-api.com)"]
    end

    API --> DataLayer
    API --> ExternalRails
```

---

## 5. Getting Started & Local Setup

### Prerequisites
- **Node.js** `20.x` or higher (Recommended: Node 22 LTS)
- **npm** `10.x` or higher

### Quickstart Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Navi-31/FreeLancePayAI_PayPal_AI_Hackathon.git
   cd FreeLancePayAI_PayPal_AI_Hackathon
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env.local
   ```
   *Edit `.env.local` to provide your credentials (see Section 6 below).*

4. **Start local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Environment Variables Guide

FreelancePay AI operates with **graceful fallback resilience**: it runs cleanly in simulated/demo mode out of the box, activating live external cloud rails as keys are provided.

| Variable Name | Description | Default / Fallback Mode |
| :--- | :--- | :--- |
| `JWT_SECRET` | Secret key for session cookie encryption | Set a high-entropy string (e.g. `openssl rand -base64 32`) |
| `FIREBASE_PROJECT_ID` | Google Cloud / Firebase Project ID | Connects to Firestore; falls back to demo mode if omitted |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin Service Account email | Required for live Firestore persistence |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin Service Account private key | Required for live Firestore persistence |
| `PAYPAL_CLIENT_ID` | PayPal Developer Sandbox Client ID | Activates live PayPal Sandbox token issuance |
| `PAYPAL_CLIENT_SECRET` | PayPal Developer Sandbox Secret | Required for live PayPal Sandbox orders/invoices |
| `PAYPAL_BASE_URL` | PayPal REST API endpoint | Defaults to `https://api-m.sandbox.paypal.com` |
| `PAYPAL_ENVIRONMENT` | PayPal execution environment | `sandbox` or `production` |
| `GEMINI_API_KEY` | Google Gemini API Key | Optional. When omitted, activates deterministic fallback |
| `GEMINI_MODEL` | Google Gemini model identifier | Defaults to `gemini-3.5-flash` |
| `RESEND_API_KEY` | Resend API key for transactional emails | Optional. When omitted, uses SMTP or logs dispatches to audit ledger |
| `EMAIL_FROM` | Sender identity header | Defaults to `FreelancePay AI <notifications@freelancepay.ai>` |

---

## 7. Demo Account & Hackathon Evaluation

For evaluators and judges:
1. **Interactive Demo Mode:** Access [http://localhost:3000](http://localhost:3000). The app initializes with realistic cross-border client engagements, invoices, milestone escrows, and fee breakdowns.
2. **Currency Switching:** Click **USD**, **EUR**, or **INR** in the top navigation bar to test dynamic multi-currency conversions across the entire application.
3. **PayPal Sandbox Testing:** Navigate to any invoice or milestone to test PayPal order generation, authorization hold, deliverable capture, and refund execution.
4. **AI Copilot & Rescue:** Navigate to `/ai/copilot` and `/ai/rescue` to test natural-language queries, tone-adaptive reminder generation, and cashflow risk analysis.

---

## 8. License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
