# Halfkilo

AI-powered NFT pet battle game on Avalanche. Mint fighters, battle AI opponents or other players in real-time, and earn loot — all on-chain.

![Lobby](docs/screenshots/lobby.png)

## Screenshots

| Lobby & Character Select | Battle Arena | Avatar Forge |
|:---:|:---:|:---:|
| ![Lobby](docs/screenshots/lobby.png) | ![Battle](docs/screenshots/battle.png) | ![Register](docs/screenshots/register.png) |

> **Add your own screenshots**: Take screenshots and save them to `docs/screenshots/`. Name them `lobby.png`, `battle.png`, `register.png`.

---

## Quick Start

```bash
bash scripts/setup.sh    # installs deps, creates .env files, prompts for API key
npm run dev:all           # starts frontend (:3000) + AI backend (:3002) + WS relay (:8080)
```

Open **http://localhost:3000**

### Gemini API Key (required, free)

1. Go to **https://aistudio.google.com/apikey**
2. Click **Create API key** (no credit card)
3. Paste into `mastra-backend/.env`

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16, React 19, Phaser 3, wagmi, RainbowKit |
| AI Backend | Mastra Core, Google Gemini 1.5 Flash |
| Contracts | Solidity, Hardhat, OpenZeppelin, Avalanche Fuji |
| Transport | WebSocket (ws), Express |

---

## Project Structure

```
halfkilo/
├── frontend/          Next.js app, Phaser game, wallet integration
├── mastra-backend/    AI agent orchestration, Express + WebSocket
├── contracts/         PetNFT.sol, BattleArena.sol, Hardhat
├── scripts/           Setup automation
└── package.json       npm workspaces root
```

---

## Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev:all` | Start everything |
| `npm run dev:frontend` | Next.js on :3000 |
| `npm run dev:mastra` | Mastra API :3002 + WS :3001 |
| `npm run dev:ws` | PvP WebSocket relay :8080 |
| `npm run build` | Build all workspaces |
| `npm run compile:contracts` | Compile Solidity |

---

## Implementation Plan

### Phase 1 — Core Game Loop (DONE)

- [x] Monorepo with npm workspaces
- [x] Character select lobby with sprite-based avatars
- [x] Avatar Forge (register page) with class/outfit/voice selection
- [x] Phaser 3 battle scene with animations
- [x] Wallet connection via RainbowKit + wagmi
- [x] Global profile dropdown (avatar + username + disconnect)
- [x] Singleplayer AI mode (Mastra backend)
- [x] Multiplayer mode (WebSocket relay)

### Phase 2 — Smart Contracts (IN PROGRESS)

- [x] PetNFT.sol — ERC-721 with on-chain stats
- [x] BattleArena.sol — match result commitment
- [ ] **Deploy GameCore contract suite to Fuji** (AgentNFT, PetNFT, ItemNFT, ReputationRegistry, Marketplace, TBARegistry)
- [ ] Wire frontend contract addresses in `.env`
- [ ] Agent minting flow (register page -> on-chain mint)
- [ ] Battle result commitment after each match
- [ ] Loot drops as ItemNFT mints

### Phase 3 — Mastra AI Backend

- [x] Battle tools (battleMove, fetchPetStats, typeMatchup)
- [x] AI agent with Gemini 1.5 Flash
- [x] Match workflow (fetch stats -> battle loop -> commit)
- [x] WebSocket live event streaming
- [ ] **Fix singleplayer end-to-end** — ensure Mastra backend starts cleanly, API key validates, match completes
- [ ] Connect fetchPetStatsTool to real on-chain data (post Phase 2 deploy)
- [ ] Phaser animation sync with Mastra turn events
- [ ] Battle memory persistence (MongoDB)

### Phase 4 — Multiplayer & Deployment

- [ ] **Deploy frontend to subdomain** (e.g. `play.halfkilo.gg`)
  - Option A: Vercel (easiest for Next.js)
  - Option B: AWS EC2 + nginx reverse proxy
- [ ] **Deploy Mastra backend** to same server or separate
  - EC2 `t3.small` with PM2 process manager
  - Env vars set server-side (no user-facing key prompts)
- [ ] **Deploy WebSocket relay** for multiplayer
  - Same EC2 instance, nginx proxies `wss://` to :8080
- [ ] Point subdomain DNS to deployment
- [ ] HTTPS via Let's Encrypt (Caddy or certbot)
- [ ] Matchmaking queue (currently pairs first 2 connections)

### Phase 5 — Polish

- [ ] Battle replay system
- [ ] Leaderboard from ReputationRegistry
- [ ] Marketplace UI for trading NFTs
- [ ] Pet evolution / leveling mechanics
- [ ] Mobile responsive battle scene

---

## Environment Variables

### `mastra-backend/.env`

```bash
GOOGLE_GENERATIVE_AI_API_KEY=     # Required, free: https://aistudio.google.com/apikey
MONGODB_URI=mongodb://localhost:27017  # Optional
PET_NFT_CONTRACT=0x0000000000000000000000000000000000000000
BATTLE_ARENA_CONTRACT=0x0000000000000000000000000000000000000000
DEPLOYER_PRIVATE_KEY=0x           # Fuji testnet only
API_PORT=3002
```

### `frontend/.env`

```bash
NEXT_PUBLIC_MASTRA_WS=ws://localhost:3001
NEXT_PUBLIC_MASTRA_API=http://localhost:3002
NEXT_PUBLIC_CHAIN_ID=43113
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=demo
NEXT_PUBLIC_PET_NFT=
NEXT_PUBLIC_BATTLE_ARENA=
```
