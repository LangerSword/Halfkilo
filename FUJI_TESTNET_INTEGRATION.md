# Avalanche Fuji Testnet Integration Guide

## ✅ What Was Updated

Your trading system now fully integrates with **Avalanche Fuji Testnet** for all blockchain transactions with complete tracking and verification.

---

## 🏗️ Architecture

### Backend Changes

**New Files:**
- `src/config/blockchain.ts` - Fuji testnet configuration & Viem clients
- `src/services/BlockchainService.ts` - Transaction verification & utilities

**Updated Files:**
- `src/db/types.ts` - Added blockchain fields (txHash, blockNumber, explorerUrl, network)
- `src/services/TradeService.ts` - Enhanced with blockchain details
- `src/server.ts` - Added 5 blockchain tracking endpoints

### Frontend Changes

**New Files:**
- `src/lib/blockchain.ts` - Blockchain utilities for frontend integration

**Updated Files:**
- `src/components/marketplace/BuyModal.tsx` - Improved with Snowtrace links

---

## 🔗 Network Configuration

### Avalanche Fuji Testnet Details
```
Network Name: Avalanche Fuji Testnet
Chain ID: 43113
RPC URL: https://api.avax-test.network/ext/bc/C/rpc
Explorer: https://testnet.snowtrace.io
Faucet: https://faucet.avax-test.network
Native Currency: AVAX (18 decimals)
```

### Already Configured In:
- ✅ Frontend (wagmi): `src/config/wagmi.ts`
- ✅ Smart Contracts (hardhat): `contracts/hardhat.config.ts`
- ✅ Backend (viem): `src/config/blockchain.ts`

---

## 📡 New Backend Endpoints

### 1. Get Transaction Details
```
GET /api/blockchain/tx/:txHash
Response: {
  transaction: {
    hash, from, to, value, gasPrice, gasUsed, status, blockNumber, confirmations
  },
  explorerUrl: "https://testnet.snowtrace.io/tx/..."
}
```

### 2. Get Account Balance
```
GET /api/blockchain/balance/:address
Response: {
  address, balance, balanceWei, network: "avalanche-fuji-testnet"
}
```

### 3. Get Current Gas Price
```
GET /api/blockchain/gas-price
Response: {
  gasPrice, gasPriceWei, network: "avalanche-fuji-testnet", unit: "AVAX"
}
```

### 4. Get Faucet URL
```
GET /api/blockchain/faucet/:address
Response: {
  faucetUrl: "https://faucet.avax-test.network/...",
  instructions: "Use this URL to request test AVAX"
}
```

### 5. Confirm Trade with Blockchain Verification
```
POST /api/blockchain/confirm-trade
Body: { tradeId, txHash }
Response: {
  success: true,
  explorerUrl: "https://testnet.snowtrace.io/tx/...",
  transaction: { blockNumber, gasUsed, ... }
}
```

---

## 📊 Enhanced Database Records

### Listings Collection
```javascript
{
  listingId: "uuid",
  seller: "0x...",
  itemTokenId: 1,
  itemName: "Iron Sword",
  price: "500000000000000000",
  active: true,
  txHash: "0x...",                    // ← NEW: Listing creation tx
  createdAt: Date,
  expiresAt: Date,
  network: "avalanche-fuji",          // ← NEW: Network identifier
}
```

### TradeHistory Collection
```javascript
{
  tradeId: "uuid",
  seller: "0x...",
  buyer: "0x...",
  itemTokenId: 1,
  itemName: "Iron Sword",
  price: "500000000000000000",
  txHash: "0x...",                    // ← NEW: Purchase tx
  blockNumber: 12345678,              // ← NEW: Block confirmation
  gasUsed: "45000",                   // ← NEW: Gas consumed
  status: "confirmed",
  createdAt: Date,
  completedAt: Date,
  network: "avalanche-fuji",          // ← NEW: Network identifier
  explorerUrl: "https://testnet.snowtrace.io/tx/0x...", // ← NEW
}
```

