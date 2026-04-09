"use client";

import { useAccount, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CONTRACTS } from "@/config/contracts";
import { AgentNFTABI, PetNFTABI } from "@/config/abis";

export default function HomePage() {
  const { isConnected } = useAccount();

  const { data: agentCount } = useReadContract({
    address: CONTRACTS.agentNFT,
    abi: AgentNFTABI,
    functionName: "totalSupply",
    query: { enabled: !!CONTRACTS.agentNFT },
  });

  const { data: petCount } = useReadContract({
    address: CONTRACTS.petNFT,
    abi: PetNFTABI,
    functionName: "totalSupply",
    query: { enabled: !!CONTRACTS.petNFT },
  });

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", backgroundColor: "transparent" }}>



      {/* 
        We overlay the critical Web3 state stuff like the wallet connection 
        and agent stats on top of the canvas layout using absolute positioning.
      */}
      <div style={{ position: "absolute", top: 20, right: 20, zIndex: 100 }}>
        <ConnectButton />
      </div>

      <div style={{ position: "absolute", top: 20, left: 20, zIndex: 100, display: "flex", gap: "10px", pointerEvents: "none" }}>

        <div className="pixel-panel-inset" style={{ padding: "10px 15px", backgroundColor: "rgba(0,0,0,0.7)" }}>
          <div style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 8, color: "var(--accent)" }}>
            AGENTS: {agentCount?.toString() || "0"}
          </div>
        </div>

        <div className="pixel-panel-inset" style={{ padding: "10px 15px", backgroundColor: "rgba(0,0,0,0.7)" }}>
          <div style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 8, color: "var(--accent-warm)" }}>
            PETS: {petCount?.toString() || "0"}
          </div>
        </div>
      </div>

      {/* A small overlay when wallet is not connected to instruct user */}
      {!isConnected && (
        <div style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
          pointerEvents: "none"
        }}>
          <div className="pixel-panel-inset" style={{ padding: 15, backgroundColor: "rgba(255,0,0,0.2)" }}>
            <p style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 10, color: "#fff", textShadow: "1px 1px 0 #000" }}>
              &gt; PLEASE CONNECT WALLET TO MANAGE TEAM
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
