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
import { ROOM_MAX_PLAYERS, ROOM_MIN_PLAYERS, type GameId } from "@/lib/constants";
import type { Room, RoomPlayer, RoomMetadata } from "@/types/room";
import { v4 as uuid } from "uuid";

interface RoomState {
  currentRoom: Room | null;
  currentRoomId: string | null;
  availableRooms: (Room & { id: string })[];
  createRoom: (game: GameId, maxPlayers?: number) => Promise<string>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  kickPlayer: (targetUid: string) => Promise<void>;
  changeGame: (game: GameId) => Promise<void>;
  startGame: () => Promise<void>;
  rematch: () => Promise<void>;
  sending: boolean;
}

const RoomContext = createContext<RoomState | null>(null);

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

    const playersRef = ref(db, `rooms/${currentRoomId}/players`);
    const presenceUnsub = onValue(playersRef, (snapshot) => {
      if (!snapshot.exists() || Object.keys(snapshot.val() || {}).length === 0) {
        const status = currentRoomRef.current?.metadata?.status;
        if (!status || status === "lobby") {
          remove(ref(db, `rooms/${currentRoomId}`));
          logger.info("Room auto-deleted - empty lobby", { roomId: currentRoomId });
          setCurrentRoom(null);
          setCurrentRoomId(null);
        }
      }
    });

    return () => {
      off(roomRef, "value", unsubscribe);
      off(playersRef, "value", presenceUnsub);
    };
  }, [currentRoomId]);

  const createRoom = useCallback(
    async (game: GameId, maxPlayers?: number): Promise<string> => {
      if (!user || !profile) throw new Error("Must be authenticated");
      setSending(true);

      try {
        const db = getFirebaseRTDB();
        const roomId = uuid().slice(0, 8).toUpperCase();
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
          name: profile.displayName,
          photoURL: profile.photoURL ?? null,
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

        if (room.players[user.uid]) {
          setCurrentRoomId(roomId);
          return;
        }

        if (room.metadata.status !== "lobby") {
          throw new Error("Room is not in lobby");
        }

        if (Object.keys(room.players).length >= room.metadata.maxPlayers) {
          throw new Error("Room is full");
        }

        const player: RoomPlayer = {
          uid: user.uid,
          name: profile.displayName,
          photoURL: profile.photoURL ?? null,
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

        const updatedSnapshot = await get(ref(db, `rooms/${currentRoomId}/players`));
        if (!updatedSnapshot.exists() || Object.keys(updatedSnapshot.val() || {}).length === 0) {
          await remove(roomRef);
          logger.info("Room deleted - empty after player left", { roomId: currentRoomId });
        }
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

      const updatedSnapshot = await get(ref(db, `rooms/${currentRoomId}/players`));
      if (!updatedSnapshot.exists() || Object.keys(updatedSnapshot.val() || {}).length === 0) {
        await remove(ref(db, `rooms/${currentRoomId}`));
        logger.info("Room deleted - empty after kick", { roomId: currentRoomId });
      }
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

  const rematch = useCallback(async () => {
    if (!currentRoomId || !user || !currentRoom) return;
    if (currentRoom.metadata.host !== user.uid) return;

    const db = getFirebaseRTDB();
    const updates: Record<string, unknown> = {};
    updates[`rooms/${currentRoomId}/metadata/status`] = "lobby";
    updates[`rooms/${currentRoomId}/gameState`] = null;

    const resetPlayers: Record<string, { score: number }> = {};
    for (const uid of Object.keys(currentRoom.players)) {
      resetPlayers[uid] = { score: 0 };
    }
    updates[`rooms/${currentRoomId}/players`] = resetPlayers;

    await update(ref(db), updates);
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
