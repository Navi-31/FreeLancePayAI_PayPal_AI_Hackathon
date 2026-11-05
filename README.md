# FreelancePay AI — Autonomous Wealth Engine

Autonomous AI Financial Command Center and Private Wealth Concierge for Independent Operators.

---

## Architecture Overview

* **Framework:** Next.js 15 (App Router)
* **Language:** TypeScript (Strict mode)
* **Styling:** Tailwind CSS with custom design tokens from Stitch
* **Design Philosophy:** Atmospheric Glassmorphism & Minimalist Luxury
* **Typography:** Geist (Headings & Financial Numerals) & Inter (Body & Feed Text)
* **Icons:** Google Material Symbols Outlined & Lucide Icons

---

## Directory Structure

```
├── stitch-export/              # Staged original Stitch screens & design system
│   ├── DESIGN_SYSTEM.md        # Stitch design system specification
│   ├── theme-tokens.json       # Exact color and typography tokens
│   ├── screens-manifest.json   # Inventory of all 22 screens
│   └── screens/*.html          # 22 validated raw HTML screen exports
├── src/
│   ├── app/                    # Next.js App Router (Layout & Pages)
│   ├── components/             # Reusable UI, Layout, Glass and Modal components
│   ├── features/               # Domain-specific feature modules
│   ├── config/                 # Application design tokens and theme configuration
│   ├── lib/                    # Shared utilities
│   ├── services/               # API clients and data handlers
│   ├── hooks/                  # Custom React hooks
│   └── types/                  # TypeScript interface definitions
├── tailwind.config.ts          # Tailwind theme extended with Stitch design tokens
├── tsconfig.json               # TypeScript configuration with path alias @/*
└── package.json
```

---

## Getting Started

### Prerequisites

* Node.js `22.x` or higher
* npm `11.x` or higher

### Installation

```bash
npm install
```

### Development Server

Run the development server locally:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Production Build

Verify TypeScript compilation and create a production build:

```bash
npm run build
```

Run the production server:

```bash
npm run start
```

### Type Checking & Linting

```bash
npm run typecheck
npm run lint
```
