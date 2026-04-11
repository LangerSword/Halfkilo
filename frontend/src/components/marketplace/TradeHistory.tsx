"use client";

import { useState, useEffect } from "react";

interface TradeRecord {
  tradeId: string;
  seller: string;
  buyer: string;
  itemName: string;
  itemTokenId: number;
  price: string;
  status: "pending" | "confirmed" | "failed";
  createdAt: string;
  completedAt?: string;
  txHash?: string;
}

export default function TradeHistory({ address }: { address: `0x${string}` | undefined }) {
  const [history, setHistory] = useState<TradeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "buys" | "sells">("all");

  useEffect(() => {
    if (address) {
      fetchHistory();
    }
  }, [address, activeTab]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      if (!address) return;

      let endpoint = `/api/trade/history/${address}`;
      if (activeTab === "buys") {
        endpoint = `/api/trade/buy-history/${address}`;
      } else if (activeTab === "sells") {
        endpoint = `/api/trade/sell-history/${address}`;
      }

      const res = await fetch(endpoint);
      const data = await res.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "confirmed":
        return "#4a9";
      case "pending":
        return "#fa0";
      case "failed":
        return "#a44";
      default:
        return "#888";
    }
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div>
      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: 8,
        marginBottom: 16,
        borderBottom: "1px solid var(--accent-dim)",
        paddingBottom: 8,
      }}>
        <TabButton
          label="All Trades"
          active={activeTab === "all"}
          onClick={() => setActiveTab("all")}
        />
        <TabButton
          label="📤 Sells"
          active={activeTab === "sells"}
          onClick={() => setActiveTab("sells")}
        />
        <TabButton
          label="📥 Buys"
          active={activeTab === "buys"}
          onClick={() => setActiveTab("buys")}
        />
      </div>

      <div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-dim)" }}>
            ⏳ Loading history...
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-dim)" }}>
            📭 No trades yet
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {history.map((trade) => {
              const isOngoing = activeTab === "all" || (activeTab === "sells" && trade.seller === address) || (activeTab === "buys" && trade.buyer === address);

              return isOngoing ? (
                <div key={trade.tradeId} className="pixel-panel">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "start" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <h4 style={{ fontSize: 11, color: "var(--accent)" }}>
                        {trade.itemName}
                      </h4>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, fontSize: 12 }}>
                        <div>
                          <span style={{ color: "var(--text-dim)" }}>Type</span>
                          <div style={{ color: "var(--text-primary)" }}>
                            {trade.seller === address ? "📤 Sold" : "📥 Bought"}
                          </div>
                        </div>

                        <div>
                          <span style={{ color: "var(--text-dim)" }}>Status</span>
                          <div style={{ color: getStatusColor(trade.status), fontWeight: "bold" }}>
                            {trade.status.toUpperCase()}
                          </div>
                        </div>

                        <div>
                          <span style={{ color: "var(--text-dim)" }}>Price</span>
                          <div style={{ color: "var(--accent-warm)" }}>
                            {parseFloat(trade.price).toFixed(4)} AVAX
                          </div>
                        </div>

                        <div>
                          <span style={{ color: "var(--text-dim)" }}>Date</span>
                          <div style={{ color: "var(--text-primary)" }}>
                            {getTimeAgo(trade.createdAt)}
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: 11, marginTop: 4 }}>
                        <span style={{ color: "var(--text-dim)" }}>
                          {trade.seller === address ? "To: " : "From: "}
                        </span>
                        <span
                          style={{
                            color: "var(--text-primary)",
                            fontFamily: "monospace",
                          }}
                        >
                          {trade.seller === address ? trade.buyer : trade.seller}
                        </span>
                      </div>

                      {trade.txHash && (
                        <div style={{ fontSize: 10, marginTop: 4 }}>
                          <a
                            href={`https://snowtrace.io/tx/${trade.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "var(--accent)",
                              textDecoration: "none",
                              borderBottom: "1px dotted var(--accent)",
                            }}
                          >
                            View on Snowtrace →
                          </a>
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        padding: "8px 12px",
                        backgroundColor: getStatusColor(trade.status) + "20",
                        border: `1px solid ${getStatusColor(trade.status)}`,
                        color: getStatusColor(trade.status),
                        textAlign: "center",
                        fontSize: 11,
                        fontWeight: "bold",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {trade.status === "confirmed" ? "✓" : trade.status === "pending" ? "⏳" : "✗"}
                    </div>
                  </div>
                </div>
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 12px",
        fontFamily: "'Press Start 2P', cursive",
        fontSize: 8,
        backgroundColor: "transparent",
        color: active ? "var(--accent)" : "var(--text-dim)",
        border: "none",
        borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
    >
      {label}
    </button>
  );
}
