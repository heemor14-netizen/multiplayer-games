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
    if (currentRoom && currentRoom.metadata.status === ROOM_STATUS.PLAYING && currentRoomId) {
      window.location.href = `${BASE_PATH}/games/#${currentRoomId}:${currentRoom.metadata.game}`;
    }
  }, [currentRoom, currentRoomId]);

  if (!currentRoom || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 sm:gap-6">
        <div className="animate-scale-in text-center">
          <span className="text-5xl sm:text-7xl">🏆</span>
          <h1 className="mt-4 text-2xl font-extrabold text-gradient sm:text-3xl">
            النتائج النهائية
          </h1>
          <p className="mt-1 text-sm font-medium text-zinc-500">
            {game?.icon} {game?.name} | غرفة: {roomId}
          </p>
        </div>

        <div className="w-full max-w-md animate-slide-up">
          {sorted.length === 0 && (
            <p className="text-center text-zinc-500">لا توجد نتائج</p>
          )}
          {sorted.map((entry, idx) => (
            <div
              key={entry.uid}
              className={`flex items-center justify-between rounded-2xl p-4 transition-all ${
                idx === 0
                  ? "border border-amber-200 bg-gradient-to-l from-amber-50 to-yellow-50 shadow-lg shadow-amber-500/10 dark:border-amber-800 dark:from-amber-900/20 dark:to-yellow-900/20"
                  : "border border-zinc-200 bg-white/80 dark:border-zinc-700 dark:bg-zinc-800/80"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-lg font-extrabold ${idx === 0 ? "text-amber-500" : "text-zinc-400"}`}>
                  {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                </span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {entry.name}
                </span>
              </div>
              <span className="font-extrabold text-orange-600 dark:text-orange-400">
                {entry.score} نقطة
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row animate-slide-up">
          {isHost && (
            <Button onClick={handleRematch} loading={sending} size="lg" className="w-full sm:w-auto">
              إعادة المباراة
            </Button>
          )}
          <Button variant="danger" onClick={handleLeave} size="lg" className="w-full sm:w-auto">
            مغادرة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
            {game?.icon} {game?.name}
          </h1>
          <p className="mt-1 text-xs font-medium text-zinc-500 sm:text-sm">
            غرفة: {roomId} | اللاعبون: {playerCount}/{currentRoom.metadata.maxPlayers}
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={handleLeave} className="w-full sm:w-auto">
          مغادرة
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <PlayerList
            players={currentRoom.players}
            hostUid={currentRoom.metadata.host}
            currentUid={user.uid}
            onKick={isHost ? kickPlayer : undefined}
          />

          {isHost && (
            <div className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/20 bg-white/80 p-5 shadow-lg backdrop-blur-sm dark:bg-zinc-900/80">
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
                size="lg"
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
