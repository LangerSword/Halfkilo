# Halfkilo — Implementation Plan

## Phase 1 — Core Game Loop (DONE)

- [x] Monorepo with npm workspaces (frontend, mastra-backend, contracts)
- [x] Character select lobby with sprite-based avatars (SpriteFrame component)
- [x] Avatar Forge (register page) — class, outfit, voice selection
- [x] Phaser 3 battle scene with pixel art animations
- [x] Wallet connection via RainbowKit + wagmi (Avalanche Fuji)
- [x] Global profile dropdown — avatar picker, username, disconnect wallet
- [x] Singleplayer AI mode via Mastra backend
- [x] Multiplayer skeleton via WebSocket relay (server.mjs)
- [x] Responsive navbar with profile on all pages

---

## Phase 2 — Smart Contracts (NEXT)

### 2.1 Write the full GameCore contract suite

The frontend ABIs reference these contracts that don't exist yet:

| Contract | Purpose | Status |
|----------|---------|--------|
| **GameCore.sol** | Central coordinator — registerAgent, battle, loot drops | To write |
| **AgentNFT.sol** | ERC-721 for player agents with name, class, metadata | To write |
| **PetNFT.sol** | ERC-721 for pets with stats (hp, attack, defense, etc.) | Done |
| **ItemNFT.sol** | ERC-721 for loot items with power, rarity | To write |
| **ReputationRegistry.sol** | Tracks wins, losses, score per agent | To write |
| **IdentityRegistry.sol** | Maps wallet → agent identity | To write |
| **TBARegistry.sol** | Token-bound accounts for agents owning pets/items | To write |
| **Marketplace.sol** | List/buy/cancel NFT listings | To write |
| **BattleArena.sol** | Match result commitment (for Mastra battles) | Done |

### 2.2 Deploy to Avalanche Fuji

```bash
cd contracts
npx hardhat compile
npx hardhat run scripts/deploy.ts --network fuji
```

### 2.3 Wire contract addresses

After deploy, update `frontend/.env`:
```
NEXT_PUBLIC_GAME_CORE=0x...
NEXT_PUBLIC_AGENT_NFT=0x...
NEXT_PUBLIC_PET_NFT=0x...
NEXT_PUBLIC_ITEM_NFT=0x...
NEXT_PUBLIC_REPUTATION_REGISTRY=0x...
NEXT_PUBLIC_IDENTITY_REGISTRY=0x...
NEXT_PUBLIC_TBA_REGISTRY=0x...
NEXT_PUBLIC_MARKETPLACE=0x...
```

### 2.4 Frontend integration

- Register page → calls `GameCore.registerAgent()` → mints AgentNFT
- Battle page → calls `GameCore.battle()` → resolves on-chain, mints loot
- Inventory page → reads owned AgentNFT, PetNFT, ItemNFT
- Marketplace page → list/buy/cancel via Marketplace contract

---

## Phase 3 — Mastra AI Backend (Fix & Complete)

### 3.1 Get singleplayer working end-to-end

1. Add Gemini API key to `mastra-backend/.env`
2. Start backend: `npm run dev:mastra`
3. Verify `/api/match/start` returns a matchId
4. Verify WebSocket streams turn events
5. Verify battle completes and shows winner

### 3.2 Connect to real on-chain data

- `fetchPetStatsTool` currently uses mock data when contract address is 0x0
- After Phase 2 deploy, update `PET_NFT_CONTRACT` in `mastra-backend/.env`
- Tool will read real stats from chain via viem

### 3.3 Phaser animation sync

Wire Mastra turn events to Phaser BattleScene:
- `MASTRA_TURN_RESULT` → trigger attack/heal animations
- `MASTRA_THINKING` → show thinking indicator on active pet
- `MASTRA_MATCH_OVER` → victory/defeat screen

### 3.4 Battle memory (MongoDB)

- Set `MONGODB_URI` in env
- Uncomment MongoDB storage in `battleMemory.ts`
- Stores battle history for agent learning across sessions

---

## Phase 4 — Deployment (Subdomain)

### 4.1 Frontend deployment

**Option A — Vercel (recommended for Next.js)**
```bash
npm i -g vercel
cd frontend
vercel --prod
```
- Set env vars in Vercel dashboard
- Point subdomain CNAME to Vercel

**Option B — AWS EC2**
```bash
# On EC2 (Ubuntu)
sudo apt update && sudo apt install -y nodejs npm nginx certbot
git clone <repo>
cd Halfkilo && npm install
npm run build --workspace=frontend
# Use PM2 to serve
npm i -g pm2
pm2 start "npm run start --workspace=frontend" --name frontend
```

### 4.2 Mastra backend deployment (AWS EC2)

```bash
# Same or separate EC2 instance
pm2 start "npm run dev --workspace=mastra-backend" --name mastra
# Set env vars in ~/.bashrc or .env file on server
```

### 4.3 WebSocket relay deployment

```bash
# Same EC2 instance
pm2 start "node frontend/server.mjs" --name ws-relay
```

### 4.4 nginx reverse proxy

```nginx
server {
    server_name play.halfkilo.gg;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /api/mastra/ {
        proxy_pass http://127.0.0.1:3002/;
    }

    location /ws/battle {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /ws/pvp {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 4.5 SSL (HTTPS)

```bash
sudo certbot --nginx -d play.halfkilo.gg
```

### 4.6 DNS

Add CNAME or A record:
```
play.halfkilo.gg → <EC2 public IP or Vercel CNAME>
```

---

## Phase 5 — Polish & Features

- [ ] Matchmaking queue (replace first-come-first-paired with lobby system)
- [ ] Battle replay system (store turn data, allow playback)
- [ ] Leaderboard from ReputationRegistry on-chain data
- [ ] Marketplace UI — browse, filter, buy/sell NFTs
- [ ] Pet evolution / leveling mechanics
- [ ] Mobile responsive Phaser scene
- [ ] Sound effects and battle music
- [ ] Social features (friend list, challenge system)
