import type { GameConfig } from "@/types/game";

export const config: GameConfig = {
  id: "animal-plant-human",
  name: "إنسان نبات حيوان",
  icon: "🌿",
  minPlayers: 2,
  maxPlayers: 4,
};

export const LETTERS = [
  "أ",
  "ب",
  "ت",
  "ث",
  "ج",
  "ح",
  "خ",
  "د",
  "ذ",
  "ر",
  "ز",
  "س",
  "ش",
  "ص",
  "ض",
  "ط",
  "ظ",
  "ع",
  "غ",
  "ف",
  "ق",
  "ك",
  "ل",
  "م",
  "ن",
  "ه",
  "و",
  "ي",
];

export const CATEGORIES = ["إنسان", "نبات", "حيوان"] as const;

export type Category = (typeof CATEGORIES)[number];

export interface RoundState {
  letter: string;
  timeLeft: number;
  answers: Record<string, Record<Category, string>>;
  revealed: boolean;
  scores: Record<string, number>;
}
