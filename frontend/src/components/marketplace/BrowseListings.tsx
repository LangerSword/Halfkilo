"use client";

import { useState, useEffect } from "react";
import { formatEther } from "viem";
import BuyModal from "./BuyModal";

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

interface Filters {
  searchTerm: string;
  minPrice?: number;
  maxPrice?: number;
  rarity?: number;
}

export default function BrowseListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [filters, setFilters] = useState<Filters>({ searchTerm: "" });

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [listings, filters]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/trade/listings");
      const data = await res.json();
      setListings(data.listings || []);
    } catch (error) {
      console.error("Failed to fetch listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = listings.filter((item) => {
      if (filters.searchTerm && !item.itemName.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
        return false;
      }
      if (filters.minPrice !== undefined && parseFloat(item.price) < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice !== undefined && parseFloat(item.price) > filters.maxPrice) {
        return false;
      }
      if (filters.rarity !== undefined && item.itemRarity !== filters.rarity) {
        return false;
      }
      return true;
    });
    setFilteredListings(filtered);
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
      {/* Filters */}
      <div className="pixel-panel" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 10, color: "var(--accent)", marginBottom: 12 }}>🔍 FILTERS</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
          <div>
            <label style={{ fontSize: 8, color: "var(--text-dim)", display: "block", marginBottom: 4 }}>
              Search Item
            </label>
            <input
              className="pixel-input"
              type="text"
              placeholder="Item name..."
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
            />
          </div>
          <div>
            <label style={{ fontSize: 8, color: "var(--text-dim)", display: "block", marginBottom: 4 }}>
              Min Price (AVAX)
            </label>
            <input
              className="pixel-input"
              type="number"
              placeholder="0"
              min="0"
              step="0.1"
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
          </div>
          <div>
            <label style={{ fontSize: 8, color: "var(--text-dim)", display: "block", marginBottom: 4 }}>
              Max Price (AVAX)
            </label>
            <input
              className="pixel-input"
              type="number"
              placeholder="∞"
              min="0"
              step="0.1"
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
            />
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-dim)" }}>
            ⏳ Loading listings...
          </div>
        ) : filteredListings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-dim)" }}>
            📭 No listings found
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 12,
          }}>
            {filteredListings.map((listing) => (
              <div
                key={listing.listingId}
                className="pixel-panel"
                style={{
                  cursor: "pointer",
                  transition: "all 0.2s",
                  border: "2px solid var(--accent-dim)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)";
                  (e.currentTarget as HTMLDivElement).style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent-dim)";
                  (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
                }}
              >
                <h4 style={{ fontSize: 10, color: "var(--accent)", marginBottom: 8 }}>
                  {listing.itemName}
                </h4>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--text-dim)" }}>Power</span>
                    <span style={{ color: "var(--text-primary)" }}>{listing.itemPower}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--text-dim)" }}>Rarity</span>
                    <span style={{ color: getRarityColor(listing.itemRarity), fontWeight: "bold" }}>
                      {getRarityLabel(listing.itemRarity)}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--text-dim)" }}>Seller</span>
                    <span style={{ color: "var(--text-primary)", fontFamily: "monospace", fontSize: 10 }}>
                      {listing.seller.slice(0, 6)}…
                    </span>
                  </div>

                  <div
                    style={{
                      padding: "8px",
                      backgroundColor: "var(--accent-dim)",
                      color: "var(--accent)",
                      textAlign: "center",
                      fontSize: 12,
                      fontWeight: "bold",
                    }}
                  >
                    {parseFloat(listing.price).toFixed(4)} AVAX
                  </div>

                  <button
                    className="pixel-btn warm"
                    style={{ width: "100%", fontSize: 10 }}
                    onClick={() => setSelectedListing(listing)}
                  >
                    💰 BUY NOW
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Buy Modal */}
      {selectedListing && (
        <BuyModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onSuccess={() => {
            setSelectedListing(null);
            fetchListings();
          }}
        />
      )}
    </div>
  );
}
