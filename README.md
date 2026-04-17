# Agent Arena

Agent Arena is a Fuji testnet auto-battler scaffold built around three pieces: on-chain character and loot contracts, token-bound accounts for inventory ownership, and a Next.js frontend for demoing the full loop.

## What is in this repo

- ERC-8004-style identity and reputation registries for agents and pets.
- ERC-6551-style token-bound accounts for character-owned loot.
- A `GameCore` contract with registration, pet assignment, mood updates, and battle resolution.
- An `ItemNFT` contract and marketplace for loot trading.
- A Fuji-ready deployment script and Foundry tests.
- A Next.js frontend scaffold with Wagmi, RainbowKit, and Tailwind.
- A simple off-chain mood runner that turns action logs into mood/personality updates.

## Layout

- `contracts/` Solidity contracts.
- `script/` Foundry deployment scripts.
- `test/` Foundry tests.
- `frontend/` Next.js app.
- `scripts/` off-chain Node utilities.

## Prerequisites

- Node.js 20+
- Foundry
- A Fuji RPC endpoint
- A wallet with test AVAX for deployments and demo writes

## Foundry setup

```bash
forge build
forge test
```

## Deploy to Fuji

The deploy script creates the character NFT, registries, token-bound account registry, game core wrapper, and marketplace, then points the reputation registry at the deployed game core.

```bash
export PRIVATE_KEY=<YOUR_PRIVATE_KEY>
forge script script/Deploy.s.sol \
	--rpc-url https://api.avax-test.network/ext/bc/C/rpc \
	--broadcast
```

If you want to target a different Fuji RPC, set it in the command above. The script prints all deployed addresses at the end.

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Populate `.env.local` with the deployed addresses from the script output.

## Off-chain mood runner

The AI runner reads a JSON action log and emits a mood/personality recommendation.

```bash
node scripts/ai-runner.mjs ./scripts/sample-actions.json
```

Input format:

```json
{
	"tokenId": 2,
	"currentMood": 0,
	"personality": 1,
	"actions": [
		{ "type": "attack", "success": true },
		{ "type": "defend", "success": false }
	]
}
```

## Demo flow

1. Deploy the contracts to Fuji.
2. Register an agent and a pet in the frontend.
3. Assign the pet, adjust mood, and run a battle.
4. Let the winner's token-bound account hold loot.
5. List or buy loot through the marketplace.

## Notes

- The on-chain pieces are scaffolded for a hackathon flow, not hardened for production security.
- The frontend expects deployed addresses in environment variables and will still render a useful shell if they are missing.

## GitHub Actions – AI Test Loop

This repo uses an AI-powered test-fix loop that runs automatically on every push and pull request (except `main`).

### Required: Add Repository Secrets

Before pushing, you must add the following secrets to your GitHub repository, or the workflow will fail:

| Secret Name | Description |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare Account ID |
| `CLOUDFLARE_API_KEY` | Your Cloudflare API Key |

**How to add secrets:**
1. Go to your repository on GitHub
2. Navigate to **Settings -> Secrets and variables -> Actions**
3. Click **"New repository secret"**
4. Add each secret listed above

### What it does

On every push/PR to a non-`main` branch, the workflow:
1. Checks out your repository
2. Verifies Docker and Docker Compose are available
3. Runs the AI test-fix loop via `docker compose up`
4. Cleans up containers and volumes after completion

The workflow file lives at `.github/workflows/ai-test-loop.yml`.
