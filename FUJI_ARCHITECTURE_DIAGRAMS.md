# Avalanche Fuji Testnet Integration - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE                             │
│                      (React @ localhost:3000)                       │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Browse     │  │   Inventory  │  │   History    │             │
│  │  Listings    │  │   & Sell     │  │   & Trades   │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         │                 │                 │                      │
│         └─────────────────┼─────────────────┘                      │
│                           │                                         │
│             Connected to: Avalanche Fuji                            │
│                                                                     │
└────────────┬──────────────────────────────────────────────────────┘
             │
             │ ✓ Wagmi configured
             │ ✓ Chain ID: 43113
             │ ✓ MetaMask connector
             │
      ┌──────▼──────────────────────────────────────────────────┐
      │                  BLOCKCHAIN OPERATIONS                 │
      │                                                        │
      │  User connects wallet and signs transactions on:      │
      │  https://api.avax-test.network/ext/bc/C/rpc          │
      │                                                        │
      │  Transactions include:                                │
      │  - List Item (ERC721 Transfer)                         │
      │  - Buy Item (AVAX Transfer)                            │
      │                                                        │
      │  Network: Avalanche Fuji Testnet (43113)             │
      │  Currency: AVAX (18 decimals)                         │
      │  BlockTime: ~3 seconds                                │
      └────────┬─────────────────────────────────────────────┘
               │
               │ Transaction Hash Received
               │
      ┌────────▼─────────────────────────────────────────────┐
      │              BACKEND API SERVERS                      │
      │         (Node @ localhost:3002 & 3001)               │
      │                                                      │
      │  ✓ Express REST API                                 │
      │  ✓ WebSocket for live updates                       │
      │  ✓ Viem client for Fuji verification               │
      │  ✓ MongoDB integration                              │
      │                                                      │
      │  NEW Blockchain Endpoints:                          │
      │  ├─ GET  /api/blockchain/tx/:hash                  │
      │  ├─ GET  /api/blockchain/balance/:addr             │
      │  ├─ GET  /api/blockchain/gas-price                 │
      │  ├─ GET  /api/blockchain/faucet/:addr              │
      │  └─ POST /api/blockchain/confirm-trade             │
      │                                                      │
      │  Trading Endpoints:                                 │
      │  ├─ POST /api/trade/list                           │
      │  ├─ POST /api/trade/buy                            │
      │  ├─ GET  /api/trade/listings                       │
      │  └─ GET  /api/trade/history/:addr                  │
      └────────┬─────────────────────────────────────────┬──┘
               │                                         │
        ┌──────▼──────────┐              ┌──────────────▼──┐
        │   VIEM CLIENT   │              │   MONGODB      │
        │  (Transaction   │              │                │
        │  Verification)  │              │  Collections:  │
        │                 │              │  - listings    │
        │ Connects to:    │              │  - trades      │
        │ Fuji RPC        │              │                │
        │                 │              │  Enhanced with:│
        │ Features:       │              │  - txHash      │
        │ - getTransaction│              │  - blockNumber │
        │ - getTxReceipt  │              │  - gasUsed     │
        │ - getGasPrice   │              │  - explorerUrl │
        │ - getBalance    │              │  - network     │
        └─────────────────┘              └────────────────┘
```

---

## Transaction Flow Diagram

```
BUYING AN ITEM ON FUJI TESTNET
════════════════════════════════════

Step 1: User Action
┌─────────────────────┐
│  Click "BUY NOW"    │
│  on a listing       │
└────────┬────────────┘
         │
         ▼
Step 2: Backend Record
┌──────────────────────────────────┐
│ POST /api/trade/buy              │
│ Create trade record with:        │
│ - status: "pending"              │
│ - seller: 0x...                  │
│ - buyer: 0x...                   │
│ - price: "500000000..."          │
│ - network: "avalanche-fuji"      │
└────────┬─────────────────────────┘
         │
         ▼
Step 3: Sign Transaction
┌──────────────────────────────────┐
│ User signs in MetaMask:          │
│ - Contract: Marketplace          │
│ - Function: buyItem()            │
│ - Value: 0.5 AVAX               │
│ - Network: Avalanche Fuji (43113)│
└────────┬─────────────────────────┘
         │
         ▼
Step 4: Transaction to Fuji
┌──────────────────────────────────┐
│ RPC: api.avax-test.network       │
│ Chain ID: 43113                  │
│ Gas Price: ~25 Gwei              │
│ Gas Used: ~150,000               │
│                                  │
│ Returns: txHash                  │
│ Example: 0xabc123...             │
└────────┬─────────────────────────┘
         │
         ▼
Step 5: Frontend Shows
┌──────────────────────────────────┐
│ ✓ Transaction successful!        │
│ View on Snowtrace →              │
│ [Click to Snowtrace]             │
│                                  │
│ URL: testnet.snowtrace.io/tx/... │
└────────┬─────────────────────────┘
         │
         ▼
