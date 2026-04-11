"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { createPortal } from "react-dom";
import { CONTRACTS } from "@/config/contracts";
import { ItemNFTABI, MarketplaceABI } from "@/config/abis";

interface InventoryItem {
  tokenId: number;
  name: string;
  power: number;
  rarity: number;
  owner: string;
}

interface ListingModalProps {
  item: InventoryItem;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ListingModal({ item, onClose, onSuccess }: ListingModalProps) {
  const { address } = useAccount();
  const [price, setPrice] = useState("");
  const [step, setStep] = useState<"price" | "approve" | "list">("price");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: approveTxHash, writeContract: doApprove, isPending: isApprovePending } = useWriteContract();
  const { data: listTxHash, writeContract: doList, isPending: isListPending } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveTxHash });
  const { isLoading: isListConfirming, isSuccess: isListSuccess } = useWaitForTransactionReceipt({ hash: listTxHash });

  const handleApprove = () => {
    try {
      setError("");
      doApprove({
        address: CONTRACTS.itemNFT,
        abi: ItemNFTABI,
        functionName: "approve",
        args: [CONTRACTS.marketplace, BigInt(item.tokenId)],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed");
    }
  };

  const handleList = async () => {
    try {
      setError("");
      setIsProcessing(true);

      if (!address) {
        setError("Wallet not connected");
        return;
      }

      if (!price || parseFloat(price) <= 0) {
        setError("Invalid price");
        return;
      }

      // Register listing on backend
      const response = await fetch("/api/trade/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seller: address,
          item: {
            tokenId: item.tokenId,
            name: item.name,
            power: item.power,
            rarity: item.rarity,
            owner: address,
          },
          price: (parseFloat(price) * 1e18).toString(),
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        setError(err.error || "Failed to create listing");
        return;
      }

      // Execute on-chain listing
      doList({
        address: CONTRACTS.marketplace,
        abi: MarketplaceABI,
        functionName: "listItem",
        args: [CONTRACTS.itemNFT, BigInt(item.tokenId), BigInt(Math.floor(parseFloat(price) * 1e18))],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Listing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStepChange = (newStep: typeof step) => {
    if (newStep === "approve" && !price) {
      setError("Please enter a price first");
      return;
    }
    setStep(newStep);
  };

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
          maxWidth: 450,
          padding: 20,
          cursor: "default",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 12, color: "var(--accent)", marginBottom: 16 }}>
          📋 LIST ITEM FOR SALE
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-dim)" }}>Item</span>
            <span style={{ color: "var(--text-primary)" }}>{item.name}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-dim)" }}>Power</span>
            <span style={{ color: "var(--text-primary)" }}>{item.power}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-dim)" }}>Token ID</span>
            <span style={{ color: "var(--text-primary)" }}>#{item.tokenId}</span>
          </div>
        </div>

        {/* Step Indicators */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <StepButton
            label="1️⃣ Price"
            active={step === "price"}
            completed={!!price}
            onClick={() => setStep("price")}
          />
          <StepButton
            label="2️⃣ Approve"
            active={step === "approve"}
            completed={isApproveSuccess}
            disabled={!price}
          />
          <StepButton
            label="3️⃣ List"
            active={step === "list"}
            completed={isListSuccess}
            disabled={!isApproveSuccess}
          />
        </div>

        {/* Step Content */}
        {step === "price" && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 8, color: "var(--text-dim)", display: "block", marginBottom: 8 }}>
              PRICE (AVAX)
            </label>
            <input
              className="pixel-input"
              type="number"
              min="0.001"
              step="0.001"
              placeholder="0.5"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
        )}

        {step === "approve" && (
          <div style={{ marginBottom: 16, padding: 12, backgroundColor: "var(--accent-dim)", borderRadius: 2 }}>
            <p style={{ fontSize: 10, color: "var(--text-primary)", marginBottom: 8 }}>
              🔓 Approve the marketplace to transfer your item
            </p>
            <button
              className="pixel-btn"
              onClick={handleApprove}
              disabled={isApprovePending || isApproveConfirming}
              style={{ width: "100%", marginBottom: 8 }}
            >
              {isApprovePending ? "CONFIRM..." : isApproveConfirming ? "APPROVING..." : "🔓 APPROVE"}
            </button>
            {isApproveSuccess && <div className="tx-success">✓ APPROVED</div>}
          </div>
        )}

        {step === "list" && (
          <div style={{ marginBottom: 16, padding: 12, backgroundColor: "var(--accent-dim)", borderRadius: 2 }}>
            <p style={{ fontSize: 10, color: "var(--text-primary)", marginBottom: 12 }}>
              Ready to list {item.name} for {price} AVAX?
            </p>
            <button
              className="pixel-btn warm"
              onClick={handleList}
              disabled={isListPending || isListConfirming || isProcessing}
              style={{ width: "100%", marginBottom: 8 }}
            >
              {isListPending || isProcessing ? "CONFIRM..." : isListConfirming ? "LISTING..." : "📋 LIST"}
            </button>
            {isListSuccess && <div className="tx-success">✓ LISTED SUCCESSFULLY</div>}
          </div>
        )}

        {error && <div className="tx-error" style={{ marginBottom: 12 }}>{error}</div>}

        <div style={{ display: "flex", gap: 12 }}>
          {step !== "price" && (
            <button
              className="pixel-btn"
              onClick={() => handleStepChange(step === "approve" ? "price" : "approve")}
              style={{ flex: 1 }}
            >
              ← BACK
            </button>
          )}

          {step !== "list" && (
            <button
              className="pixel-btn warm"
              onClick={() => handleStepChange(step === "price" ? "approve" : "list")}
              disabled={!price || (step === "approve" && !isApproveSuccess)}
              style={{ flex: 1 }}
            >
              NEXT →
            </button>
          )}

          <button
            className="pixel-btn"
            onClick={onClose}
            disabled={isApprovePending || isListPending || isProcessing}
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

function StepButton({
  label,
  active,
  completed,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  completed: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        padding: "8px 4px",
        fontFamily: "'Press Start 2P', cursive",
        fontSize: 7,
        backgroundColor: completed ? "var(--accent)" : active ? "var(--accent-warm)" : "transparent",
        color: completed || active ? "white" : "var(--text-dim)",
        border: `2px solid ${completed ? "var(--accent)" : active ? "var(--accent-warm)" : "var(--accent-dim)"}`,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );
}