---

## 🛠️ Frontend Integration

### Using Blockchain Utilities

```typescript
import { BlockchainUtils } from "@/lib/blockchain";

// Get transaction explorer URL
const explorerUrl = BlockchainUtils.getTxExplorerUrl("0x...");

// Check transaction status
const status = await BlockchainUtils.checkTxStatus("0x...");

// Get account balance
const balance = await BlockchainUtils.getAccountBalance("0x...");

// Get gas price
const gasPrice = await BlockchainUtils.getGasPrice();

// Get faucet URL for test AVAX
const faucetUrl = BlockchainUtils.getFaucetUrl("0x...");

// Confirm trade with blockchain verification
const result = await BlockchainUtils.confirmTradeWithBlockchain(tradeId, txHash);

// Format address
const formatted = BlockchainUtils.formatAddress("0x1234567890abcdef");
// Output: "0x1234...cdef"

// Open explorer in new tab
BlockchainUtils.openExplorer(explorerUrl);
```

---

## 🔄 Transaction Flow

### Buying an Item

```
1. User clicks "Buy Now"
   ↓
2. Backend creates trade record with status: "pending"
   ↓
3. Frontend sends transaction to Fuji testnet smart contract
   ↓
4. Transaction hash received (txHash)
   ↓
5. Frontend displays Snowtrace link
   ↓
6. Transaction mines on Fuji
   ↓
7. Frontend calls /api/blockchain/confirm-trade
   ↓
8. Backend retrieves block details from Fuji
   ↓
9. Trade record updated with:
   - status: "confirmed"
   - blockNumber
   - gasUsed
   - explorerUrl
   ↓
10. Trade visible in history with full blockchain details
```

### Selling an Item

```
1. User enters price and clicks "APPROVE"
   ↓
2. Approve transaction sent to Fuji testnet
   ↓
3. User clicks "LIST"
   ↓
4. Backend creates listing record
   ↓
5. List transaction sent to Fuji testnet
   ↓
6. tx Hash stored in listing record
   ↓
7. Listing appears in marketplace
```

---

## 🧪 Testing on Fuji Testnet

### Step 1: Get Test AVAX

```bash
# Option A: Manual
Visit: https://faucet.avax-test.network
Enter your address, request funds

# Option B: Via API
curl http://localhost:3002/api/blockchain/faucet/0xYourAddress
# Returns faucet URL in response
```

### Step 2: Check Balance

```bash
curl http://localhost:3002/api/blockchain/balance/0xYourAddress
# Should show nonzero balance after faucet funds arrive
```

### Step 3: Monitor Gas Prices

```bash
curl http://localhost:3002/api/blockchain/gas-price
# Check current Fuji network gas prices
```

### Step 4: Make a Trade

1. Connect wallet to app (already set to Fuji via Wagmi)
2. List item for sale
3. Use different wallet to buy
4. Get transaction hash from wallet
5. Check Snowtrace: `https://testnet.snowtrace.io/tx/0x...`

### Step 5: Verify Trade

```bash
curl http://localhost:3002/api/blockchain/tx/0xYourTxHash
# Returns full transaction details and confirmation status
```

---

## 🔍 Viewing Transactions

### In Frontend
- Buy modal shows "View on Snowtrace →" link after confirmation
- History tab shows Snowtrace links for all trades

### Direct Explorer
- Transactions: `https://testnet.snowtrace.io/tx/<txHash>`
- Addresses: `https://testnet.snowtrace.io/address/<address>`
- Contracts: `https://testnet.snowtrace.io/address/<contractAddress>`

---

## 📋 Configuration Files

### Backend Configuration
**File:** `mastra-backend/src/config/blockchain.ts`

```typescript
// RPC endpoint
const FUJI_RPC = "https://api.avax-test.network/ext/bc/C/rpc";

// Chain info
export const chainInfo = {
  name: "Avalanche Fuji",
  id: 43113,
  nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
};
```

### Frontend Configuration
**File:** `frontend/src/lib/blockchain.ts`

