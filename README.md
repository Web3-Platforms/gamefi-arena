# AI Arena — GameFi Platform

AI Arena is a GameFi platform built for the **OneHack 3.0 hackathon**. Players mint AI-powered NFT fighters, train their neural-network stats, battle other fighters, and earn ONE tokens.

> **Current Status:** Core game loop (mint → train → battle → earn) is fully functional with a simulated blockchain backend. Real OneChain mainnet integration and several advanced features are planned — see [Roadmap](#roadmap) below.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm workspaces |
| Runtime | Node.js 24 |
| Language | TypeScript 5.9 |
| API | Express 5 |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod (`zod/v4`), `drizzle-zod` |
| API codegen | Orval (from OpenAPI spec) |
| Build | esbuild (CJS bundle) |
| Frontend | React + Vite + Tailwind CSS + shadcn/ui + framer-motion |

---

## Project Structure

```text
gamefi-arena/
├── artifacts/
│   ├── api-server/         # Express API server (port 8080, path /api)
│   └── ai-arena/           # React + Vite frontend (port 25941, path /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (smoke test, etc.)
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm (`npm install -g pnpm`)
- PostgreSQL database

### Install dependencies

```bash
pnpm install
```

### Configure environment

Create a `.env` file (or set environment variables) with your PostgreSQL connection string:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/ai_arena
```

### Push database schema

```bash
pnpm --filter @workspace/db run push
```

### Run the API server (development)

```bash
pnpm --filter @workspace/api-server run dev
```

The API server starts on **port 8080** at `/api`.

### Run the frontend (development)

```bash
pnpm --filter @workspace/ai-arena run dev
```

The frontend starts on **port 25941** at `/`.

### Type-check everything

```bash
pnpm run typecheck
```

### Run codegen (OpenAPI → React Query hooks + Zod schemas)

```bash
pnpm --filter @workspace/api-spec run codegen
```

### Smoke test (requires API server running)

```bash
bash scripts/smoke-test.sh
```

Verifies: unauthenticated session, wallet connect, mint, train, battle, transaction history, and platform stats.

---

## Implemented Features

### Frontend Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home / HQ | Platform stats, top fighters leaderboard, hero section |
| `/connect` | Wallet Connect | Simulated wallet (any string becomes a wallet address) |
| `/fighters` | My Roster | List fighters, mint new AI fighters (costs 10 ONE) |
| `/arena` | Battle Arena | Pick fighters, watch animated combat log replay |
| `/training` | Training Center | Spend ONE tokens to improve fighter stats |
| `/wallet` | Wallet | Balance, staked tokens, transaction history |

### API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/connect` | Connect wallet (create/load user + wallet) |
| GET | `/api/auth/session` | Get current session via cookie |
| POST | `/api/auth/disconnect` | End session |
| GET | `/api/fighters` | List user's fighters |
| POST | `/api/fighters` | Mint fighter (costs 10 ONE) |
| GET | `/api/fighters/all` | All fighters (for battle matchmaking) |
| GET | `/api/fighters/:id` | Get fighter details |
| POST | `/api/fighters/:id/train` | Train fighter (`BASIC`/`ADVANCED`/`INTENSIVE`/`AI_OPTIMIZED`) |
| GET | `/api/battles` | Battle history |
| POST | `/api/battles` | Create + simulate battle |
| GET | `/api/battles/:id` | Battle details + log |
| GET | `/api/wallet` | Wallet balance |
| GET | `/api/wallet/transactions` | Transaction history |
| POST | `/api/wallet/stake` | Stake ONE tokens (5% reward on unstake) |
| POST | `/api/wallet/unstake` | Unstake + claim rewards |
| GET | `/api/stats` | Platform-wide statistics |

### Database Schema

| Table | Purpose |
|-------|---------|
| `users` | Wallet address + account |
| `fighters` | NFT fighters with AI stats (aggression, defense, speed, power, intelligence) |
| `battles` | Battle records with full round-by-round `battleLog` JSON |
| `wallets` | ONE token balances (staking support) |
| `transactions` | Full ledger (mint, train, battle entry/reward, stake/unstake) |
| `training_sessions` | Training history |
| `sessions` | Server-side session tokens (HttpOnly cookie, 7-day TTL) |

### AI Combat Engine

Round-by-round simulation (`artifacts/api-server/src/lib/combat.ts`):

- Attack damage = `power × 120 + aggression × 80 + speed × 40` minus `defense × 90 + intelligence × 30`
- Critical hits triggered by `intelligence` stat (up to 1.5× multiplier)
- Speed determines who strikes first each round
- Up to 30 rounds per battle, with variance and named moves

### Token Economics (Simulated)

| Action | Cost / Reward |
|--------|--------------|
| Starting balance | 100 ONE |
| Mint fighter | −10 ONE |
| Battle entry fee | −5 ONE |
| Battle win reward | +15 ONE |
| Training — BASIC | −5 ONE |
| Training — ADVANCED | −15 ONE |
| Training — INTENSIVE | −30 ONE |
| Training — AI_OPTIMIZED | −50 ONE |
| Staking reward | +5% on unstake |

### Authentication

AI Arena uses **server-side session tokens** — not raw wallet addresses in cookies:

1. `POST /api/auth/connect` accepts a wallet address → creates/loads user + wallet, generates an opaque session UUID stored in the `sessions` table, and sets an HttpOnly `ai_arena_sid` cookie.
2. `GET /api/auth/session` validates the session ID (checking expiry) → returns `200 + session JSON` or `204 No Content` if invalid/missing.
3. Protected routes use `requireUser()` → `getSessionUser()` which queries the sessions table. Forged or expired session IDs return 401.
4. Sessions expire after 7 days. `POST /api/auth/disconnect` deletes the session and clears the cookie.
5. In production (`NODE_ENV=production`), the `Secure` cookie flag is added.

> **Note:** The current wallet connect flow accepts any string as a wallet address (fully simulated). For production, replace with a SIWE (Sign-In With Ethereum) flow and add CSRF tokens.

---

## Roadmap

The following features are planned and tracked as open issues:

| # | Feature | Label |
|---|---------|-------|
| [#1](../../issues/1) | 🔗 OneChain Mainnet Integration | `blockchain`, `priority: high` |
| [#2](../../issues/2) | 📜 Smart Contract Deployment on OneChain | `blockchain`, `smart-contracts`, `priority: high` |
| [#3](../../issues/3) | 🖼️ IPFS Metadata & NFT Fighter Images | `nft`, `frontend` |
| [#4](../../issues/4) | 🏆 Leaderboard & ELO Rating System | `game-mechanics`, `frontend` |
| [#5](../../issues/5) | 🛒 Fighter Marketplace | `game-mechanics`, `marketplace` |
| [#6](../../issues/6) | 🎯 Tournament System with Prize Pools | `game-mechanics`, `priority: medium` |
| [#7](../../issues/7) | 📱 Mobile App (Expo / React Native) | `mobile`, `priority: medium` |
| [#8](../../issues/8) | 🤖 Advanced Neural Network Combat Engine | `game-mechanics`, `ai` |
| [#9](../../issues/9) | 🔒 Security Audit & Hardening | `security`, `priority: high` |
| [#10](../../issues/10) | 📚 Documentation & Developer Onboarding | `documentation` |
| [#11](../../issues/11) | ⚡ Performance, Caching & Real-time Updates | `performance` |
| [#12](../../issues/12) | 🎨 UI/UX Polish & Battle Animations | `ux`, `frontend` |

---

## License

MIT
