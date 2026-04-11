"use client";

import type { TurnResult } from "@/lib/battleSocket";

interface ReasoningEntry {
  petName: string;
  team: number;
  reasoning: string;
  move?: string;
  isThinking?: boolean;
}

interface ReasoningPanelProps {
  entries: ReasoningEntry[];
  turns: TurnResult[];
  thinkingPet: string | null;
  winner: number | null;
}

const TEAM_COLORS: Record<number, { bg: string; border: string; text: string; accent: string }> = {
  1: { bg: "rgba(34, 102, 255, 0.1)", border: "#2266ff", text: "#88bbff", accent: "#4488ff" },
  2: { bg: "rgba(255, 68, 68, 0.1)", border: "#ff4444", text: "#ffaa88", accent: "#ff6644" },
};

const MOVE_ICONS: Record<string, string> = {
  attack: "⚔️",
  defend: "🛡️",
  special: "✨",
  heal: "💚",
};

export default function ReasoningPanel({ entries, turns, thinkingPet, winner }: ReasoningPanelProps) {
  return (
    <div
      style={{
        width: 340,
        maxHeight: "100%",
        overflowY: "auto",
        background: "rgba(6, 7, 11, 0.95)",
        borderLeft: "2px solid #1a1e2e",
        padding: 12,
        fontFamily: "'Press Start 2P', Courier, monospace",
        fontSize: 7,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ color: "#4ef0d0", fontSize: 8, marginBottom: 4 }}>
        ◆ AGENT REASONING LOG
      </div>

      {/* Turn history */}
      {turns.map((turn, i) => {
        const colors = TEAM_COLORS[turn.team] ?? TEAM_COLORS[1];
        return (
          <div
            key={i}
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: 4,
              padding: 8,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: colors.accent }}>
                T{turn.turn} — {turn.petName}
              </span>
              <span style={{ color: "#aaa" }}>
                {MOVE_ICONS[turn.move] ?? "?"} {turn.move.toUpperCase()}
              </span>
            </div>
            {turn.damage > 0 && (
              <div style={{ color: "#ff4444", marginBottom: 2 }}>
                DMG: {turn.damage}
              </div>
            )}
            <div style={{ color: colors.text, lineHeight: "1.6em", wordBreak: "break-word" }}>
              {turn.reasoning}
            </div>
            {/* HP bars */}
            <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 2 }}>
              {turn.hpState.map((hp) => {
                const pct = Math.max(0, (hp.current / hp.max) * 100);
                const barColor = pct > 50 ? "#4ef0d0" : pct > 25 ? "#e9a84c" : "#ff4444";
                return (
                  <div key={hp.name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ color: "#888", minWidth: 60, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {hp.name}
                    </span>
                    <div style={{ flex: 1, height: 4, background: "#1a1e2e", borderRadius: 2 }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: barColor,
                          borderRadius: 2,
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                    <span style={{ color: "#aaa", minWidth: 40, textAlign: "right" }}>
                      {hp.current}/{hp.max}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Thinking indicator */}
      {thinkingPet && (
        <div
          style={{
            background: "rgba(78, 240, 208, 0.08)",
            border: "1px solid #4ef0d0",
            borderRadius: 4,
            padding: 8,
            color: "#4ef0d0",
            animation: "led-blink 1s ease infinite",
          }}
        >
          ⏳ {thinkingPet} is thinking...
        </div>
      )}

      {/* Live reasoning streams */}
      {entries
        .filter((e) => e.isThinking && e.reasoning)
        .map((entry, i) => {
          const colors = TEAM_COLORS[entry.team] ?? TEAM_COLORS[1];
          return (
            <div
              key={`thinking-${i}`}
              style={{
                background: colors.bg,
                border: `1px dashed ${colors.border}`,
                borderRadius: 4,
                padding: 8,
                color: colors.text,
                opacity: 0.8,
              }}
            >
              <span style={{ color: colors.accent }}>💭 {entry.petName}</span>
              <div style={{ marginTop: 4, lineHeight: "1.6em" }}>
                {entry.reasoning}
                <span style={{ animation: "led-blink 0.5s ease infinite" }}>▌</span>
              </div>
            </div>
          );
        })}

      {/* Winner banner */}
      {winner !== null && (
        <div
          style={{
            background: "rgba(255, 215, 0, 0.15)",
            border: "2px solid #ffd700",
            borderRadius: 4,
            padding: 12,
            textAlign: "center",
            color: "#ffd700",
            fontSize: 10,
          }}
        >
          🏆 TEAM {winner} WINS! 🏆
        </div>
      )}
    </div>
  );
}
