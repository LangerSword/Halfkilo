"use client";

import { useState, useEffect } from "react";
import ListingModal from "./ListingModal";

interface InventoryItem {
  tokenId: number;
  name: string;
  power: number;
  rarity: number;
  owner: string;
}

export default function MyInventory({ address }: { address: `0x${string}` | undefined }) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    if (address) {
      fetchInventory();
    }
  }, [address]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      // For demo purposes, we'll create mock inventory items
      // In a real implementation, you'd fetch from an indexer or contract
      const mockItems: InventoryItem[] = [
        {
          tokenId: 1,
          name: "Iron Sword",
          power: 45,
          rarity: 1,
          owner: address || "",
        },
        {
          tokenId: 2,
          name: "Ancient Scroll",
          power: 72,
          rarity: 3,
          owner: address || "",
        },
        {
          tokenId: 3,
          name: "Golden Amulet",
          power: 60,
          rarity: 2,
          owner: address || "",
        },
        {
          tokenId: 4,
          name: "Dragon's Fang",
          power: 95,
          rarity: 4,
          owner: address || "",
        },
      ];
      setInventory(mockItems);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityLabel = (rarity: number): string => {
    const labels = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];
    return labels[rarity] || "Unknown";
  };

  const getRarityColor = (rarity: number): string => {
    const colors = ["#888", "#4a9", "#49f", "#a4f", "#f4a"];
    return colors[rarity] || "#888";
  };

  return (
    <div>
      <div className="pixel-panel" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 10, color: "var(--accent)", marginBottom: 8 }}>
          📦 Your Items: {inventory.length}
        </h3>
        <p style={{ fontSize: 10, color: "var(--text-dim)" }}>
          Click an item to list it for sale
        </p>
      </div>

      <div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-dim)" }}>
            ⏳ Loading inventory...
          </div>
        ) : inventory.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-dim)" }}>
            📭 No items in inventory
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: 12,
            }}
          >
            {inventory.map((item) => (
              <div
                key={item.tokenId}
                className="pixel-panel"
                style={{
                  cursor: "pointer",
                  transition: "all 0.2s",
                  border: "2px solid var(--accent-dim)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent-warm)";
                  (e.currentTarget as HTMLDivElement).style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent-dim)";
                  (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
                }}
              >
                <h4 style={{ fontSize: 10, color: "var(--accent)", marginBottom: 8 }}>
                  {item.name}
                </h4>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--text-dim)" }}>ID</span>
                    <span style={{ color: "var(--text-primary)" }}>#{item.tokenId}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--text-dim)" }}>Power</span>
                    <span style={{ color: "var(--accent-warm)" }}>{item.power}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--text-dim)" }}>Rarity</span>
                    <span style={{ color: getRarityColor(item.rarity), fontWeight: "bold" }}>
                      {getRarityLabel(item.rarity)}
                    </span>
                  </div>

                  <button
                    className="pixel-btn warm"
                    style={{ width: "100%", fontSize: 10 }}
                    onClick={() => setSelectedItem(item)}
                  >
                    📋 SELL
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedItem && (
        <ListingModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSuccess={() => {
            setSelectedItem(null);
            fetchInventory();
          }}
        />
      )}
    </div>
  );
}
