# AI Arena — GameFi Platform

## Overview

AI Arena is a GameFi platform for the OneHack 3.0 hackathon. Players mint AI-powered NFT fighters, train their neural network stats, battle other fighters, and earn ONE tokens.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + framer-motion

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (port 8080, path /api)
│   └── ai-arena/           # React + Vite frontend (port 25941, path /)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## AI Arena Features

### Pages
- **/** — Home/HQ: platform stats, top fighters leaderboard, hero section
- **/connect** — Wallet connect (simulated — any string becomes a wallet address)
- **/fighters** — My Roster: list fighters, mint new AI fighters (costs 10 ONE)
- **/arena** — Battle Arena: pick fighters, watch animated combat log replay
- **/training** — Training Center: spend ONE to improve fighter stats
- **/wallet** — Wallet: balance, staked tokens, transaction history

### Database Schema (Drizzle)
- `users` — wallet address + account
- `fighters` — NFT fighters with AI stats (aggression, defense, speed, power, intelligence)
- `battles` — battle records with full round-by-round battleLog JSON
- `wallets` — ONE token balances (staking support)
- `transactions` — full ledger (mint, train, battle entry/reward, stake/unstake)
- `training_sessions` — training history

### API Routes (Express at /api)
- `POST /api/auth/connect` — Connect wallet (create/load user + wallet)
- `GET /api/auth/session` — Get current session via cookie
- `POST /api/auth/disconnect` — End session
- `GET /api/fighters` — List user's fighters
- `POST /api/fighters` — Mint fighter (costs 10 ONE)
- `GET /api/fighters/all` — All fighters (for battle matchmaking)
- `GET /api/fighters/:id` — Get fighter details
- `POST /api/fighters/:id/train` — Train fighter (BASIC/ADVANCED/INTENSIVE/AI_OPTIMIZED)
- `GET /api/battles` — Battle history
- `POST /api/battles` — Create + simulate battle
- `GET /api/battles/:id` — Battle details + log
- `GET /api/wallet` — Wallet balance
- `GET /api/wallet/transactions` — Transaction history
- `POST /api/wallet/stake` — Stake ONE tokens (5% reward on unstake)
- `POST /api/wallet/unstake` — Unstake + claim rewards
- `GET /api/stats` — Platform-wide statistics

### AI Combat Engine (artifacts/api-server/src/lib/combat.ts)
Round-by-round simulation: attack damage is calculated from power × 120 + aggression × 80 + speed × 40, minus defender's defense × 90 + intelligence × 30. Critical hits triggered by intelligence stat. Speed determines who strikes first each round.

### Token Economics
- Starting balance: 100 ONE
- Mint cost: 10 ONE
- Battle entry fee: 5 ONE
- Battle win reward: 15 ONE
- Training costs: 5/15/30/50 ONE (BASIC/ADVANCED/INTENSIVE/AI_OPTIMIZED)
- Staking rewards: 5% on unstake

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. Run `pnpm run typecheck` from root for full type checking.

## Codegen

Run: `pnpm --filter @workspace/api-spec run codegen`

This generates React Query hooks to `lib/api-client-react/src/generated/` and Zod schemas to `lib/api-zod/src/generated/`.

## Database

Development: `pnpm --filter @workspace/db run push`

## Packages

### `artifacts/api-server` (`@workspace/api-server`)
Express 5 API server. Routes in `src/routes/`. Auth via HTTP cookies.
- `pnpm --filter @workspace/api-server run dev` — dev server
- `pnpm --filter @workspace/api-server run build` — esbuild bundle

### `artifacts/ai-arena` (`@workspace/ai-arena`)
React + Vite frontend. Dark cyberpunk GameFi theme.
- `pnpm --filter @workspace/ai-arena run dev` — dev server

### `lib/db` (`@workspace/db`)
Drizzle ORM with PostgreSQL. All tables defined in `src/schema/`.

### `lib/api-spec` (`@workspace/api-spec`)
OpenAPI 3.1 spec + Orval codegen configuration.
