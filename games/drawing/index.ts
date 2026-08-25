import type { GameConfig } from "@/types/game";

export const config: GameConfig = {
  id: "drawing",
  name: "الرسم",
  icon: "🎨",
  minPlayers: 2,
  maxPlayers: 4,
};

export const DRAW_WORDS = [
  "قطة",
  "كلب",
  "بيت",
  "شجرة",
  "سيارة",
  "قمر",
  "شمس",
  "سمكة",
  "طائر",
  "زهرة",
  "كتاب",
  "قلم",
  "هاتف",
  "حقيبة",
  "ساعة",
  "نظارة",
  "مفتاح",
  "mersh",
  "ساعة يد",
  "مظلة",
  " fooza ",
  "برتقالة",
  "تفاحة",
  "موزة",
  "عنب",
  "فراولة",
];

export type DrawingState = {
  currentRound: number;
  totalRounds: number;
  currentDrawer: string;
  currentWord: string;
  timeLeft: number;
  status: "waiting" | "drawing" | "guessing" | "round-end" | "finished";
  guesses: Record<string, { uid: string; text: string; correct: boolean }[]>;
  scores: Record<string, number>;
  players: Record<string, { name: string }>;
  correctGuessers: string[];
  drawingData: string;
};
