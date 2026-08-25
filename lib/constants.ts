export const BASE_PATH = "/multiplayer-games";
export const APP_NAME = "لعبة مع Friends";
export const APP_DESCRIPTION = "منصة ألعاب جماعية أونلاين";

export const GAMES = {
  "animal-plant-human": {
    id: "animal-plant-human",
    name: "إنسان نبات حيوان",
    icon: "🌿",
    minPlayers: 2,
    maxPlayers: 4,
  },
  "guess-country": {
    id: "guess-country",
    name: "خمن الدولة",
    icon: "🌍",
    minPlayers: 2,
    maxPlayers: 4,
  },
  drawing: {
    id: "drawing",
    name: "الرسم",
    icon: "🎨",
    minPlayers: 2,
    maxPlayers: 4,
  },
  quiz: {
    id: "quiz",
    name: "مسابقات",
    icon: "🧠",
    minPlayers: 2,
    maxPlayers: 4,
  },
} as const;

export type GameId = keyof typeof GAMES;

export const ROOM_STATUS = {
  LOBBY: "lobby",
  PLAYING: "playing",
  FINISHED: "finished",
} as const;

export type RoomStatus = (typeof ROOM_STATUS)[keyof typeof ROOM_STATUS];

export const ROOM_MAX_PLAYERS = 4;
export const ROOM_MIN_PLAYERS = 2;
