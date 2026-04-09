"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CONTRACTS } from "@/config/contracts";
import { GameCoreABI } from "@/config/abis";

const MOODS = ["Neutral", "Happy", "Angry", "Sad", "Excited"];
const MOOD_ICONS = ["😐", "😊", "😠", "😢", "🤩"];

export default function BattlePage() {
    const { isConnected } = useAccount();
    const [agentA, setAgentA] = useState("");
    const [agentB, setAgentB] = useState("");
    const [moodPetId, setMoodPetId] = useState("");
    const [moodValue, setMoodValue] = useState(0);
    const [isBattling, setIsBattling] = useState(false);
    const [gameMode, setGameMode] = useState<"ai" | "online" | "local">("ai");

    const { data: battleTxHash, writeContract: doBattle, isPending: isBattlePending } = useWriteContract();
    const { data: moodTxHash, writeContract: doMoodUpdate, isPending: isMoodPending } = useWriteContract();

    const { isLoading: isBattleConfirming, isSuccess: isBattleSuccess } = useWaitForTransactionReceipt({ hash: battleTxHash });
    const { isLoading: isMoodConfirming, isSuccess: isMoodSuccess } = useWaitForTransactionReceipt({ hash: moodTxHash });

    useEffect(() => {
        const handleBattleEnd = () => setIsBattling(false);
        window.addEventListener('BATTLE_ENDED', handleBattleEnd);
        return () => window.removeEventListener('BATTLE_ENDED', handleBattleEnd);
    }, []);

    useEffect(() => {
        if (isBattleSuccess) {
            setIsBattling(true);
            window.dispatchEvent(new CustomEvent('START_BATTLE', {
                detail: {
                    agentAName: "Agent " + agentA,
                    petAName: "Pet " + agentA,
                    agentBName: "Agent " + agentB,
                    petBName: "Pet " + agentB,
                    winnerIsA: true, // Visual demo placeholder
                    gameMode: gameMode
                }
            }));
        }
    }, [isBattleSuccess, agentA, agentB]);

    const handleBattle = () => {
        if (!agentA || !agentB) return;
        doBattle({
            address: CONTRACTS.gameCore,
            abi: GameCoreABI,
            functionName: "battle",
            args: [BigInt(agentA), BigInt(agentB)],
        });
    };

    const handleMoodUpdate = () => {
        if (!moodPetId) return;
        doMoodUpdate({
            address: CONTRACTS.gameCore,
            abi: GameCoreABI,
            functionName: "updatePetMood",
            args: [BigInt(moodPetId), moodValue],
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
            <h1 style={{ fontSize: 14, color: "var(--accent)", marginBottom: 6 }}>BATTLE ARENA</h1>
            <p style={{ color: "var(--text-dim)", marginBottom: 20, fontSize: 16 }}>
                &gt; {isBattling ? "BATTLE IN PROGRESS... PRESS ESC IN GAME TO EXIT" : "Engage enemies and adjust pet morale"}
            </p>

            {!isBattling && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Battle Panel */}
                    <div className="pixel-panel">
                        <h2 style={{ fontSize: 10, color: "var(--accent-warm)", marginBottom: 16 }}>
                            ⚔ COMBAT TERMINAL
                        </h2>

                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: "var(--text-dim)", display: "block", marginBottom: 6 }}>
                                        AGENT A
                                    </label>
                                    <input className="pixel-input" type="number" min="1" placeholder="ID" value={agentA} onChange={(e) => setAgentA(e.target.value)} />
                                </div>
                                <div>
                                    <label style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: "var(--text-dim)", display: "block", marginBottom: 6 }}>
                                        AGENT B
                                    </label>
                                    <input className="pixel-input" type="number" min="1" placeholder="ID" value={agentB} onChange={(e) => setAgentB(e.target.value)} />
                                </div>
                            </div>

                            {/* Battle Visualization */}
                            <div className="pixel-panel-inset" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, padding: 20 }}>
                                <div style={{ textAlign: "center" }}>
                                    <div className="inv-slot filled" style={{ width: 56, height: 56, margin: "0 auto 6px" }}>
                                        <span style={{ fontSize: 28 }}>🤖</span>
                                    </div>
                                    <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: "var(--text-dim)" }}>
                                        #{agentA || "?"}
                                    </span>
                                </div>

                                <span style={{ fontSize: 28, color: "var(--accent)", animation: "led-blink 1s ease infinite" }}>⚡</span>

                                <div style={{ textAlign: "center" }}>
                                    <div className="inv-slot filled" style={{ width: 56, height: 56, margin: "0 auto 6px" }}>
                                        <span style={{ fontSize: 28 }}>🤖</span>
                                    </div>
                                    <span style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: "var(--text-dim)" }}>
                                        #{agentB || "?"}
                                    </span>
                                </div>
                            </div>

                            <div style={{ marginTop: 12 }}>
                                <label style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: "var(--text-dim)", display: "block", marginBottom: 6 }}>
                                    GAME MODE
                                </label>
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    <button className={`pixel-btn ${gameMode === 'ai' ? 'selected' : ''}`} style={{ fontSize: 8, padding: 8 }} onClick={() => setGameMode('ai')}>🆚 CPU</button>
                                    <button className={`pixel-btn ${gameMode === 'local' ? 'selected' : ''}`} style={{ fontSize: 8, padding: 8 }} onClick={() => setGameMode('local')}>🎮 LOCAL</button>
                                    <button className={`pixel-btn ${gameMode === 'online' ? 'selected' : ''}`} style={{ fontSize: 8, padding: 8, borderColor: gameMode === 'online' ? 'var(--accent)' : 'inherit' }} onClick={() => setGameMode('online')}>🌐 ONLINE</button>
                                </div>
                            </div>

                            <button
                                className="pixel-btn"
                                onClick={handleBattle}
                                disabled={isBattlePending || isBattleConfirming || !agentA || !agentB}
                                style={{ width: "100%", border: gameMode === 'online' ? '2px solid var(--accent)' : undefined }}
                            >
                                {isBattlePending ? "CONFIRM..." : isBattleConfirming ? "⚔ FIGHTING..." : `⚔ ENGAGE ${gameMode.toUpperCase()}`}
                            </button>

                            {isBattleSuccess && (
                                <div className="tx-success">
                                    ✓ BATTLE RESOLVED | CHECK LOOT IN INVENTORY
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mood Panel */}
                    <div className="pixel-panel">
                        <h2 style={{ fontSize: 10, color: "var(--accent-warm)", marginBottom: 16 }}>
                            🎭 MOOD SHIFT
                        </h2>

                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div>
                                <label style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: "var(--text-dim)", display: "block", marginBottom: 6 }}>
                                    PET TOKEN ID
                                </label>
                                <input className="pixel-input" type="number" min="1" placeholder="ID" value={moodPetId} onChange={(e) => setMoodPetId(e.target.value)} />
                            </div>

                            <div>
                                <label style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 7, color: "var(--text-dim)", display: "block", marginBottom: 6 }}>
                                    NEW MOOD
                                </label>
                                <div className="grid grid-cols-5 gap-2">
                                    {MOODS.map((m, i) => (
                                        <button
                                            key={m}
                                            onClick={() => setMoodValue(i)}
                                            className={`mood-pill ${moodValue === i ? "selected" : ""}`}
                                        >
                                            <div style={{ fontSize: 20 }}>{MOOD_ICONS[i]}</div>
                                            <div style={{ fontFamily: "'Press Start 2P', cursive", fontSize: 6, marginTop: 2, color: "var(--text-dim)" }}>
                                                {m.toUpperCase().slice(0, 4)}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                className="pixel-btn warm"
                                onClick={handleMoodUpdate}
                                disabled={isMoodPending || isMoodConfirming || !moodPetId}
                                style={{ width: "100%" }}
                            >
                                {isMoodPending ? "CONFIRM..." : isMoodConfirming ? "UPDATING..." : "🎭 SHIFT MOOD"}
                            </button>

                            {isMoodSuccess && (
                                <div className="tx-success">✓ MOOD UPDATED</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
