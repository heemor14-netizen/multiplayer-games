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
    rematch,
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
    window.location.href = `${BASE_PATH}/`;
  };

  const handleStart = async () => {
    try {
      await startGame();
    } catch (err) {
      alert(err instanceof Error ? err.message : "خطأ في بدء اللعبة");
    }
  };

  const handleRematch = async () => {
    try {
      await rematch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "خطأ في إعادة المباراة");
    }
  };

  if (currentRoom.metadata.status === ROOM_STATUS.FINISHED) {
    const gameState = currentRoom.gameState as Record<string, unknown> | null;
    const scores = (gameState?.scores ?? {}) as Record<string, number>;
    const players = currentRoom.players;
    const sorted = Object.entries(scores)
      .map(([uid, score]) => ({ uid, name: players[uid]?.name || uid, score }))
      .sort((a, b) => b.score - a.score);

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
        <span className="text-6xl">🏆</span>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          النتائج النهائية
        </h1>
        <p className="text-sm text-zinc-500">
          {game?.icon} {game?.name} | غرفة: {roomId}
        </p>

        <div className="w-full max-w-md">
          {sorted.length === 0 && (
            <p className="text-center text-zinc-500">لا توجد نتائج</p>
          )}
          {sorted.map((entry, idx) => (
            <div
              key={entry.uid}
              className={`flex items-center justify-between rounded-lg p-3 ${
                idx === 0
                  ? "bg-yellow-100 dark:bg-yellow-900/20"
                  : "bg-zinc-50 dark:bg-zinc-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-zinc-500">
                  #{idx + 1}
                </span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {entry.name}
                </span>
              </div>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {entry.score} نقطة
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          {isHost && (
            <Button onClick={handleRematch} loading={sending}>
              إعادة المباراة
            </Button>
          )}
          <Button variant="danger" onClick={handleLeave}>
            مغادرة
          </Button>
        </div>
      </div>
    );
  }

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
