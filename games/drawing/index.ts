import type { GameConfig } from "@/types/game";

export const config: GameConfig = {
  id: "drawing",
  name: "الرسم والتخمين",
  icon: "🎨",
  minPlayers: 1,
  maxPlayers: 8,
};

export const DRAW_WORDS = [
  // حيوانات
  "قطة", "كلب", "أسد", "فيل", "زرافة", "حصان", "جمل", "طائر", "سمكة", "أرنب", "سلحفاة", "دب", "بطريق", "ضفدع", "ثعبان", "قرد", "نحلة", "فراشة", "خروف",

  // أشياء ومنزل
  "بيت", "سيارة", "طائرة", "سفينة", "قمر", "شمس", "نجمة", "شجرة", "زهرة", "ساعة", "نظارة", "مفتاح", "هاتف", "حاسوب", "كتاب", "قلم", "حقيبة", "مظلة", "كرسي", "طاولة", "باب", "شباك", "سرير", "تلفاز", "تاج", "فنجان",

  // مأكولات
  "تفاحة", "موزة", "برتقالة", "فراولة", "بطيخ", "عنب", "بيتزا", "برغر", "آيس كريم", "كعكة", "مثلجات", "بيض", "خبز", "جبن",

  // طبيعة
  "جبل", "نهر", "بحر", "غيوم", "مطر", "نار", "بركان", "جزيرة", "شلال", "قوس قزح"
];

export interface GuessEntry {
  uid: string;
  name: string;
  text: string;
  correct: boolean;
  timestamp: number;
}

export type DrawingState = {
  currentRound: number;
  totalRounds: number;
  currentDrawer: string;
  currentWord: string;
  timeLeft: number;
  status: "drawing" | "round-end" | "finished";
  guesses: GuessEntry[];
  scores: Record<string, number>;
  players: Record<string, { name: string; photoURL?: string | null; isBot?: boolean }>;
  correctGuessers: string[];
  drawingData: string;
};
