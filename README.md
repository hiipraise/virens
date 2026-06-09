# Virens — Frontend-Only Visual Discovery Platform

Virens is a polished creator-centric visual discovery app that runs entirely in the browser. It has no API server, database, authentication provider, payment gateway, cloud storage, or external data dependency.

The application ships with realistic mock creators, pins, collections, reports, notifications, ads, payments, uploads, and account flows. Runtime changes are stored in `localStorage`/`sessionStorage`, making the experience self-contained while still feeling like a production product prototype.

## Architecture

```
virens/
├── apps/
│   └── web/          — React 18 + Vite + TailwindCSS + Framer Motion
├── packages/
│   └── shared/       — Shared TypeScript constants and types
├── docker-compose.yml
└── turbo.json        — Frontend-only Turborepo pipeline
```

## What “frontend-only” means here

- **Mock API adapter**: `apps/web/src/lib/api.ts` exposes the same helper interface the UI expects, but all routes resolve against local in-browser state.
- **Local sessions**: login, register, logout, and refresh are simulated with local state rather than cookies, JWTs, or an auth provider.
- **Client-side uploads**: uploaded files are previewed via browser object URLs and added to the local pin feed.
- **Simulated payments**: subscription and ad payment flows redirect to an internal callback URL and verify against locally-created payment records.
- **No remote assets**: seeded media and avatars are generated as inline SVG data URLs; fonts use system fallbacks.
- **No backend containers**: Docker Compose builds and serves only the static frontend.

## Quick Start

### Prerequisites

- Node 20+
- pnpm 9+

### Install

```bash
pnpm install
```

### Develop

```bash
pnpm dev:web
```

Open <http://localhost:3000>.

### Build

```bash
pnpm build:web
```

### Docker

```bash
docker compose up --build
```

The static app is served on <http://localhost:3000>.

## Demo Accounts

Any email/password can be used because authentication is simulated. Useful seeded usernames/emails include:

| Role | Username | Email |
| --- | --- | --- |
| Superadmin | `nova` | `nova@virens.local` |
| Creator | `miralens` | `miralens@virens.local` |
| Creator | `kaiworks` | `kaiworks@virens.local` |
| Creator | `amastudio` | `amastudio@virens.local` |
| User | `guest` | `guest@virens.local` |

## Feature Set

- Responsive discovery feed with For You, Trending, Latest, tags, infinite paging, and masonry layout.
- Pin details, related content, comments, likes, saves, reposts, shares, and simulated downloads.
- Creator profiles with pins and collections.
- Local uploads with metadata, commerce flags, watermark/protection flags, and mock media handling.
- Collections, notifications, reports, profile editing, payout details, ad campaigns, and subscription flow.
- Admin dashboards and moderation/user-management views backed by local mock data.

## State Reset

To reset the app to seeded data, clear site data for the app origin or remove these browser storage keys:

- `virens.frontend.state.v2`
- `virens.frontend.session`
- `virens.pendingAdDraft`

## Scripts

```bash
pnpm dev:web       # Vite dev server
pnpm build:web     # TypeScript + production build
pnpm type-check    # TypeScript checks for the frontend
pnpm lint          # ESLint for the frontend
```

## License

MIT © Virens
