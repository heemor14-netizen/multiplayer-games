"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRoom } from "@/contexts/RoomContext";
import { Button } from "@/components/ui/Button";
import { PlayerList } from "@/components/room/PlayerList";
import { GameSelector } from "@/components/room/GameSelector";
import { ChatBox } from "@/components/room/ChatBox";
import { GAMES, BASE_PATH, ROOM_STATUS } from "@/lib/constants";
import { logger } from "@/lib/logger";

export default function RoomPage() {
  const { user } = useAuth();
  const {
    currentRoom,
    currentRoomId,
    joinRoom,
    leaveRoom,
    kickPlayer,
    changeGame,
    startGame,
    sending,
  } = useRoom();
  const router = useRouter();
  const [roomId, setRoomId] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      setRoomId(hash);
    } else {
      window.location.href = `${BASE_PATH}/`;
    }
  }, []);

  useEffect(() => {
    if (!currentRoomId && roomId) {
      joinRoom(roomId).catch((err) => {
        logger.error("Failed to join room", err);
        router.push("/rooms/");
      });
    }
  }, [roomId, currentRoomId, joinRoom, router]);

  useEffect(() => {
    if (currentRoom && currentRoom.metadata.status === ROOM_STATUS.PLAYING) {
      window.location.href = `${BASE_PATH}/games/#${currentRoom.metadata.game}`;
    }
  }, [currentRoom]);

  if (!currentRoom || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  const isHost = currentRoom.metadata.host === user.uid;
  const game = GAMES[currentRoom.metadata.game];
  const playerCount = Object.keys(currentRoom.players).length;

  const handleLeave = async () => {
    await leaveRoom();
    router.push("/rooms/");
  };

  const handleStart = async () => {
    try {
      await startGame();
    } catch (err) {
      alert(err instanceof Error ? err.message : "خطأ في بدء اللعبة");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {game?.icon} {game?.name}
          </h1>
          <p className="text-sm text-zinc-500">
            غرفة: {roomId} | اللاعبون: {playerCount}/{currentRoom.metadata.maxPlayers}
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={handleLeave}>
          مغادرة
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <PlayerList
            players={currentRoom.players}
            hostUid={currentRoom.metadata.host}
            currentUid={user.uid}
            onKick={isHost ? kickPlayer : undefined}
          />

          {isHost && (
            <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <GameSelector
                currentGame={currentRoom.metadata.game}
                onChange={changeGame}
                disabled={!isHost}
              />
              <Button
                onClick={handleStart}
                loading={sending}
                disabled={playerCount < 2}
                className="w-full"
              >
                بدء اللعبة ({playerCount} لاعب)
              </Button>
            </div>
          )}
        </div>

        <ChatBox
          roomId={roomId || ""}
          currentUid={user.uid}
        />
      </div>
    </div>
  );
}
