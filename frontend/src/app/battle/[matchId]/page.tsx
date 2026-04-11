"use client";

import { use, useEffect, useMemo } from "react";
import { useMatchSocket } from "@/lib/battleSocket";
import ReasoningPanel from "@/components/ReasoningPanel";

interface PageProps {
  params: Promise<{ matchId: string }>;
}

export default function BattleMatchPage({ params }: PageProps) {
  const { matchId } = use(params);
  const { connected, turns, reasoning, currentHP, winner, thinkingPet, matchOver } = useMatchSocket(matchId);

  // Dispatch Phaser events based on battle socket state
  useEffect(() => {
    if (turns.length === 0) return;
    const latest = turns[turns.length - 1];

    window.dispatchEvent(
      new CustomEvent("MASTRA_TURN_RESULT", { detail: latest })
    );
  }, [turns]);

  useEffect(() => {
    if (thinkingPet) {
      window.dispatchEvent(
        new CustomEvent("MASTRA_THINKING", { detail: { petName: thinkingPet } })
      );
    }
  }, [thinkingPet]);

  useEffect(() => {
    if (matchOver) {
      window.dispatchEvent(
        new CustomEvent("MASTRA_MATCH_OVER", { detail: matchOver })
      );
    }
  }, [matchOver]);

  // Build reasoning entries for the panel
  const reasoningEntries = useMemo(() => {
    const entries: Array<{
      petName: string;
      team: number;
      reasoning: string;
      move?: string;
      isThinking?: boolean;
    }> = [];

    // Add live thinking entries
    Object.entries(reasoning).forEach(([petName, text]) => {
      if (text) {
        entries.push({
          petName,
          team: 1, // We'll infer team from turns if available
          reasoning: text,
          isThinking: true,
        });
      }
    });

    return entries;
  }, [reasoning]);

  return (
    <div className="battle-page-bg battle-page-bg--masked">
      <div style={{ display: "flex", height: "100vh", width: "100%" }}>
        {/* Main battle area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Connection status bar */}
          <div
            style={{
              padding: "6px 12px",
              background: "rgba(6, 7, 11, 0.9)",
              borderBottom: "1px solid #1a1e2e",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "'Press Start 2P', cursive",
              fontSize: 7,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: connected ? "#4ef0d0" : "#ff4444",
                display: "inline-block",
              }}
            />
            <span style={{ color: connected ? "#4ef0d0" : "#ff4444" }}>
              {connected ? "CONNECTED" : "CONNECTING..."}
            </span>
            <span style={{ color: "#555", marginLeft: "auto" }}>
              MATCH: {matchId.slice(0, 8)}...
            </span>
            {winner !== null && (
              <span style={{ color: "#ffd700" }}>
                WINNER: TEAM {winner}
              </span>
            )}
          </div>

          {/* Phaser canvas area — the GlobalCanvas in layout renders the game */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                color: "#4ef0d0",
                fontFamily: "'Press Start 2P', cursive",
                fontSize: 10,
                textAlign: "center",
              }}
            >
              {!connected && (
                <div>
                  <p>CONNECTING TO MATCH SERVER...</p>
                  <p style={{ color: "#888", fontSize: 7, marginTop: 8 }}>
                    WebSocket: {process.env.NEXT_PUBLIC_MASTRA_WS ?? "ws://localhost:3001"}
                  </p>
                </div>
              )}
              {connected && turns.length === 0 && !thinkingPet && (
                <p>WAITING FOR BATTLE TO START...</p>
              )}
            </div>

            {/* HP overlay for Phaser scene */}
            {currentHP.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  right: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  pointerEvents: "none",
                  zIndex: 50,
                }}
              >
                {currentHP.map((hp, idx) => {
                  const pct = Math.max(0, (hp.current / hp.max) * 100);
                  const barColor = pct > 50 ? "#4ef0d0" : pct > 25 ? "#e9a84c" : "#ff4444";
                  const isTeam1 = idx < 2;
                  return (
                    <div
                      key={hp.name}
                      style={{
                        minWidth: 120,
                        fontFamily: "'Press Start 2P', cursive",
                        fontSize: 6,
                        color: isTeam1 ? "#88bbff" : "#ffaa88",
                      }}
                    >
                      <div>{hp.name}</div>
                      <div
                        style={{
                          height: 6,
                          background: "#1a1e2e",
                          borderRadius: 3,
                          marginTop: 2,
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            background: barColor,
                            borderRadius: 3,
                            transition: "width 0.8s ease",
                          }}
                        />
                      </div>
                      <div style={{ color: "#aaa", marginTop: 2 }}>
                        {hp.current}/{hp.max}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Reasoning Panel sidebar */}
        <ReasoningPanel
          entries={reasoningEntries}
          turns={turns}
          thinkingPet={thinkingPet}
          winner={winner}
        />
      </div>
    </div>
  );
}
