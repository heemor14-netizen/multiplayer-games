"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { SyncDB } from "@/lib/syncEngine";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";
import { sound } from "@/lib/sound";
import { getRandomAvatar, getRandomBotName } from "@/lib/avatars";
import { ROOM_MAX_PLAYERS, ROOM_MIN_PLAYERS, type GameId } from "@/lib/constants";
import type { Room, RoomPlayer, RoomMetadata } from "@/types/room";

interface RoomState {
  currentRoom: Room | null;
  currentRoomId: string | null;
  availableRooms: (Room & { id: string })[];
  createRoom: (game: GameId, maxPlayers?: number) => Promise<string>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  kickPlayer: (targetUid: string) => Promise<void>;
  addBot: () => Promise<void>;
  removeBot: (botUid: string) => Promise<void>;
  changeGame: (game: GameId) => Promise<void>;
  startGame: () => Promise<void>;
  rematch: () => Promise<void>;
  sending: boolean;
}

const RoomContext = createContext<RoomState | null>(null);

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function RoomProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [availableRooms, setAvailableRooms] = useState<(Room & { id: string })[]>([]);
  const [sending, setSending] = useState(false);
  const currentRoomRef = useRef<Room | null>(null);

  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);

  // Subscribe to public rooms list
  useEffect(() => {
    const unsub = SyncDB.subscribe("rooms", (data) => {
      if (!data || typeof data !== "object") {
        setAvailableRooms([]);
        return;
      }

      const rooms: (Room & { id: string })[] = [];
      for (const [id, rawRoom] of Object.entries(data as Record<string, Room>)) {
        if (
          rawRoom?.metadata?.status === "lobby" &&
          Object.keys(rawRoom.players || {}).length < (rawRoom.metadata.maxPlayers || ROOM_MAX_PLAYERS)
        ) {
          rooms.push({ ...rawRoom, id });
        }
      }
      setAvailableRooms(rooms);
    });

    return () => unsub();
  }, []);

  // Subscribe to current room updates
  useEffect(() => {
    if (!currentRoomId) return;

    const unsub = SyncDB.subscribe(`rooms/${currentRoomId}`, (data) => {
      if (data && typeof data === "object") {
        const room = data as Room;
        setCurrentRoom(room);
      } else {
        setCurrentRoom(null);
        setCurrentRoomId(null);
      }
    });

    return () => unsub();
  }, [currentRoomId]);

  const createRoom = useCallback(
    async (game: GameId, maxPlayers?: number): Promise<string> => {
      if (!user || !profile) throw new Error("يجب تسجيل الدخول أولاً");
      setSending(true);
      sound.playClick();

      try {
        const roomId = generateRoomCode();
        const clampedMax = Math.max(ROOM_MIN_PLAYERS, Math.min(maxPlayers || ROOM_MAX_PLAYERS, ROOM_MAX_PLAYERS));
        const metadata: RoomMetadata = {
          host: user.uid,
          game,
          status: "lobby",
          maxPlayers: clampedMax,
          createdAt: Date.now(),
        };

        const player: RoomPlayer = {
          uid: user.uid,
          name: profile.displayName || "اللاعب المضيف",
          photoURL: profile.photoURL ?? getRandomAvatar(),
          score: 0,
          joinedAt: Date.now(),
        };

        const room: Room = {
          metadata,
          players: { [user.uid]: player },
          gameState: null,
          chat: {},
        };

        await SyncDB.set(`rooms/${roomId}`, room);
        setCurrentRoomId(roomId);
        setCurrentRoom(room);
        logger.info("Room created", { roomId, game });
        return roomId;
      } finally {
        setSending(false);
      }
    },
    [user, profile]
  );

  const joinRoom = useCallback(
    async (roomId: string) => {
      if (!user || !profile) throw new Error("يجب تسجيل الدخول أولاً");
      setSending(true);
      sound.playClick();

      try {
        const normalizedId = roomId.trim().toUpperCase();
        const roomData = (await SyncDB.get(`rooms/${normalizedId}`)) as Room | null;

        if (!roomData) {
          throw new Error("الغرفة غير موجودة. تأكد من صحة الرمز");
        }

        if (roomData.players && roomData.players[user.uid]) {
          setCurrentRoomId(normalizedId);
          setCurrentRoom(roomData);
          return;
        }

        if (roomData.metadata.status !== "lobby") {
          throw new Error("اللعبة بدأت بالفعل في هذه الغرفة");
        }

        const currentPlayersCount = Object.keys(roomData.players || {}).length;
        if (currentPlayersCount >= roomData.metadata.maxPlayers) {
          throw new Error("الغرفة ممتلئة بالكامل");
        }

        const player: RoomPlayer = {
          uid: user.uid,
          name: profile.displayName || "لاعب جديد",
          photoURL: profile.photoURL ?? getRandomAvatar(),
          score: 0,
          joinedAt: Date.now(),
        };

        await SyncDB.update(`rooms/${normalizedId}/players`, {
          [user.uid]: player,
        });

        setCurrentRoomId(normalizedId);
        logger.info("Player joined room", { roomId: normalizedId, uid: user.uid });
      } finally {
        setSending(false);
      }
    },
    [user, profile]
  );

  const leaveRoom = useCallback(async () => {
    if (!currentRoomId || !user) return;
    setSending(true);
    sound.playClick();

    try {
      const roomData = (await SyncDB.get(`rooms/${currentRoomId}`)) as Room | null;
      if (!roomData) {
        setCurrentRoomId(null);
        setCurrentRoom(null);
        return;
      }

      if (roomData.metadata.host === user.uid) {
        // If host leaves, disband or transfer host
        const remainingUids = Object.keys(roomData.players || {}).filter(
          (uid) => uid !== user.uid && !roomData.players[uid]?.isBot
        );

        if (remainingUids.length === 0) {
          await SyncDB.remove(`rooms/${currentRoomId}`);
        } else {
          const newHost = remainingUids[0];
          await SyncDB.remove(`rooms/${currentRoomId}/players/${user.uid}`);
          await SyncDB.update(`rooms/${currentRoomId}/metadata`, { host: newHost });
        }
      } else {
        await SyncDB.remove(`rooms/${currentRoomId}/players/${user.uid}`);
      }

      setCurrentRoomId(null);
      setCurrentRoom(null);
    } finally {
      setSending(false);
    }
  }, [currentRoomId, user]);

  const kickPlayer = useCallback(
    async (targetUid: string) => {
      if (!currentRoomId || !user || !currentRoom) return;
      if (currentRoom.metadata.host !== user.uid) return;
      sound.playClick();

      await SyncDB.remove(`rooms/${currentRoomId}/players/${targetUid}`);
      logger.info("Player kicked", { roomId: currentRoomId, targetUid });
    },
    [currentRoomId, user, currentRoom]
  );

  const addBot = useCallback(async () => {
    if (!currentRoomId || !user || !currentRoom) return;
    if (currentRoom.metadata.host !== user.uid) return;
    sound.playClick();

    const existingNames = Object.values(currentRoom.players).map((p) => p.name);
    const botId = `bot_${Math.random().toString(36).substring(2, 8)}`;
    const botName = getRandomBotName(existingNames);
    const botAvatar = getRandomAvatar();

    const botPlayer: RoomPlayer = {
      uid: botId,
      name: botName,
      photoURL: botAvatar,
      score: 0,
      joinedAt: Date.now(),
      isBot: true,
    };

    await SyncDB.update(`rooms/${currentRoomId}/players`, {
      [botId]: botPlayer,
    });
  }, [currentRoomId, user, currentRoom]);

  const removeBot = useCallback(
    async (botUid: string) => {
      if (!currentRoomId || !user || !currentRoom) return;
      if (currentRoom.metadata.host !== user.uid) return;
      sound.playClick();

      await SyncDB.remove(`rooms/${currentRoomId}/players/${botUid}`);
    },
    [currentRoomId, user, currentRoom]
  );

  const changeGame = useCallback(
    async (game: GameId) => {
      if (!currentRoomId || !user || !currentRoom) return;
      if (currentRoom.metadata.host !== user.uid) return;
      sound.playClick();

      await SyncDB.update(`rooms/${currentRoomId}/metadata`, { game });
      logger.info("Game changed", { roomId: currentRoomId, game });
    },
    [currentRoomId, user, currentRoom]
  );

  const startGame = useCallback(async () => {
    if (!currentRoomId || !user || !currentRoom) return;
    if (currentRoom.metadata.host !== user.uid) return;
    sound.playGameStart();

    const playerCount = Object.keys(currentRoom.players).length;
    if (playerCount < 1) {
      throw new Error("لا يوجد لاعبين في الغرفة");
    }

    await SyncDB.update(`rooms/${currentRoomId}/metadata`, {
      status: "playing",
    });
    logger.info("Game started by host", { roomId: currentRoomId, game: currentRoom.metadata.game });
  }, [currentRoomId, user, currentRoom]);

  const rematch = useCallback(async () => {
    if (!currentRoomId || !user || !currentRoom) return;
    if (currentRoom.metadata.host !== user.uid) return;
    sound.playClick();

    const updates: Record<string, unknown> = {
      "metadata/status": "lobby",
      gameState: null,
    };

    for (const uid of Object.keys(currentRoom.players)) {
      updates[`players/${uid}/score`] = 0;
    }

    await SyncDB.update(`rooms/${currentRoomId}`, updates);
    logger.info("Rematch started", { roomId: currentRoomId });
  }, [currentRoomId, user, currentRoom]);

  return (
    <RoomContext.Provider
      value={{
        currentRoom,
        currentRoomId,
        availableRooms,
        createRoom,
        joinRoom,
        leaveRoom,
        kickPlayer,
        addBot,
        removeBot,
        changeGame,
        startGame,
        rematch,
        sending,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom(): RoomState {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used within RoomProvider");
  return ctx;
}
