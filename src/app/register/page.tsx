"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CONTRACTS } from "@/config/contracts";
import { GameCoreABI } from "@/config/abis";

const CLASSES = ["Berserker", "Wizard", "Rogue", "Paladin", "Ranger", "Necromancer"];
const PERSONALITIES = ["Calm", "Aggressive", "Playful", "Shy"];

export default function RegisterPage() {
    const { isConnected, address } = useAccount();
    const [agentName, setAgentName] = useState("");
    const [agentClass, setAgentClass] = useState(CLASSES[0]);
    const [metadataURI, setMetadataURI] = useState("ipfs://");
    const [petName, setPetName] = useState("");
    const [petPersonality, setPetPersonality] = useState(0);
    const [step, setStep] = useState<"agent" | "pet">("agent");

    const { data: agentTxHash, writeContract: registerAgent, isPending: isRegPending } = useWriteContract();
    const { data: petTxHash, writeContract: registerPet, isPending: isPetPending } = useWriteContract();

    const { isLoading: isAgentConfirming, isSuccess: isAgentSuccess } = useWaitForTransactionReceipt({ hash: agentTxHash });
    const { isLoading: isPetConfirming, isSuccess: isPetSuccess } = useWaitForTransactionReceipt({ hash: petTxHash });

    const handleRegisterAgent = () => {
        if (!address || !agentName) return;
        registerAgent({
            address: CONTRACTS.gameCore,
            abi: GameCoreABI,
            functionName: "registerAgent",
            args: [address, agentName, agentClass, metadataURI],
        });
    };

    const handleRegisterPet = () => {
        if (!petName) return;
        registerPet({
            address: CONTRACTS.gameCore,
            abi: GameCoreABI,
            functionName: "registerAndAssignPet",
            args: [BigInt(1), petName, petPersonality],
        });
    };

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
            <h1 style={{ fontSize: 14, color: "var(--accent)", marginBottom: 6 }}>RECRUITMENT OFFICE</h1>
            <p style={{ color: "var(--text-dim)", marginBottom: 20, fontSize: 16 }}>
                &gt; Create your agent and assign a companion
            </p>

            {/* Tab Switcher */}
            <div className="flex gap-2" style={{ marginBottom: 16 }}>
                <button
                    onClick={() => setStep("agent")}
                    className={`cmd-btn ${step === "agent" ? "active" : ""}`}
                    style={{ minWidth: 100 }}
                >
                    <span className="cmd-icon">⚔️</span>
                    <span className="cmd-label">RECRUIT</span>
                </button>
                <button
                    onClick={() => setStep("pet")}
                    className={`cmd-btn ${step === "pet" ? "active" : ""}`}
                    style={{ minWidth: 100 }}
                >
                    <span className="cmd-icon">🐾</span>
                    <span className="cmd-label">BOND</span>
                </button>
            </div>

            {step === "agent" ? (
                <div className="pixel-panel" style={{ maxWidth: 520 }}>
                    <h2 style={{ fontSize: 10, color: "var(--accent-warm)", marginBottom: 16 }}>CREATE AGENT</h2>

                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <div>
                            <label style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: "var(--text-dim)", display: "block", marginBottom: 6 }}>
                                AGENT NAME
                            </label>
                            <input
                                className="pixel-input"
                                placeholder="Shadow Knight..."
                                value={agentName}
                                onChange={(e) => setAgentName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: "var(--text-dim)", display: "block", marginBottom: 6 }}>
                                CLASS
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {CLASSES.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setAgentClass(c)}
                                        className={`class-chip ${agentClass === c ? "selected" : ""}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: "var(--text-dim)", display: "block", marginBottom: 6 }}>
                                METADATA URI
                            </label>
                            <input
                                className="pixel-input"
                                placeholder="ipfs://..."
                                value={metadataURI}
                                onChange={(e) => setMetadataURI(e.target.value)}
                            />
                        </div>

                        <button
                            className="pixel-btn"
                            onClick={handleRegisterAgent}
                            disabled={isRegPending || isAgentConfirming || !agentName}
                            style={{ width: "100%", marginTop: 6 }}
                        >
                            {isRegPending ? "CONFIRM IN WALLET..." : isAgentConfirming ? "MINTING..." : "⚡ MINT AGENT"}
                        </button>

                        {isAgentSuccess && (
                            <div className="tx-success">
                                ✓ AGENT RECRUITED | TX: {agentTxHash?.slice(0, 16)}…
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="pixel-panel" style={{ maxWidth: 520 }}>
                    <h2 style={{ fontSize: 10, color: "var(--accent-warm)", marginBottom: 16 }}>ASSIGN PET</h2>

                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <div>
                            <label style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: "var(--text-dim)", display: "block", marginBottom: 6 }}>
                                PET NAME
                            </label>
                            <input
                                className="pixel-input"
                                placeholder="Flame Fox..."
                                value={petName}
                                onChange={(e) => setPetName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: "var(--text-dim)", display: "block", marginBottom: 6 }}>
                                PERSONALITY
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {PERSONALITIES.map((p, i) => (
                                    <button
                                        key={p}
                                        onClick={() => setPetPersonality(i)}
                                        className={`class-chip ${petPersonality === i ? "selected" : ""}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            className="pixel-btn warm"
                            onClick={handleRegisterPet}
                            disabled={isPetPending || isPetConfirming || !petName}
                            style={{ width: "100%", marginTop: 6 }}
                        >
                            {isPetPending ? "CONFIRM..." : isPetConfirming ? "BONDING..." : "🐾 BOND PET"}
                        </button>

                        {isPetSuccess && (
                            <div className="tx-success">
                                ✓ PET BONDED | TX: {petTxHash?.slice(0, 16)}…
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
