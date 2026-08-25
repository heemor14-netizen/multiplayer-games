import { GameId } from "@/lib/constants";

export interface GameConfig {
  id: GameId;
  name: string;
  icon: string;
  minPlayers: number;
  maxPlayers: number;
}

export interface GameState {
  status: "waiting" | "active" | "round-end" | "game-over";
  currentRound: number;
  totalRounds: number;
  scores: Record<string, number>;
  data: Record<string, unknown>;
}

export interface RoundResult {
  roundNumber: number;
  scores: Record<string, number>;
  details: Record<string, unknown>;
}

export interface GameDefinition {
  config: GameConfig;
  Component: React.ComponentType<{ roomId: string }>;
}