```typescript
export const FUJI_TESTNET_CONFIG = {
  chainId: 43113,
  rpc: "https://api.avax-test.network/ext/bc/C/rpc",
  explorer: "https://testnet.snowtrace.io",
  faucetUrl: "https://faucet.avax-test.network",
};
```

---

## 🚀 Deployment Notes

### Production Migration
When moving to mainnet (Avalanche C-Chain):

**Change RPC:**
```
Before: https://api.avax-test.network/ext/bc/C/rpc (Fuji)
After: https://api.avax.network/ext/bc/C/rpc (Mainnet)
```

**Change Chain ID:**
```
Before: 43113 (Fuji)
After: 43114 (Mainnet)
```

**Change Explorer:**
```
Before: https://testnet.snowtrace.io
After: https://snowtrace.io
```

**Update Environment Variables:**
```env
# .env for Mastra Backend
AVALANCHE_FUJI_RPC=https://api.avax.network/ext/bc/C/rpc  # Change to mainnet RPC

# Wagmi config will auto-update based on environment
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (User)                          │
│                                                             │
│  1. Connect Wallet (Fuji configured via Wagmi)            │
│  2. List/Buy Items                                          │
│  3. Sign Transaction with MetaMask                          │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓ Transaction Hash
┌──────────────────────────────────────────────────────────────┐
│         AVALANCHE FUJI TESTNET (43113)                      │
│                                                              │
│  - Execute ListItem/BuyItem                                │
│  - Consume Gas                                              │
│  - Generate Block                                           │
│  - Emit Events                                              │
└─────────────────┬────────────────────────────────────────────┘
                  │
        ↓ Poll for confirmation
┌──────────────────────────────────────────────────────────────┐
│            BACKEND (Viem + BlockchainService)               │
│                                                              │
│  1. Receive txHash from frontend                           │
│  2. Poll Fuji RPC endpoint via publicClient                │
│  3. Get transaction receipt                                 │
│  4. Extract: blockNumber, gasUsed, status                  │
│  5. Update MongoDB with blockchain details                 │
│  6. Generate Snowtrace explorer URL                        │
└─────────────────┬────────────────────────────────────────────┘
                  │
                  ↓
┌──────────────────────────────────────────────────────────────┐
│              MONGODB (Persistent Storage)                   │
│                                                              │
│  tradeHistory: {                                            │
│    txHash: "0x...",                                         │
│    blockNumber: 12345678,                                  │
│    gasUsed: "45000",                                        │
│    status: "confirmed",                                     │
│    explorerUrl: "https://testnet.snowtrace.io/tx/0x..."   │
│  }                                                          │
└──────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Important Notes

### Gas Fees
- Fuji testnet gas is free (uses automatic faucet)
- Main chain will have real AVAX gas costs

### Testnet Resets
- Fuji testnet may be reset periodically
- Ensure to re-request test funds after reset
- Old contracts may become invalid after reset

### Rate Limits
- Testnet RPC has standard rate limits
- Production recommendation: Use Alchemy or Infura

### Wallet Network
- Ensure MetaMask is set to Avalanche Fuji Testnet
- Wrong network = transaction fails

---

## 🔗 Useful Links

- **Fuji Testnet Faucet:** https://faucet.avax-test.network
- **Snowtrace Explorer:** https://testnet.snowtrace.io
- **Avalanche Docs:** https://docs.avax.network
- **Viem Config:** https://viem.sh/docs/chains/avalanche
- **Wagmi Config:** https://wagmi.sh/react/chains/avalanche

---

## 📝 Summary

✅ All transactions now execute on Avalanche Fuji Testnet (43113)
✅ Full transaction tracking with blockchain verification
✅ Snowtrace explorer links for all trades
✅ Gas usage and block details stored in database
✅ Easy to migrate to mainnet with config changes
✅ Frontend utilities for blockchain integration
✅ Comprehensive error handling and status tracking

**Ready for production testing on Fuji!** 🚀
