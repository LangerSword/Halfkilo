"use client";

import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import ProfileDropdown from "@/components/ProfileDropdown";

export function CommandDeck() {
    const { isConnected } = useAccount();

    return (
        <header
            className="fixed top-0 left-0 right-0 z-50"
            style={{
                background: "var(--bg-panel)",
                borderBottom: "var(--px) solid var(--border-light)",
            }}
        >
            <div className="flex items-center justify-between w-full px-6 h-14">
                {/* Logo Sprite */}
                <div className="flex items-center gap-3">
                    <div className="sprite-float" style={{ width: 32, height: 32 }}>
                        <img
                            src="/assets/knight-sprite.png"
                            alt="Agent Arena"
                            style={{ width: 32, height: 32, imageRendering: "pixelated" }}
                        />
                    </div>
                    <span
                        style={{
                            fontFamily: "'Press Start 2P', cursive",
                            fontSize: 11,
                            color: "var(--accent)",
                            textShadow: "0 0 8px var(--accent-glow)",
                        }}
                    >
                        AGENT ARENA
                    </span>
                </div>

                {/* Right side — profile or connect */}
                <div className="flex items-center gap-2">
                    {isConnected ? (
                        <ProfileDropdown />
                    ) : (
                        <ConnectButton
                            showBalance={false}
                            chainStatus="none"
                            accountStatus="avatar"
                        />
                    )}
                </div>
            </div>
        </header>
    );
}
