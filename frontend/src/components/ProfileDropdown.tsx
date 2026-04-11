"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, useChainId, useDisconnect } from "wagmi";
import SpriteFrame from "@/components/SpriteFrame";

const AVATAR_OPTIONS = [
    { id: "sophia", label: "Sophia" },
    { id: "ada", label: "Ada" },
    { id: "turing", label: "Turing" },
    { id: "socrates", label: "Socrates" },
    { id: "aristotle", label: "Aristotle" },
    { id: "descartes", label: "Descartes" },
    { id: "plato", label: "Plato" },
    { id: "leibniz", label: "Leibniz" },
    { id: "chomsky", label: "Chomsky" },
    { id: "dennett", label: "Dennett" },
    { id: "miguel", label: "Miguel" },
    { id: "paul", label: "Paul" },
    { id: "searle", label: "Searle" },
];

export default function ProfileDropdown() {
    const { isConnected, address } = useAccount();
    const chainId = useChainId();
    const { disconnect } = useDisconnect();

    const [open, setOpen] = useState(false);
    const [username, setUsername] = useState("");
    const [avatar, setAvatar] = useState("sophia");
    const [editingAvatar, setEditingAvatar] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const saved = localStorage.getItem("hk_profile");
        if (saved) {
            try {
                const p = JSON.parse(saved);
                if (p.username) setUsername(p.username);
                if (p.avatar) setAvatar(p.avatar);
            } catch {}
        }
    }, []);

    const save = useCallback((u: string, a: string) => {
        localStorage.setItem("hk_profile", JSON.stringify({ username: u, avatar: a }));
    }, []);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setEditingAvatar(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    if (!isConnected) return null;

    const chainLabel = chainId === 43113 ? "Avalanche Fuji" : `Chain ${chainId}`;
    const displayName = username || address?.slice(0, 8) || "Player";

    return (
        <div ref={ref} style={{ position: "relative" }}>
            {/* Trigger button */}
            <button
                type="button"
                onClick={() => { setOpen(!open); setEditingAvatar(false); }}
                style={{
                    background: "none",
                    border: "2px solid var(--border-mid)",
                    borderRadius: 999,
                    padding: "3px 12px 3px 3px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = open ? "var(--accent)" : "var(--border-mid)")}
            >
                <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", background: "var(--bg-panel-inner)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <SpriteFrame characterId={avatar} scale={1.5} />
                </div>
                <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 8, color: "var(--text-primary)", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {displayName}
                </span>
            </button>

            {/* Dropdown */}
            {open && (
                <div style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    width: 280,
                    background: "var(--bg-panel, #0c121c)",
                    border: "1px solid var(--border-mid)",
                    borderRadius: 12,
                    boxShadow: "0 12px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(78,240,208,0.06)",
                    zIndex: 9999,
                    overflow: "hidden",
                }}>
                    {/* Header — avatar + identity */}
                    <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--border-light, #1a2236)", display: "flex", gap: 12, alignItems: "center" }}>
                        <button
                            type="button"
                            onClick={() => setEditingAvatar(!editingAvatar)}
                            style={{
                                background: "var(--bg-panel-inner)", border: "2px solid var(--accent)", borderRadius: "50%",
                                width: 48, height: 48, overflow: "hidden", cursor: "pointer", flexShrink: 0,
                                display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
                            }}
                            title="Change avatar"
                        >
                            <SpriteFrame characterId={avatar} scale={1.8} />
                        </button>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 8, color: "var(--text-primary, #e0e6f0)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {displayName}
                            </p>
                            <p style={{ fontFamily: "'VT323', monospace", fontSize: 14, color: "var(--text-dim)", marginTop: 2 }}>
                                {address?.slice(0, 6)}...{address?.slice(-4)}
                            </p>
                            <p style={{ fontFamily: "'VT323', monospace", fontSize: 12, color: "var(--accent)", marginTop: 1 }}>
                                {chainLabel}
                            </p>
                        </div>
                    </div>

                    {/* Avatar picker (when editing) */}
                    {editingAvatar && (
                        <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border-light, #1a2236)" }}>
                            <p style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 6, color: "var(--text-dim)", marginBottom: 8 }}>
                                SELECT AVATAR
                            </p>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
                                {AVATAR_OPTIONS.map((av) => (
                                    <button
                                        key={av.id}
                                        type="button"
                                        onClick={() => {
                                            setAvatar(av.id);
                                            save(username, av.id);
                                            setEditingAvatar(false);
                                        }}
                                        style={{
                                            background: avatar === av.id ? "rgba(78,240,208,0.12)" : "transparent",
                                            border: avatar === av.id ? "2px solid var(--accent)" : "1px solid transparent",
                                            borderRadius: 6, padding: 3, cursor: "pointer",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            transition: "all 0.1s",
                                        }}
                                        title={av.label}
                                    >
                                        <SpriteFrame characterId={av.id} scale={1.4} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Username field */}
                    <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border-light, #1a2236)" }}>
                        <label style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 6, color: "var(--text-dim)", display: "block", marginBottom: 4 }}>
                            USERNAME
                        </label>
                        <input
                            className="pixel-input"
                            placeholder="Enter name..."
                            value={username}
                            onChange={(e) => { setUsername(e.target.value); save(e.target.value, avatar); }}
                            onKeyDown={(e) => e.stopPropagation()}
                            onKeyUp={(e) => e.stopPropagation()}
                            onKeyPress={(e) => e.stopPropagation()}
                            maxLength={20}
                            style={{ width: "100%", fontSize: 14, padding: "6px 8px" }}
                        />
                    </div>

                    {/* Actions */}
                    <div style={{ padding: "8px 16px 12px" }}>
                        <button
                            type="button"
                            onClick={() => { disconnect(); setOpen(false); }}
                            style={{
                                width: "100%",
                                background: "transparent",
                                border: "1px solid var(--accent-red, #ff4444)",
                                borderRadius: 6,
                                padding: "8px 0",
                                cursor: "pointer",
                                fontFamily: "'Press Start 2P', cursive",
                                fontSize: 7,
                                color: "var(--accent-red, #ff4444)",
                                transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,68,68,0.1)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        >
                            DISCONNECT WALLET
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
