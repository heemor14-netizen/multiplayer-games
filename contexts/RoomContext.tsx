"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  off,
} from "firebase/database";
import { getFirebaseRTDB } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "@/lib/logger";
import { ROOM_MAX_PLAYERS, type GameId } from "@/lib/constants";
import type { Room, RoomPlayer, RoomMetadata } from "@/types/room";
import { v4 as uuid } from "uuid";

interface RoomState {
  currentRoom: Room | null;
  currentRoomId: string | null;
  availableRooms: (Room & { id: string })[];
  createRoom: (game: GameId) => Promise<string>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  kickPlayer: (targetUid: string) => Promise<void>;
  changeGame: (game: GameId) => Promise<void>;
  startGame: () => Promise<void>;
  sending: boolean;
}

const RoomContext = createContext<RoomState | null>(null);

export function RoomProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [availableRooms, setAvailableRooms] = useState<(Room & { id: string })[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;

    const db = getFirebaseRTDB();
    const roomsRef = ref(db, "rooms");
    const unsubscribe = onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setAvailableRooms([]);
        return;
      }

      const rooms: (Room & { id: string })[] = [];
      for (const [id, room] of Object.entries(data)) {
        const r = room as Room;
        if (r.metadata?.status === "lobby" && Object.keys(r.players || {}).length < r.metadata.maxPlayers) {
          rooms.push({ ...r, id });
        }
      }
      setAvailableRooms(rooms);
    });

    return () => off(roomsRef, "value", unsubscribe);
  }, [user]);

  useEffect(() => {
    if (!currentRoomId) return;

    const db = getFirebaseRTDB();
    const roomRef = ref(db, `rooms/${currentRoomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCurrentRoom(data as Room);
      } else {
        setCurrentRoom(null);
        setCurrentRoomId(null);
      }
    });

    return () => off(roomRef, "value", unsubscribe);
  }, [currentRoomId]);

  const createRoom = useCallback(
    async (game: GameId): Promise<string> => {
      if (!user || !profile) throw new Error("Must be authenticated");
      setSending(true);

      try {
        const db = getFirebaseRTDB();
        const roomId = uuid().slice(0, 8).toUpperCase();
        const metadata: RoomMetadata = {
          host: user.uid,
          game,
          status: "lobby",
          maxPlayers: ROOM_MAX_PLAYERS,
          createdAt: Date.now(),
        };

        const player: RoomPlayer = {
          uid: user.uid,
          name: profile.displayName,
          photoURL: profile.photoURL,
          score: 0,
          joinedAt: Date.now(),
        };

        const room: Room = {
          metadata,
          players: { [user.uid]: player },
          gameState: null,
          chat: {},
        };

        await set(ref(db, `rooms/${roomId}`), room);
        setCurrentRoomId(roomId);
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
      if (!user || !profile) throw new Error("Must be authenticated");
      setSending(true);

      try {
        const db = getFirebaseRTDB();
        const roomRef = ref(db, `rooms/${roomId}`);
        const snapshot = await get(roomRef);

        if (!snapshot.exists()) {
          throw new Error("Room not found");
        }

        const room = snapshot.val() as Room;

        if (room.metadata.status !== "lobby") {
          throw new Error("Room is not in lobby");
        }

        if (Object.keys(room.players).length >= room.metadata.maxPlayers) {
          throw new Error("Room is full");
        }

        if (room.players[user.uid]) {
          setCurrentRoomId(roomId);
          return;
        }

        const player: RoomPlayer = {
          uid: user.uid,
          name: profile.displayName,
          photoURL: profile.photoURL,
          score: 0,
          joinedAt: Date.now(),
        };

        await update(ref(db, `rooms/${roomId}/players`), {
          [user.uid]: player,
        });

        setCurrentRoomId(roomId);
        logger.info("Player joined room", { roomId, uid: user.uid });
      } finally {
        setSending(false);
      }
    },
    [user, profile]
  );

  const leaveRoom = useCallback(async () => {
    if (!currentRoomId || !user) return;
    setSending(true);

    try {
      const db = getFirebaseRTDB();
      const roomRef = ref(db, `rooms/${currentRoomId}`);
      const snapshot = await get(roomRef);

      if (!snapshot.exists()) {
        setCurrentRoomId(null);
        return;
      }

      const room = snapshot.val() as Room;

      if (room.metadata.host === user.uid) {
        await remove(roomRef);
        logger.info("Room disbanded by host", { roomId: currentRoomId });
      } else {
        await remove(ref(db, `rooms/${currentRoomId}/players/${user.uid}`));
        logger.info("Player left room", {
          roomId: currentRoomId,
          uid: user.uid,
        });
      }

      setCurrentRoomId(null);
    } finally {
      setSending(false);
    }
  }, [currentRoomId, user]);

  const kickPlayer = useCallback(
    async (targetUid: string) => {
      if (!currentRoomId || !user || !currentRoom) return;
      if (currentRoom.metadata.host !== user.uid) return;

      const db = getFirebaseRTDB();
      await remove(ref(db, `rooms/${currentRoomId}/players/${targetUid}`));
      logger.info("Player kicked", {
        roomId: currentRoomId,
        targetUid,
      });
    },
    [currentRoomId, user, currentRoom]
  );

  const changeGame = useCallback(
    async (game: GameId) => {
      if (!currentRoomId || !user || !currentRoom) return;
      if (currentRoom.metadata.host !== user.uid) return;

      const db = getFirebaseRTDB();
      await update(ref(db, `rooms/${currentRoomId}/metadata`), { game });
      logger.info("Game changed", { roomId: currentRoomId, game });
    },
    [currentRoomId, user, currentRoom]
  );

  const startGame = useCallback(async () => {
    if (!currentRoomId || !user || !currentRoom) return;
    if (currentRoom.metadata.host !== user.uid) return;

    const playerCount = Object.keys(currentRoom.players).length;
    const gameConfig = {
      "animal-plant-human": { minPlayers: 2 },
      "guess-country": { minPlayers: 2 },
      drawing: { minPlayers: 2 },
      quiz: { minPlayers: 2 },
    }[currentRoom.metadata.game];

    if (playerCount < gameConfig.minPlayers) {
      throw new Error("Not enough players");
    }

    const db = getFirebaseRTDB();
    await update(ref(db, `rooms/${currentRoomId}/metadata`), {
      status: "playing",
    });
    logger.info("Game started", {
      roomId: currentRoomId,
      game: currentRoom.metadata.game,
    });
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
        changeGame,
        startGame,
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
