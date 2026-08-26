"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRoom } from "@/contexts/RoomContext";
import { Button } from "@/components/ui/Button";
import { PlayerList } from "@/components/room/PlayerList";
import { GameSelector } from "@/components/room/GameSelector";
import { ChatBox } from "@/components/room/ChatBox";
import { GAMES, ROOM_STATUS } from "@/lib/constants";
import { sound } from "@/lib/sound";
import { launchConfetti } from "@/lib/confetti";
import { logger } from "@/lib/logger";

export default function RoomPage() {
  const { user } = useAuth();
  const {
    currentRoom,
    currentRoomId,
    joinRoom,
    leaveRoom,
    kickPlayer,
    addBot,
    removeBot,
    changeGame,
    startGame,
    rematch,
    sending,
  } = useRoom();
  const router = useRouter();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) {
        setRoomId(hash);
      } else {
        router.push("/");
      }
    };

    parseHash();
    window.addEventListener("hashchange", parseHash);
    return () => window.removeEventListener("hashchange", parseHash);
  }, [router]);

  useEffect(() => {
    if (!currentRoomId && roomId && user) {
      joinRoom(roomId).catch((err) => {
        logger.error("Failed to join room", err);
        router.push("/");
      });
    }
  }, [roomId, currentRoomId, joinRoom, router, user]);

  // When room becomes playing, navigate smoothly to /games/
  useEffect(() => {
    if (currentRoom && currentRoom.metadata.status === ROOM_STATUS.PLAYING && currentRoomId) {
      router.push(`/games/#${currentRoomId}:${currentRoom.metadata.game}`);
    }
  }, [currentRoom, currentRoomId, router]);

  // If room finished, launch confetti
  useEffect(() => {
    if (currentRoom?.metadata.status === ROOM_STATUS.FINISHED) {
      sound.playVictory();
      launchConfetti();
    }
  }, [currentRoom?.metadata.status]);

  if (!currentRoom || !user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        <p className="text-sm font-bold text-zinc-500">جاري دخول الغرفة...</p>
      </div>
    );
  }

  const isHost = currentRoom.metadata.host === user.uid;
  const game = GAMES[currentRoom.metadata.game];
  const playerCount = Object.keys(currentRoom.players).length;

  const handleLeave = async () => {
    sound.playClick();
    await leaveRoom();
    router.push("/");
  };

  const handleStart = async () => {
    try {
      sound.playClick();
      await startGame();
    } catch (err) {
      alert(err instanceof Error ? err.message : "خطأ في بدء اللعبة");
    }
  };

  const handleRematch = async () => {
    try {
      sound.playClick();
      await rematch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "خطأ في إعادة المباراة");
    }
  };

  const copyRoomLink = () => {
    if (typeof window !== "undefined") {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      setCopied(true);
      sound.playClick();
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Finished Room Scoreboard
  if (currentRoom.metadata.status === ROOM_STATUS.FINISHED) {
    const gameState = currentRoom.gameState as Record<string, unknown> | null;
    const scores = (gameState?.scores ?? {}) as Record<string, unknown>;
    const players = currentRoom.players;

    const sorted = Object.entries(players)
      .map(([uid, player]) => {
        let total = 0;
        const raw = scores[uid];
        if (typeof raw === "number") total = raw;
        else if (typeof raw === "object" && raw !== null) {
          total = Object.values(raw as Record<string, number>).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
        }
        return { uid, name: player.name, photoURL: player.photoURL, score: total };
      })
      .sort((a, b) => b.score - a.score);

    return (
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-6 p-4 pt-10 animate-scale-in">
        <div className="text-center">
          <span className="text-6xl sm:text-7xl animate-bounce">🏆</span>
          <h1 className="mt-3 text-3xl font-extrabold text-gradient sm:text-4xl">
            النتائج النهائية
          </h1>
          <p className="mt-1 text-sm font-bold text-zinc-500">
            {game?.icon} {game?.name} | غرفة: {roomId}
          </p>
        </div>

        <div className="w-full space-y-3">
          {sorted.map((entry, idx) => (
            <div
              key={entry.uid}
              className={`flex items-center justify-between rounded-3xl p-4 transition-all ${
                idx === 0
                  ? "border-2 border-amber-400 bg-gradient-to-l from-amber-50 to-yellow-50 shadow-xl shadow-amber-500/15 dark:border-amber-600 dark:from-amber-950/40 dark:to-yellow-950/40"
                  : "border border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-900/80"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{entry.photoURL || "👤"}</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{entry.name}</span>
                </div>
              </div>
              <span className="text-lg font-extrabold text-orange-600 dark:text-orange-400">
                {entry.score} نقطة
              </span>
            </div>
          ))}
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row justify-center">
          {isHost && (
            <Button onClick={handleRematch} loading={sending} size="lg" className="w-full sm:w-auto">
              🔄 إعادة المباراة
            </Button>
          )}
          <Button variant="danger" onClick={handleLeave} size="lg" className="w-full sm:w-auto">
            🚪 مغادرة إلى الرئيسية
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-white/20 bg-white/80 p-5 shadow-lg backdrop-blur-sm dark:bg-zinc-900/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xl">{game?.icon}</span>
            <div>
              <h1 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
                {game?.name}
              </h1>
              <p className="text-xs font-bold text-zinc-500">
                رمز الغرفة: <strong className="text-orange-600 dark:text-orange-400 text-sm tracking-wider">{roomId}</strong> | اللاعبون: {playerCount}/{currentRoom.metadata.maxPlayers}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={copyRoomLink}
            className="flex items-center gap-1.5 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-xs font-bold text-orange-700 transition-all hover:bg-orange-100 active:scale-95 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300"
          >
            <span>{copied ? "✅ تم النسخ!" : "📋 نسخ الرابط"}</span>
          </button>

          <Button variant="danger" size="sm" onClick={handleLeave}>
            🚪 مغادرة
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          {/* Players */}
          <PlayerList
            players={currentRoom.players}
            hostUid={currentRoom.metadata.host}
            currentUid={user.uid}
            onKick={isHost ? kickPlayer : undefined}
            onAddBot={isHost && playerCount < currentRoom.metadata.maxPlayers ? addBot : undefined}
            onRemoveBot={isHost ? removeBot : undefined}
          />

          {/* Host Controls */}
          {isHost && (
            <div className="flex flex-col gap-4 overflow-hidden rounded-3xl border border-white/20 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:bg-zinc-900/80">
              <h3 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">⚙️ خيارات المضيف</h3>

              <GameSelector
                currentGame={currentRoom.metadata.game}
                onChange={changeGame}
                disabled={!isHost}
              />

              <Button
                onClick={handleStart}
                loading={sending}
                disabled={playerCount < 1}
                className="w-full shadow-xl shadow-orange-500/25"
                size="lg"
              >
                🚀 بدء اللعبة الآن ({playerCount} لاعب)
              </Button>
            </div>
          )}
        </div>

        {/* Live Chat */}
        <ChatBox roomId={roomId || ""} currentUid={user.uid} />
      </div>
    </div>
  );
}
