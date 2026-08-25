import { GameId, RoomStatus } from "@/lib/constants";

export interface RoomMetadata {
  host: string;
  game: GameId;
  status: RoomStatus;
  maxPlayers: number;
  createdAt: number;
}

export interface RoomPlayer {
  uid: string;
  name: string;
  photoURL: string | null;
  score: number;
  joinedAt: number;
}

export interface Room {
  metadata: RoomMetadata;
  players: Record<string, RoomPlayer>;
  gameState: Record<string, unknown> | null;
  chat: Record<string, ChatMessage>;
}

export interface ChatMessage {
  uid: string;
  text: string;
  timestamp: number;
}

export interface RoomInvite {
  roomId: string;
  game: GameId;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  status: RoomStatus;
}
