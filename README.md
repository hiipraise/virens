# Virens — Creator-Centric Visual Discovery Platform

> Spotify-inspired design (#1DB954 · #191414 · #FFFFFF) · Monorepo · React + FastAPI + MongoDB

---

## Architecture Overview

```
virens/
├── apps/
│   ├── web/          — React 18 + Vite + TailwindCSS + Framer Motion
│   └── api/          — Python FastAPI + MongoDB (Beanie ODM)
├── packages/
│   └── shared/       — Shared TypeScript types
├── docker-compose.yml
└── turbo.json        — Turborepo pipeline
```

---

## Quick Start

### Prerequisites
- Node 20+ and pnpm 9+
- Python 3.12+
- MongoDB 7 (local or Atlas)
- Redis 7 (local or cloud)

### 1. Clone and Install

```bash
git clone https://github.com/yourorg/virens.git
cd virens
pnpm install
```

### 2. Configure Environment

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Fill in your keys
```

### 3. Start (Development)

```bash
# All services via Docker Compose
docker compose up

# Or individually
pnpm dev:web     # http://localhost:3000
pnpm dev:api     # http://localhost:8000
```

### 4. API Documentation

When `DEBUG=true`, visit:
- Swagger UI: http://localhost:8000/docs
- Redoc: http://localhost:8000/redoc

---

## Feature Architecture

### Content Types
- **Images** — PNG, JPG, WebP, AVIF (up to 100MB)
- **Videos** — MP4, WebM, MOV (up to 100MB, 5min)
- **GIFs** — Animated GIF

All uploads preserve original resolution metadata (`originalWidth`, `originalHeight`, `aspectRatio`).

### Digital Asset Management (DAM)
- **Download Permissions**: `free` | `subscribers_only` | `paid` | `none`
- **Protected View Mode**: disables right-click, drag-download, applies CSS overlay
- **Visible Watermark**: username overlaid diagonally on the image
- **Invisible Watermark**: LSB steganography via `stegano` library — creator ID embedded in pixels
- **Screenshot Deterrence**: CSS `pointer-events: none` overlay layer

### Recommendation Engine (`apps/api/app/algorithms/recommendation.py`)
"More Like This" scored on:
| Signal | Weight |
|--------|--------|
| Tag overlap (Jaccard) | 35% |
| Engagement score | 30% |
| Visual similarity (perceptual hash) | 20% |
| Creator similarity (followed) | 15% |

Personalised feed:
1. Builds weighted tag profile from user's liked pins
2. Fetches pins by followed creators + top tags
3. Back-fills with trending if insufficient

### Report Prioritization (`apps/api/app/algorithms/report_priority.py`)
Priority 0–10 based on:
- **Report type**: copyright (9) > plagiarism (8) > harassment (7) > ...
- **Reporter credibility**: 0–10 score
- **Verified creator bonus**: +1.5
- **Repeat reports on same target**: +0.5 per report (max +2.0)

**Repeat Infringer Policy**: 5 strikes → automatic account suspension.

**Appeal System**: Creators can appeal at `POST /v1/reports/appeal/:pin_id`.

### RBAC Roles
| Role | Permissions |
|------|------------|
| `superadmin` | All permissions, no ad payments |
| `admin` | Moderation, user management, no ad payments |
| `staff` | Content review, no ad payments |
| `creator` | Upload, sell, run ads (paid) |
| `user` | Browse, engage, subscribe |

### Monetization
1. **Direct Sales** — Slashed pricing UI (`₦40,000 → ₦12,000 · Save 70%`)
2. **Subscriptions** — Basic ₦1,500 / Pro ₦4,500 / Creator Support ₦9,000 per month
3. **Self-serve Ads** — Promoted Pins (₦5,000–₦50,000), Promoted Profile (₦3,000–₦30,000)
4. **Creator Payouts** — Minimum ₦10,000 via Paystack bank transfer or Stripe

### Payments
- **Primary**: [Paystack](https://paystack.com) — Naira (₦), Nigerian bank transfers
- **Secondary**: [Stripe](https://stripe.com) — International card payments

### AI Features (Groq llama-3.1-8b-instant — free tier)
- Automatic tag suggestion on upload
- Duplicate image detection (perceptual hash)
- Copyright similarity scanning

### SEO
Dynamic `<Helmet>` meta tags per page:
- Feed: platform-level OG tags
- Pin: `og:title`, `og:image`, `og:type=article`
- Profile: `og:type=profile`
- Collection: `og:image` from cover

---

## API Reference (Key Endpoints)

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/auth/register` | Create account |
| POST | `/v1/auth/login` | Login → access_token + httpOnly refresh cookie |
| POST | `/v1/auth/refresh` | Rotate access token using cookie |
| GET | `/v1/auth/me` | Current user |

### Pins
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/pins/upload` | Upload pin (multipart) |
| GET | `/v1/pins/:id` | Get pin + engagement state |
| GET | `/v1/pins/:id/related` | "More Like This" |
| POST | `/v1/pins/:id/like` | Toggle like |
| POST | `/v1/pins/:id/save` | Toggle save |
| POST | `/v1/pins/:id/repost` | Toggle repost |
| POST | `/v1/pins/:id/download` | Request download URL |
| DELETE | `/v1/pins/:id` | Delete pin |

### Feed
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/feed?mode=personalized\|trending\|latest` | Paginated feed |

### Users
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/users/:username` | Public profile |
| GET | `/v1/users/:username/pins?tab=pins\|liked\|reposts` | Profile tabs |
| POST | `/v1/users/:username/follow` | Toggle follow |
| PATCH | `/v1/users/me` | Update profile |

### Reports
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/reports` | Submit report |
| POST | `/v1/reports/appeal/:pin_id` | Appeal removal |
| GET | `/v1/reports` | Admin: list reports |

### Payments
| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/payments/initiate` | Start Paystack or Stripe flow |
| GET | `/v1/payments/verify/:ref` | Verify payment, activate subscription |
| POST | `/v1/payments/payout` | Request creator payout |

---

## Security Notes
- JWT access tokens stored **in-memory only** (no localStorage)
- Refresh tokens stored in **httpOnly cookies** (`/v1/auth` path-scoped)
- Protected media: right-click disabled, drag blocked, CSS overlay, optional canvas rendering
- Invisible watermarks survive screenshots of original files

---

## Transparency Reports
The admin dashboard publishes periodic moderation stats:
- Content removed (count + reason breakdown)
- Appeal success rate
- Average review time per category

---

## License
MIT © Virens