Step 6: Backend Verification
┌──────────────────────────────────┐
│ POST /api/blockchain/confirm-trade
│ Input: { tradeId, txHash }       │
│                                  │
│ Viem calls Fuji RPC:            │
│ - getTransaction()               │
│ - getTransactionReceipt()        │
│                                  │
│ Retrieves:                       │
│ - blockNumber: 1234567          │
│ - gasUsed: 145892               │
│ - status: "success"             │
│ - timestamp: 1712884400         │
└────────┬─────────────────────────┘
         │
         ▼
Step 7: Update Database
┌──────────────────────────────────┐
│ Update trade record with:        │
│                                  │
│ tradeId: "uuid-here"             │
│ txHash: "0xabc123..."            │
│ blockNumber: 1234567             │
│ gasUsed: "145892"                │
│ status: "confirmed"              │
│ explorerUrl: "snowtrace.io/..."  │
│ network: "avalanche-fuji"        │
│ completedAt: Date.now()          │
└────────┬─────────────────────────┘
         │
         ▼
Step 8: User Sees Results
┌──────────────────────────────────┐
│ History Tab shows:               │
│                                  │
│ ✓ CONFIRMED                      │
│ Item: Iron Sword                 │
│ Price: 0.5 AVAX                  │
│ Status: ✓ Confirmed              │
│ Block: 1234567                   │
│ Snowtrace →                      │
│                                  │
│ Click → See tx on Snowtrace      │
└──────────────────────────────────┘
```

---

## Data Schema: Before & After

### BEFORE: Listing Record
```javascript
{
  listingId: "uuid",
  seller: "0x...",
  itemTokenId: 1,
  itemName: "Iron Sword",
  itemPower: 45,
  itemRarity: 1,
  price: "500000000000000000",
  active: true,
  createdAt: Date,
  expiresAt: Date
}
```

### AFTER: Listing Record (Enhanced)
```javascript
{
  listingId: "uuid",
  seller: "0x...",
  itemTokenId: 1,
  itemName: "Iron Sword",
  itemPower: 45,
  itemRarity: 1,
  price: "500000000000000000",
  active: true,
  txHash: "0xabc123...",              // ← NEW: Blockchain tx
  network: "avalanche-fuji",          // ← NEW: Network identifier
  createdAt: Date,
  expiresAt: Date
}
```

### BEFORE: Trade History Record
```javascript
{
  tradeId: "uuid",
  seller: "0x...",
  buyer: "0x...",
  itemTokenId: 1,
  itemName: "Iron Sword",
  price: "500000000000000000",
  txHash: "0xabc123...",
  status: "pending",
  createdAt: Date,
  completedAt: Date
}
```

### AFTER: Trade History Record (Enhanced)
```javascript
{
  tradeId: "uuid",
  seller: "0x...",
  buyer: "0x...",
  itemTokenId: 1,
  itemName: "Iron Sword",
  price: "500000000000000000",
  txHash: "0xabc123...",              // ← Blockchain tx hash
  blockNumber: 1234567,               // ← NEW: Confirmation block
  gasUsed: "145892",                  // ← NEW: Gas consumed
  status: "confirmed",
  network: "avalanche-fuji",          // ← NEW: Network name
  explorerUrl: "snowtrace.io/tx/...", // ← NEW: Direct link
  createdAt: Date,
  completedAt: Date
}
```

---

## Component Architecture

```
Frontend
├── marketplace/page.tsx (Main)
│   ├── Navigate between tabs
│   └── 4 main components:
│
├─ BrowseListings.tsx
│   ├── Fetch all active listings
│   ├── Filter & search
│   └─ → BuyModal (when user clicks Buy)
│
├─ MyInventory.tsx
│   ├── Display user's items
│   └─ → ListingModal (when user clicks Sell)
│
├─ ListingModal.tsx ⭐
│   ├── 3-step process:
│   │   1. Enter price
│   │   2. Approve (signs on Fuji)
│   │   3. List (sends to Fuji)
│   └── Uses: Wagmi hooks
│
├─ BuyModal.tsx ⭐
│   ├── Shows Snowtrace link ← NEW
│   ├── Calls: /api/trade/buy
│   ├── Sends tx to Fuji ← NEW
│   └── Uses: Fuji verified receipt
│
├─ MyListings.tsx
│   ├── View user's listings
│   └─ Cancel option
│
└─ TradeHistory.tsx ⭐
    ├── View all trades with:
    │   - Status indicator
    │   - Gas used ← NEW
    │   - Block number ← NEW
    │   - Snowtrace link ← NEW
    └─ Filter: All/Buys/Sells
```

---

## API Endpoint Flow

```
TRADING ENDPOINTS (Already existed)
═══════════════════════════════════

POST /api/trade/list
    User → Backend → MongoDB + On-chain
    Returns: Listing record

GET /api/trade/listings
    Frontend → Backend → MongoDB
    Returns: All active listings

POST /api/trade/buy
    User → Backend → MongoDB
    Returns: Trade record (pending)

GET /api/trade/history/:address
    User → Backend → MongoDB
    Returns: User's trades


