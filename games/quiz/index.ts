import type { GameConfig } from "@/types/game";

export const config: GameConfig = {
  id: "quiz",
  name: "مسابقات",
  icon: "🧠",
  minPlayers: 2,
  maxPlayers: 4,
};

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export const QUESTIONS: QuizQuestion[] = [
  {
    question: "ما هي عاصمة فرنسا؟",
    options: ["لندن", "باريس", "برلين", "روما"],
    correctIndex: 1,
  },
  {
    question: "كم عدد كواكب المجموعة الشمسية؟",
    options: ["7", "8", "9", "10"],
    correctIndex: 1,
  },
  {
    question: "ما هو أكبر محيط في العالم؟",
    options: ["الهادئ", "الأطلسي", "الهندي", "المجمد"],
    correctIndex: 0,
  },
  {
    question: "من مخترع المصباح الكهربائي؟",
    options: ["ألبرت أينشتاين", "نيكولا تسلا", "توماس إديسون", "غراهام بيل"],
    correctIndex: 2,
  },
  {
    question: "ما هي اللغة الأكثر تحدثاً في العالم؟",
    options: ["الإنجليزية", "الصينية", "الإسبانية", "العربية"],
    correctIndex: 1,
  },
  {
    question: "في أي عام هبط الإنسان على سطح القمر؟",
    options: ["1965", "1969", "1972", "1975"],
    correctIndex: 1,
  },
  {
    question: "ما هو العنصر الكيميائي الذي رمزه O؟",
    options: ["الذهب", "الأكسجين", "الفضة", "النحاس"],
    correctIndex: 1,
  },
  {
    question: "أين يقع برج إيفل؟",
    options: ["لندن", "روما", "باريس", "برلين"],
    correctIndex: 2,
  },
  {
    question: "كم عدد أضلاع المثلث؟",
    options: ["2", "3", "4", "5"],
    correctIndex: 1,
  },
  {
    question: "ما هو الكوكب الأحمر؟",
    options: ["المشتري", "زحل", "المريخ", "عطارد"],
    correctIndex: 2,
  },
  {
    question: "من كتب مسرحية هاملت؟",
    options: ["تشارلز ديكنز", "وليام شكسبير", "مارك توين", "جين أوستن"],
    correctIndex: 1,
  },
  {
    question: "ما هي أطول نهر في العالم؟",
    options: ["النيل", "الأمازون", " المسيسيبي", "اليانغتسي"],
    correctIndex: 0,
  },
  {
    question: "كم عدد أرجل العنكبوت؟",
    options: ["6", "8", "10", "12"],
    correctIndex: 1,
  },
  {
    question: "ما هو أصغر كوكب في المجموعة الشمسية؟",
    options: ["عطارد", "الزهرة", "المريخ", "نبتون"],
    correctIndex: 0,
  },
  {
    question: "في أي قارة تقع مصر؟",
    options: ["آسيا", "أوروبا", "أفريقيا", "أمريكا الجنوبية"],
    correctIndex: 2,
  },
];

export type QuizGameState = {
  currentRound: number;
  totalRounds: number;
  currentQuestion: QuizQuestion;
  timeLeft: number;
  status: "showing" | "answering" | "revealing" | "finished";
  answers: Record<string, number>;
  scores: Record<string, number>;
  players: Record<string, { name: string }>;
  usedIndices: number[];
};
