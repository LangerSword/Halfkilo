# Avalanche Fuji Testnet - Quick Reference

## ✅ System Already Configured For Fuji

Your entire stack is already using Avalanche Fuji Testnet:

```
✓ Frontend (Wagmi): Fuji testnet configured
✓ Smart Contracts (Hardhat): Fuji target
✓ Backend (Viem): Fuji RPC configured
✓ Database: Tracks blockchain details
```

---

## 🚀 Quick Start

### 1. Get Test AVAX (One-time)
```bash
# Visit faucet
https://faucet.avax-test.network

# Or use API endpoint
curl http://localhost:3002/api/blockchain/faucet/0xYourAddress
```

### 2. Verify Backend Running
```bash
curl http://localhost:3002/health
# Response: {"ok":true,"service":"halfkilo-mastra-backend","network":"avalanche-fuji-testnet"}
```

### 3. Check Your Balance
```bash
curl http://localhost:3002/api/blockchain/balance/0xYourAddress
```

### 4. Check Gas Prices
```bash
curl http://localhost:3002/api/blockchain/gas-price
```

### 5. Start Trading
- Go to http://localhost:3000/marketplace
- Connect wallet (MetaMask should show Fuji network)
- List items or purchase from others

---

## 🔗 Key URLs

| Purpose | URL |
|---------|-----|
| Fuji Faucet | https://faucet.avax-test.network |
| Snowtrace Explorer | https://testnet.snowtrace.io |
| Your Transactions | https://testnet.snowtrace.io/tx/`0xTxHash` |
| Your Address | https://testnet.snowtrace.io/address/`0xAddress` |

---

## 🔍 Verify Transactions

### Via API
```bash
curl http://localhost:3002/api/blockchain/tx/0xYourTxHash
```

### Via Explorer
Just click the "View on Snowtrace" link in the trading history!

---

## 📊 Chain Details

| Property | Value |
|----------|-------|
| Network | Avalanche Fuji Testnet |
| Chain ID | 43113 |
| RPC URL | https://api.avax-test.network/ext/bc/C/rpc |
| Explorer | https://testnet.snowtrace.io |
| Currency | AVAX (18 decimals) |

---

## 🛠️ Backend Endpoints Summary

### Blockchain Info
- `GET /api/blockchain/tx/:txHash` - Transaction details
- `GET /api/blockchain/balance/:address` - Account balance
- `GET /api/blockchain/gas-price` - Current gas price
- `GET /api/blockchain/faucet/:address` - Faucet URL
- `POST /api/blockchain/confirm-trade` - Verify trade

### Trading (Already working)
- `POST /api/trade/list` - Create listing
- `POST /api/trade/buy` - Purchase item
- `GET /api/trade/listings` - Browse all

---

## ⚡ Quick Troubleshooting

### "Wallet not connected"
- Connect using the app's Connect Wallet button
- Ensure MetaMask shows Avalanche Fuji network

### "Insufficient funds"
- Request test AVAX from faucet
- Wait ~5 seconds for funds to arrive

### "Transaction failed"
- Check Snowtrace for error details
- Verify you're on Fuji network
- Check gas price is reasonable

### "Balance shows 0"
- Give faucet a few seconds to process
- Refresh the page
- Try another address

---

## 📱 Wallet Setup (MetaMask)

### Add Avalanche Fuji to MetaMask
1. Open MetaMask
2. Click Networks → Add Network
3. Enter:
   - Network Name: Avalanche Fuji Testnet
   - RPC URL: https://api.avax-test.network/ext/bc/C/rpc
   - Chain ID: 43113
   - Currency: AVAX
   - Explorer: https://testnet.snowtrace.io

---

## 💡 Transaction Flow

1. **You click "Buy"** → Transaction created
2. **Sign in MetaMask** → Sent to Fuji testnet
3. **"View on Snowtrace"** → Click to verify
4. **Status updates** → After ~2s confirmation
5. **History shows trade** → With block details

---

## 🔄 From Testnet to Mainnet

When ready for mainnet, only 3 config changes needed:

```typescript
// Change RPC URL
https://api.avax-test.network/... → https://api.avax.network/...

// Change Chain ID
43113 (Fuji) → 43114 (Mainnet)

// Change Explorer
https://testnet.snowtrace.io → https://snowtrace.io
```

---

## 📞 Support

### Check these files for details:
- **Full Setup Guide:** [FUJI_TESTNET_INTEGRATION.md](FUJI_TESTNET_INTEGRATION.md)
- **Trading System Guide:** [TRADING_SYSTEM.md](TRADING_SYSTEM.md)
- **Quick Start:** [TRADING_QUICKSTART.md](TRADING_QUICKSTART.md)

### API Documentation
- All endpoints return JSON
- Error responses: `{"error": "reason"}`
- Success responses: `{"success": true, ...data}`

---

**Everything is ready on Fuji Testnet! Get test AVAX and start trading!** 🎉
