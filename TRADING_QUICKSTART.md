# Quick Start Guide - Trading System

## Prerequisites
- MongoDB running locally or connection string ready
- Node.js + npm
- Two wallet addresses for testing (recommend using different MetaMask accounts)

## 1️⃣ Backend Setup

```bash
cd mastra-backend

# Install dependencies (if needed)
npm install

# Start the backend server
npm run dev
```

Expected output:
```
✓ Connected to MongoDB
Halfkilo Match API running on :3002
Halfkilo WebSocket running on ws://localhost:3001
```

## 2️⃣ Frontend Setup

```bash
cd frontend

# Install dependencies (if needed)
npm install

# Start the frontend
npm run dev
```

Expected output:
```
➜  Local:   http://localhost:3000
```

## 3️⃣ Access Marketplace

1. Open http://localhost:3000/marketplace
2. Click "Connect Wallet" button
3. Select MetaMask (or your wallet provider)
4. Approve connection

## 4️⃣ Test Trading

### Sell an Item
1. Go to **📦 Inventory** tab
2. Click **📋 SELL** on any item
3. Enter a price (e.g., 0.5 AVAX)
4. Click **NEXT →** (Step 2: Approve)
5. Approve the transaction in your wallet
6. Click **NEXT →** (Step 3: List)
7. Complete the listing
8. Item appears in **📋 My Listings** tab

### Buy an Item
1. Switch to different wallet account (important!)
2. Go to **🛍️ Browse** tab
3. You'll see listings from other accounts
4. Click **💰 BUY NOW** on desired item
5. Review in modal and click **💰 BUY**
6. Approve transaction in wallet
7. Transaction executes on-chain
8. Item: transfers to your account, removed from seller's listings

### View History
1. Go to **⏱️ History** tab
2. View all your trades
3. Toggle between **All Trades / Sells / Buys**
4. Click "View on Snowtrace" to see transaction details

## 🔍 What Happens Behind the Scenes

### Selling
```
You enter price
     ↓
You approve marketplace to transfer NFT
     ↓
Backend creates listing in MongoDB
     ↓
On-chain listItem() called
     ↓
Item appears for sale
```

### Buying
```
You click BUY NOW
     ↓
Backend records trade in tradeHistory
     ↓
On-chain buyItem() called
     ↓
NFT transfers to you
     ↓
AVAX transfers to seller
     ↓
Listing marked inactive
     ↓
Trade appears in History
```

## 🧪 Test Scenarios

### Scenario 1: Simple Buy/Sell
1. Wallet A: List an item for 1 AVAX
2. Wallet B: Purchase that item
3. Both: Check histories to confirm trade

### Scenario 2: Multiple Listings
1. Wallet A: List 3 different items at different prices
2. Wallet B: Browse all listings, filter by price
3. Wallet B: Buy items from different sellers
4. Wallet A: Cancel a listing that wasn't purchased

### Scenario 3: Search & Filter
1. Multiple listings in marketplace
2. Search by item name
3. Filter by price range
4. Filter by rarity

## 🖥️ Monitoring

### Check Backend Health
```bash
curl http://localhost:3002/health
# Response: {"ok":true,"service":"halfkilo-mastra-backend"}
```

### View Listings API
```bash
curl http://localhost:3002/api/trade/listings
# Returns all active listings as JSON
```

### View Seller's Listings
```bash
curl http://localhost:3002/api/trade/listings/seller/0x1234567890abcdef
# Returns that seller's active listings
```

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: Failed to connect to MongoDB
```
**Solution:**
- Start MongoDB: `mongod`
- Or set `MONGODB_URI` to correct connection string

### Cannot see listings
**Solution:**
- Ensure both frontend and backend are running
- Check NEXT_PUBLIC_MASTRA_API environment variable
- Try refreshing the page

### Wallet not connecting
**Solution:**
- Ensure you're on Avalanche network
- Try refreshing the page
- Check wallet is unlocked

### Transaction fails
**Solution:**
- Ensure sufficient gas/AVAX balance
- Approve marketplace first
- Check contract addresses are correct

### Same wallet buying own listing
**Note:** This is allowed in current implementation. In production, you might want to add validation to prevent this.

## 📊 Database Check

To see what's in MongoDB:

```bash
# Connect to MongoDB
mongosh

# Select database
use halfkilo

# View listings
db.listings.find()

# View trade history
db.tradeHistory.find()

# Count active listings
db.listings.countDocuments({active: true})
```

## 💡 Tips

1. **Test with Mock Data:** The inventory tab shows pre-populated mock items for testing
2. **Use Different Wallets:** To properly test buying/selling, use at least 2 different wallet accounts
3. **Check Console:** Browser console shows helpful debug info
4. **Reset Database:** Delete MongoDB data to start fresh
5. **Watch Explorer:** View transactions on Snowtrace while they process

## 🎯 Next Steps

After successful testing:
1. Connect to real ItemNFT contract addresses
2. Set up database backups
3. Deploy backend to cloud server
4. Deploy frontend to production
5. Set up monitoring/alerts
6. Consider additional features (offers, auctions, etc.)

---

**System is ready to use!** Start from Step 1 above. 🚀
