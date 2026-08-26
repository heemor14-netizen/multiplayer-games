export const BASE_PATH = "/multiplayer-games";
export const APP_NAME = "فكرة 💡";
export const APP_DESCRIPTION = "أفضل منصة ألعاب جماعية أونلاين باللغة العربية";

export const GAMES = {
  "animal-plant-human": {
    id: "animal-plant-human",
    name: "إنسان نبات حيوان",
    description: "اللعبة الكلاسيكية الشهيرة بحرف عشوائي وسرعة بديهة",
    icon: "🌿",
    color: "from-emerald-500 to-teal-600",
    badge: "سرعة بديهة",
    minPlayers: 1, // With bots or friends
    maxPlayers: 8,
  },
  "guess-country": {
    id: "guess-country",
    name: "خمن الدولة",
    description: "تحدّ معلوماتك الجغرافية وخمن الدولة من المعالم والعاصمة والعلم",
    icon: "🌍",
    color: "from-amber-500 to-orange-600",
    badge: "جغرافيا",
    minPlayers: 1,
    maxPlayers: 8,
  },
  drawing: {
    id: "drawing",
    name: "الرسم والتخمين",
    description: "ارسم الكلمة بألوانك ودع أصدقاءك يخمنون ما ترسمه بسرعة",
    icon: "🎨",
    color: "from-purple-500 to-pink-600",
    badge: "إبداع",
    minPlayers: 1,
    maxPlayers: 8,
  },
  quiz: {
    id: "quiz",
    name: "مسابقات وتحدي",
    description: "أسئلة ثقافية ممتعة في مجالات متنوعة وسرعة الإجابة تمنح نقاطاً أكثر",
    icon: "🧠",
    color: "from-blue-500 to-indigo-600",
    badge: "ثقافة وذكاء",
    minPlayers: 1,
    maxPlayers: 8,
  },
} as const;

export type GameId = keyof typeof GAMES;

export const ROOM_STATUS = {
  LOBBY: "lobby",
  PLAYING: "playing",
  FINISHED: "finished",
} as const;

export type RoomStatus = (typeof ROOM_STATUS)[keyof typeof ROOM_STATUS];

export const ROOM_MAX_PLAYERS = 8;
export const ROOM_MIN_PLAYERS = 1;
