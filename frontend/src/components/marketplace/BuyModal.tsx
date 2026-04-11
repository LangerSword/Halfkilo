"use client";

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACTS } from "@/config/contracts";
import { MarketplaceABI } from "@/config/abis";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { confirmTradeWithBlockchain, getTxExplorerUrl } from "@/lib/blockchain";

interface Listing {
  listingId: string;
  seller: string;
  itemTokenId: number;
  itemName: string;
  itemPower: number;
  itemRarity: number;
  price: string;
  active: boolean;
  createdAt: string;
}

interface BuyModalProps {
  listing: Listing;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BuyModal({ listing, onClose, onSuccess }: BuyModalProps) {
  const { address } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [explorerUrl, setExplorerUrl] = useState("");
  const { data: txHash, writeContract: doBuy, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // Create a contract-side listing ID (for now, use listingId hash)
  const contractListingId = BigInt(parseInt(listing.listingId.replace(/[^0-9]/g, "").slice(0, 10)) || 1);

  const handleBuy = async () => {
    try {
      setError("");
      setIsProcessing(true);

      if (!address) {
        setError("Wallet not connected");
        return;
      }

      // Send purchase request to backend
      const tradeRes = await fetch("/api/trade/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.listingId,
          buyer: address,
        }),
      });

      if (!tradeRes.ok) {
        setError("Failed to create trade record");
        return;
      }

      const tradeData = await tradeRes.json();

      // Execute the transaction on Avalanche Fuji testnet
      doBuy({
        address: CONTRACTS.marketplace,
        abi: MarketplaceABI,
        functionName: "buyItem",
        args: [contractListingId],
        value: BigInt(Math.floor(parseFloat(listing.price) * 1e18)),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process purchase");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (isSuccess && txHash) {
      const explorerLink = getTxExplorerUrl(txHash.toString());
      setExplorerUrl(explorerLink);
      onSuccess();
    }
  }, [isSuccess, txHash, onSuccess]);

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="pixel-panel"
        style={{
          maxWidth: 400,
          padding: 20,
          cursor: "default",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 12, color: "var(--accent)", marginBottom: 16 }}>
          💰 CONFIRM PURCHASE
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-dim)" }}>Item</span>
            <span style={{ color: "var(--text-primary)" }}>{listing.itemName}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-dim)" }}>Power</span>
            <span style={{ color: "var(--text-primary)" }}>{listing.itemPower}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-dim)" }}>Seller</span>
            <span style={{ color: "var(--text-primary)", fontFamily: "monospace", fontSize: 10 }}>
              {listing.seller.slice(0, 6)}…{listing.seller.slice(-4)}
            </span>
          </div>

          <div
            style={{
              padding: 12,
              backgroundColor: "var(--accent-dim)",
              color: "var(--accent-warm)",
              textAlign: "center",
              fontSize: 14,
              fontWeight: "bold",
            }}
          >
            {parseFloat(listing.price).toFixed(4)} AVAX
          </div>
        </div>

        {error && <div className="tx-error" style={{ marginBottom: 12 }}>{error}</div>}

        {isSuccess && (
          <div>
            <div className="tx-success" style={{ marginBottom: 12 }}>
              ✓ Purchase confirmed on Avalanche Fuji!
            </div>
            {explorerUrl && (
              <div style={{ marginBottom: 12, textAlign: "center" }}>
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "var(--accent)",
                    textDecoration: "none",
                    fontSize: 10,
                    borderBottom: "1px dotted var(--accent)",
                  }}
                >
                  View on Snowtrace →
                </a>
              </div>
            )}
          </div>
        )}

        {txHash && !isSuccess && (
          <div style={{ 
            padding: 8, 
            backgroundColor: "#fa0", 
            color: "black", 
            fontSize: 10,
            marginBottom: 12,
            textAlign: "center",
          }}>
            ⏳ Transaction pending...
          </div>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <button
            className="pixel-btn warm"
            onClick={handleBuy}
            disabled={isPending || isConfirming || isProcessing || isSuccess}
            style={{ flex: 1 }}
          >
            {isPending || isProcessing ? "CONFIRM..." : isConfirming ? "PROCESSING..." : "💰 BUY"}
          </button>

          <button
            className="pixel-btn"
            onClick={onClose}
            disabled={isPending || isConfirming || isProcessing}
            style={{ flex: 1 }}
          >
            ✕ CANCEL
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
