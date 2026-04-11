"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import BrowseListings from "@/components/marketplace/BrowseListings";
import MyInventory from "@/components/marketplace/MyInventory";
import MyListings from "@/components/marketplace/MyListings";
import TradeHistory from "@/components/marketplace/TradeHistory";

export default function MarketplacePage() {
    const { address, isConnected } = useAccount();
    const [activeTab, setActiveTab] = useState<"browse" | "inventory" | "mylistings" | "history">("browse");
    const { address, isConnected } = useAccount();
    const [activeTab, setActiveTab] = useState<"browse" | "inventory" | "mylistings" | "history">("browse");

    if (!isConnected) {
        return (
            <div className="page-container" style={{ textAlign: "center", paddingTop: 120 }}>
                <p style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 12, color: "var(--accent-red)", marginBottom: 16 }}>
                    ⚠ WALLET NOT LINKED
                </p>
                <ConnectButton />
            </div>
        );
    }

    return (
        <div className="page-container">
            <h1 style={{ fontSize: 14, color: "var(--accent)", marginBottom: 6 }}>MARKETPLACE</h1>
            <p style={{ color: "var(--text-dim)", marginBottom: 20, fontSize: 16 }}>
                &gt; Buy, sell, and trade your assets
            </p>

            {/* Tab Navigation */}
            <div style={{
                display: "flex",
                gap: 8,
                marginBottom: 20,
                flexWrap: "wrap",
                borderBottom: "1px solid var(--accent)",
                paddingBottom: 12,
            }}>
                <TabButton
                    label="🛍️ Browse"
                    active={activeTab === "browse"}
                    onClick={() => setActiveTab("browse")}
                />
                <TabButton
                    label="📦 Inventory"
                    active={activeTab === "inventory"}
                    onClick={() => setActiveTab("inventory")}
                />
                <TabButton
                    label="📋 My Listings"
                    active={activeTab === "mylistings"}
                    onClick={() => setActiveTab("mylistings")}
                />
                <TabButton
                    label="⏱️ History"
                    active={activeTab === "history"}
                    onClick={() => setActiveTab("history")}
                />
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === "browse" && <BrowseListings />}
                {activeTab === "inventory" && <MyInventory address={address} />}
                {activeTab === "mylistings" && <MyListings address={address} />}
                {activeTab === "history" && <TradeHistory address={address} />}
            </div>
        </div>
    );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: "8px 16px",
                fontFamily: "'Press Start 2P', cursive",
                fontSize: 8,
                backgroundColor: active ? "var(--accent)" : "transparent",
                color: active ? "var(--bg)" : "var(--text-dim)",
                border: `2px solid ${active ? "var(--accent)" : "var(--accent-dim)"}`,
                cursor: "pointer",
                transition: "all 0.2s",
                fontWeight: active ? "bold" : "normal",
            }}
            onMouseEnter={(e) => {
                if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)";
                }
            }}
            onMouseLeave={(e) => {
                if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--text-dim)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent-dim)";
                }
            }}
        >
            {label}
        </button>
    );
}
