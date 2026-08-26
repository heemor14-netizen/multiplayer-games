"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRoom } from "@/contexts/RoomContext";
import { ROOM_STATUS, GAMES } from "@/lib/constants";
import { sound } from "@/lib/sound";
import AnimalPlantHuman from "@/games/animal-plant-human/AnimalPlantHuman";
import GuessCountry from "@/games/guess-country/GuessCountry";
import Drawing from "@/games/drawing/Drawing";
import Quiz from "@/games/quiz/Quiz";
import { logger } from "@/lib/logger";

const GAME_COMPONENTS: Record<string, React.ComponentType<{ roomId: string }>> = {
  "animal-plant-human": AnimalPlantHuman,
  "guess-country": GuessCountry,
  drawing: Drawing,
  quiz: Quiz,
};

export default function GamesPage() {
  const { user } = useAuth();
  const { currentRoom, currentRoomId, joinRoom, leaveRoom } = useRoom();
  const router = useRouter();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(3);
  const [isMuted, setIsMuted] = useState(sound.isMuted());

  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (!hash) {
        router.push("/");
        return;
      }

      const parts = hash.split(":");
      if (parts.length === 2) {
        setRoomId(parts[0]);
        setGameId(parts[1]);
      } else {
        setGameId(hash);
      }
    };

    parseHash();
    window.addEventListener("hashchange", parseHash);
    return () => window.removeEventListener("hashchange", parseHash);
  }, [router]);

  useEffect(() => {
    if (!roomId || !user || currentRoomId === roomId) return;

    joinRoom(roomId).catch((err) => {
      logger.error("Games page failed to join room", err);
      router.push("/");
    });
  }, [roomId, user, currentRoomId, joinRoom, router]);

  // Initial countdown animation (3, 2, 1, انطلق!)
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      sound.playTick();
      const timer = setTimeout(() => setCountdown(countdown - 1), 700);
      return () => clearTimeout(timer);
    } else {
      sound.playGameStart();
      const timer = setTimeout(() => setCountdown(null), 500);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // When room status returns to lobby or finished, navigate smoothly
  useEffect(() => {
    if (!currentRoom || !roomId) return;

    if (currentRoom.metadata.status === ROOM_STATUS.LOBBY) {
      router.push(`/rooms/#${roomId}`);
    }
  }, [currentRoom, roomId, router]);

  const handleExit = async () => {
    if (confirm("هل تريد العودة إلى اللوبي؟")) {
      sound.playClick();
      if (roomId) {
        router.push(`/rooms/#${roomId}`);
      } else {
        await leaveRoom();
        router.push("/");
      }
    }
  };

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (!muted) sound.playClick();
  };

  if (!user || !gameId || !currentRoom) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-orange-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-orange-950/20">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="mt-4 text-base font-bold text-zinc-600 dark:text-zinc-400">جاري الاتصال بالغرفة...</p>
        </div>
      </div>
    );
  }

  const currentGameConfig = GAMES[gameId as keyof typeof GAMES];
  const GameComponent = GAME_COMPONENTS[gameId];

  if (!GameComponent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-zinc-50 via-white to-orange-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-orange-950/20 p-4">
        <span className="text-6xl">🚧</span>
        <h1 className="text-2xl font-extrabold text-gradient">اللعبة غير موجودة</h1>
        <button
          onClick={() => router.push("/")}
          className="gradient-primary rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-zinc-50 via-white to-orange-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-orange-950/20 pb-12">
      {/* Game Global Header Bar */}
      <header className="sticky top-0 z-30 border-b border-white/10 glass-dark px-4 py-3 shadow-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{currentGameConfig?.icon || "🎮"}</span>
            <div>
              <h1 className="text-sm font-extrabold text-white sm:text-base">
                {currentGameConfig?.name || "اللعبة"}
              </h1>
              <p className="text-[11px] font-medium text-orange-300">غرفة: {roomId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              title={isMuted ? "تشغيل الصوت" : "كتم الصوت"}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-base text-white hover:bg-white/20 transition-all active:scale-95"
            >
              {isMuted ? "🔇" : "🔊"}
            </button>

            <button
              onClick={handleExit}
              className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-red-500/30 hover:border-red-400 active:scale-95"
            >
              🚪 مغادرة
            </button>
          </div>
        </div>
      </header>

      {/* Countdown Overlay */}
      {countdown !== null && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in">
          <span className="text-8xl sm:text-9xl font-black text-white animate-scale-in">
            {countdown === 0 ? "🚀 انطلق!" : countdown}
          </span>
          <p className="mt-4 text-lg font-bold text-orange-400">استعد للتحدي!</p>
        </div>
      )}

      {/* Game Content */}
      <main className="container mx-auto px-2 pt-2">
        <GameComponent roomId={roomId || ""} />
      </main>
    </div>
  );
}
