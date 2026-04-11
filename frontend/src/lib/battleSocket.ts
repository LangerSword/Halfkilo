"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface HpEntry {
  name: string;
  current: number;
  max: number;
}

export interface TurnResult {
  turn: number;
  team: number;
  petName: string;
  move: string;
  damage: number;
  hpState: HpEntry[];
  reasoning: string;
}

export interface ReasoningEvent {
  petName: string;
  chunk: string;
  turn: number;
}

export interface MatchOverEvent {
  winner: number;
  matchId: string;
  history: Array<{
    turn: number;
    petName: string;
    move: string;
    damage: number;
    reasoning: string;
  }>;
}

export interface MatchSocketState {
  connected: boolean;
  turns: TurnResult[];
  reasoning: Record<string, string>;
  currentHP: HpEntry[];
  winner: number | null;
  thinkingPet: string | null;
  matchOver: MatchOverEvent | null;
}

const MASTRA_WS_URL = process.env.NEXT_PUBLIC_MASTRA_WS ?? "ws://localhost:3001";

export function useMatchSocket(matchId: string | null): MatchSocketState {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [turns, setTurns] = useState<TurnResult[]>([]);
  const [reasoning, setReasoning] = useState<Record<string, string>>({});
  const [currentHP, setCurrentHP] = useState<HpEntry[]>([]);
  const [winner, setWinner] = useState<number | null>(null);
  const [thinkingPet, setThinkingPet] = useState<string | null>(null);
  const [matchOver, setMatchOver] = useState<MatchOverEvent | null>(null);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "connected":
          setConnected(true);
          break;

        case "thinking":
          setThinkingPet(data.petName);
          break;

        case "reasoning":
          setReasoning((prev) => ({
            ...prev,
            [data.petName]: (prev[data.petName] ?? "") + data.chunk,
          }));
          break;

        case "turn_result": {
          const turn: TurnResult = {
            turn: data.turn,
            team: data.team,
            petName: data.petName,
            move: data.move,
            damage: data.damage,
            hpState: data.hpState,
            reasoning: data.reasoning,
          };
          setTurns((prev) => [...prev, turn]);
          setCurrentHP(data.hpState);
          setThinkingPet(null);
          // Reset reasoning for this pet after their turn
          setReasoning((prev) => ({ ...prev, [data.petName]: "" }));
          break;
        }

        case "match_over":
          setWinner(data.winner);
          setMatchOver(data);
          setThinkingPet(null);
          break;

        case "error":
          console.error("[battleSocket] Server error:", data.message);
          break;
      }
    } catch (err) {
      console.error("[battleSocket] Failed to parse message:", err);
    }
  }, []);

  useEffect(() => {
    if (!matchId) return;

    const ws = new WebSocket(`${MASTRA_WS_URL}?matchId=${matchId}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onmessage = handleMessage;
    ws.onclose = () => setConnected(false);
    ws.onerror = (err) => console.error("[battleSocket] WS error:", err);

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [matchId, handleMessage]);

  return { connected, turns, reasoning, currentHP, winner, thinkingPet, matchOver };
}
