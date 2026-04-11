"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function HomePage() {
  const { isConnected } = useAccount();

  return (
    <div style={{ position: "relative", zIndex: 2, pointerEvents: "none", minHeight: "calc(100vh - 104px)" }}>
      {/* Transparent overlay — lets Phaser game world show through */}

      {/* Bottom-left hint */}
      <div style={{
        position: "fixed", bottom: 60, left: 20, pointerEvents: "auto",
        background: "rgba(8,10,18,0.85)", border: "1px solid var(--border-mid)",
        borderRadius: 8, padding: "12px 16px", maxWidth: 260,
      }}>
        <p style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 8, color: "var(--accent)", marginBottom: 6 }}>
          EXPLORE THE WORLD
        </p>
        <p style={{ fontFamily: "'VT323', monospace", fontSize: 16, color: "var(--text-dim)", lineHeight: 1.3 }}>
          Use <strong style={{ color: "var(--text-primary)" }}>WASD</strong> to move around.
          Walk up to characters and press <strong style={{ color: "var(--text-primary)" }}>SPACE</strong> to interact.
        </p>
      </div>

      {/* Right side quick-nav */}
      <div style={{
        position: "fixed", top: 70, right: 16, pointerEvents: "auto",
        display: "flex", flexDirection: "column", gap: 6,
      }}>
        {!isConnected && (
          <div style={{ marginBottom: 8 }}>
            <ConnectButton showBalance={false} chainStatus="none" accountStatus="avatar" />
          </div>
        )}
        <Link href="/battle" className="pixel-btn" style={{
          fontSize: 8, padding: "8px 14px", textAlign: "center",
          background: "rgba(8,10,18,0.85)", borderColor: "var(--accent)",
        }}>
          BATTLE
        </Link>
        <Link href="/register" className="pixel-btn" style={{
          fontSize: 8, padding: "8px 14px", textAlign: "center",
          background: "rgba(8,10,18,0.85)",
        }}>
          RECRUIT
        </Link>
        <Link href="/inventory" className="pixel-btn" style={{
          fontSize: 8, padding: "8px 14px", textAlign: "center",
          background: "rgba(8,10,18,0.85)",
        }}>
          INVENTORY
        </Link>
        <Link href="/marketplace" className="pixel-btn" style={{
          fontSize: 8, padding: "8px 14px", textAlign: "center",
          background: "rgba(8,10,18,0.85)",
        }}>
          MARKET
        </Link>
      </div>
    </div>
  );
}

