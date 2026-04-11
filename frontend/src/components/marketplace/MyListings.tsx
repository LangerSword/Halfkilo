"use client";

import { useState, useEffect } from "react";

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

export default function MyListings({ address }: { address: `0x${string}` | undefined }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      fetchListings();
    }
  }, [address]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      if (!address) return;

      const res = await fetch(`/api/trade/listings/seller/${address}`);
      const data = await res.json();
      setListings(data.listings || []);
    } catch (error) {
      console.error("Failed to fetch listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelListing = async (listingId: string) => {
    try {
      setCanceling(listingId);
      if (!address) return;

      const res = await fetch("/api/trade/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          seller: address,
        }),
      });

      if (res.ok) {
        fetchListings();
      }
    } catch (error) {
      console.error("Failed to cancel listing:", error);
    } finally {
      setCanceling(null);
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
      <div className="pixel-panel" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 10, color: "var(--accent)", marginBottom: 8 }}>
          📋 Your Active Listings: {listings.length}
        </h3>
      </div>

      <div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-dim)" }}>
            ⏳ Loading listings...
          </div>
        ) : listings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-dim)" }}>
            📭 No active listings
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {listings.map((listing) => (
              <div
                key={listing.listingId}
                className="pixel-panel"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 16,
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <h4 style={{ fontSize: 11, color: "var(--accent)", marginBottom: 4 }}>
                    {listing.itemName}
                  </h4>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, fontSize: 12 }}>
                    <div>
                      <span style={{ color: "var(--text-dim)" }}>Power</span>
                      <div style={{ color: "var(--text-primary)" }}>{listing.itemPower}</div>
                    </div>

                    <div>
                      <span style={{ color: "var(--text-dim)" }}>Rarity</span>
                      <div style={{ color: getRarityColor(listing.itemRarity) }}>
                        {getRarityLabel(listing.itemRarity)}
                      </div>
                    </div>

                    <div>
                      <span style={{ color: "var(--text-dim)" }}>Price</span>
                      <div style={{ color: "var(--accent-warm)", fontWeight: "bold" }}>
                        {parseFloat(listing.price).toFixed(4)} AVAX
                      </div>
                    </div>

                    <div>
                      <span style={{ color: "var(--text-dim)" }}>Listed</span>
                      <div style={{ color: "var(--text-primary)" }}>
                        {getTimeAgo(listing.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  className="pixel-btn"
                  onClick={() => handleCancelListing(listing.listingId)}
                  disabled={canceling === listing.listingId}
                  style={{
                    padding: "12px 16px",
                    backgroundColor: "var(--accent-red)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {canceling === listing.listingId ? "..." : "✕ CANCEL"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