NEW BLOCKCHAIN ENDPOINTS ⭐
═══════════════════════════

GET /api/blockchain/tx/:txHash
    Queries: Fuji RPC via Viem
    Returns: {hash, from, to, value, gasPrice, gasUsed, status, explorerUrl}

GET /api/blockchain/balance/:address
    Queries: Fuji RPC via Viem
    Returns: {balance, balanceWei, network}

GET /api/blockchain/gas-price
    Queries: Fuji RPC via Viem
    Returns: {gasPrice, gasPriceWei, network}

GET /api/blockchain/faucet/:address
    Returns: Faucet URL for test AVAX
    Returns: {faucetUrl, instructions}

POST /api/blockchain/confirm-trade
    Validates on Fuji
    Updates MongoDB
    Returns: {success, explorerUrl, transaction}
```

---

## Verification Process

```
Transaction Confirmation Flow
══════════════════════════════

1. User sends tx on Fuji
   └─ Status: Pending

2. Transaction mines (3 sec avg)
   └─ Included in block

3. Block confirms (few more blocks)
   └─ Status: Confirmed

4. Backend polls Fuji RPC
   ├─ Call: getTransactionReceipt(txHash)
   ├─ Retrieves:
   │  ├─ blockNumber: 1234567
   │  ├─ gasUsed: 145892
   │  ├─ status: 1 (success) or 0 (failed)
   │  └─ transactionIndex: 42
   │
   └─ Stores in MongoDB

5. Frontend calls confirm endpoint
   ├─ Passes: tradeId, txHash
   ├─ Backend verifies on Fuji
   └─ Returns: explorerUrl

6. User sees transaction details
   ├─ Block number
   ├─ Gas used
   ├─ Confirmation status
   └─ Link to Snowtrace explorer
```

---

## Complete Request/Response Example

### Buy an Item

**1. Create Trade Record**
```
POST /api/trade/buy
{
  "listingId": "550e8400-e29b-41d4-a716-446655440000",
  "buyer": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE4"
}

Response:
{
  "success": true,
  "trade": {
    "tradeId": "660e8400-e29b-41d4-a716-446655440001",
    "seller": "0x123456789...",
    "buyer": "0x742d35cc6...",
    "itemName": "Iron Sword",
    "price": "500000000000000000",
    "status": "pending",
    "network": "avalanche-fuji",
    "createdAt": "2026-04-11T10:30:00Z"
  }
}
```

**2. Send Transaction on Fuji**
- User signs in MetaMask
- Value: 0.5 AVAX
- To: Marketplace contract
- Chain: 43113 (Fuji)
- Returns: txHash = "0xabc123def456..."

**3. Verify on Fuji**
```
GET /api/blockchain/tx/0xabc123def456...

Response:
{
  "transaction": {
    "hash": "0xabc123def456...",
    "from": "0x742d35cc6...",
    "to": "0xMarketplaceAddress",
    "value": "500000000000000000",
    "gasPrice": "25000000000",
    "gasUsed": "145892",
    "status": "success",
    "blockNumber": 1234567,
    "confirmations": "confirmed"
  },
  "explorerUrl": "https://testnet.snowtrace.io/tx/0xabc123def456..."
}
```

**4. Confirm Trade**
```
POST /api/blockchain/confirm-trade
{
  "tradeId": "660e8400-e29b-41d4-a716-446655440001",
  "txHash": "0xabc123def456..."
}

Response:
{
  "success": true,
  "message": "Trade confirmed on Avalanche Fuji testnet",
  "explorerUrl": "https://testnet.snowtrace.io/tx/0xabc123def456...",
  "transaction": {
    "blockNumber": 1234567,
    "gasUsed": "145892",
    "status": "success"
  }
}
```

**5. Trade Record Updated**
```
MongoDB trade updated:
{
  "tradeId": "660e8400-e29b-41d4-a716-446655440001",
  "status": "confirmed",                         ← Changed
  "txHash": "0xabc123def456...",               ← Added
  "blockNumber": 1234567,                      ← Added
  "gasUsed": "145892",                         ← Added
  "explorerUrl": "https://testnet.snowtrace...", ← Added
  "network": "avalanche-fuji",                 ← Added
  "completedAt": "2026-04-11T10:31:00Z"       ← Updated
}
```

---

## Migration Path: Testnet → Mainnet

```
FUJI TESTNET (43113)                  MAINNET (43114)
═══════════════════════════           ═════════════════════════

RPC:
https://api.avax-test.network    →   https://api.avax.network

Explorer:
https://testnet.snowtrace.io     →   https://snowtrace.io

Chain ID:
43113                            →   43114

Network:
"avalanche-fuji"                 →   "avalanche-C"

Environment Variable:
AVALANCHE_FUJI_RPC=https://...   →   AVALANCHE_FUJI_RPC=https://...

Code Changes:
ZERO!                            →   Just config changes

That's it! Same codebase for both networks.
```

---

**This architecture ensures complete blockchain transparency and verification on Avalanche Fuji Testnet!** ✅
