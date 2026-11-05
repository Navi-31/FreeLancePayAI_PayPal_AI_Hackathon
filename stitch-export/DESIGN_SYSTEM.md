## Brand & Style
The design system embodies the executive precision of an elite private wealth concierge merged with next-generation autonomous AI tooling. It caters to high-earning independent operators, consultants, and creative technologists who demand institutional-grade financial telemetry without bureaucratic friction.

The aesthetic philosophy balances **Atmospheric Glassmorphism** with **Technical Precision Minimalist luxury**:
- Deep, obsidian voids provide a canvas of zero visual noise.
- Metallic champagne and auric gold accents signify liquidity, yield, and high-value transactions.
- Deep electric violet radiant glows demarcate autonomous algorithmic intelligence, predictive cash-flow calculations, and automated tax actions.
- Interfaces evoke confidence, exclusivity, calm focus, and total fiscal mastery.

## Layout & Spacing
The layout operates on an uncompromising 8pt mathematical cadence within a fluid responsive grid.

### Grid Architecture
- **Desktop (1440px+)**: 12-column layout with 24px (`1.5rem`) gutters and a max canvas width of 1600px. Persistent analytical utility rail or AI terminal dock.
- **Tablet (768px – 1439px)**: 8-column layout with 16px (`1rem`) gutters, collateral drawers collapsing into overlays.
- **Mobile (< 768px)**: 4-column layout with 12px gutters and 20px (`margin-mobile`) horizontal boundary padding.

### Spacing Philosophy
Negative space is treated as an active luxury material. Generous internal padding prevents density fatigue across dense financial dashboards. Dense data clusters (such as split invoice items) use `space-xs` and `space-sm`, while top-tier layout containers and AI execution summaries separate via `space-xl`.

## Elevation & Depth
Depth is produced via light transmission and optical refraction, avoiding opaque drop shadows.

### Glassmorphism Stack
- **Level 1 (Base Panel)**: `#171720` at 80% opacity, layered with `backdrop-filter: blur(16px)` and a continuous edge stroke of `1px solid rgba(255, 255, 255, 0.05)`.
- **Level 2 (Interactive Floating Glass)**: `#1E1D29` at 85% opacity, `backdrop-filter: blur(24px)`, with top edge highlighted by `1px solid rgba(240, 212, 139, 0.20)` (auric reflection).
- **Level 3 (Modal / Command Palette)**: `#101016` at 92% opacity, `backdrop-filter: blur(32px)`, bordered by `1px solid rgba(150, 101, 255, 0.25)`.

### Chromatic Light Emissions
- **Intelligence Field**: Modals driven by the AI copilot generate a soft, omnidirectional radiance: `0 0 40px -10px rgba(112, 64, 219, 0.35)`.
- **Gold Liquidity Halo**: Focused treasury or revenue cards deploy an ultra-diffuse auric presence: `0 20px 50px -15px rgba(214, 173, 85, 0.12)`.

## Components

### Buttons & Interactive Triggers
- **Primary (Auric Payout / Action)**: Linear gradient background (`135deg, #F0D48B 0%, #D6AD55 100%`) with deep `#08080D` text in `label-md` weight. Subdued bottom inner shadow (`inset 0 -1px 0 rgba(0,0,0,0.3)`). Hover generates a subtle gold glow (`0 0 20px rgba(240, 212, 139, 0.35)`).
- **Secondary (AI Synthesized Action)**: Electric violet gradient (`135deg, #9665FF 0%, #7040DB 100%`) with pure white text and atmospheric violet bloom on hover.
- **Glass / Ghost**: Base of `#171720` at 50% opacity, bordered by `rgba(255, 255, 255, 0.08)`. Text rendered in `#F7F7FA`.

### Glass Cards
- Built using elevated Level 1 and Level 2 surfaces.
- Incorporate a 1px linear gradient border (`to bottom, rgba(255,255,255,0.12), rgba(255,255,255,0.01)`).
- Headers include a Lucide icon rendered inside a 36x36px soft pill with a subtle violet or gold surface wash.

### Form Inputs & Telemetry Fields
- Deep charcoal fill (`#101016`) set inside a 1px border (`rgba(255, 255, 255, 0.08)`).
- **Focus State**: Border transitions to Champagne Gold (`#F0D48B`) with an ambient outer ring `0 0 0 3px rgba(214, 173, 85, 0.15)`.
- Numeric inputs automatically surface inline currency indicators (`USD`, `EUR`, `SOL`, `BTC`) locked in muted uppercase `label-sm`.

### Chips & Badges
- **Settled / Invoiced**: Glass background with `#F0D48B` typography, auric dot status indicator.
- **AI Automated**: `#7040DB` at 15% opacity with `#9665FF` text, featuring an animated spark/pulse.
- **Escrow / Pending**: `#F4CF45` at 12% opacity with warm yellow text.

### Selection Controls (Checkboxes & Radios)
- Base: Unchecked states exhibit a 1px hollow frame in `rgba(255, 255, 255, 0.20)` over `#101016`.
- Active: Filled with primary gold gradient, displaying an obsidian vector checkmark or nested radio dot.

### Specialized System Elements
- **Autonomous Stream Feed**: Infinite-scroll micro-ledger detailing automated fractional tax allocations, client view triggers, and auto-conversion rates.
- **Dynamic Yield Sparkline**: Minimalist SVG vector charts using gradient stroke (`#9665FF` transitioning to `#F0D48B`) set against frictionless transparent baselines.