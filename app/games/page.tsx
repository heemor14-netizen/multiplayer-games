"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRoom } from "@/contexts/RoomContext";
import { ROOM_STATUS } from "@/lib/constants";
import AnimalPlantHuman from "@/games/animal-plant-human/AnimalPlantHuman";
import GuessCountry from "@/games/guess-country/GuessCountry";
import Drawing from "@/games/drawing/Drawing";
import Quiz from "@/games/quiz/Quiz";

const GAME_COMPONENTS: Record<string, React.ComponentType<{ roomId: string }>> = {
  "animal-plant-human": AnimalPlantHuman,
  "guess-country": GuessCountry,
  drawing: Drawing,
  quiz: Quiz,
};

export default function GamesPage() {
  const { user } = useAuth();
  const { currentRoom, currentRoomId } = useRoom();
  const router = useRouter();
  const [gameId, setGameId] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) setGameId(hash);

    const handleHash = () => {
      const h = window.location.hash.replace("#", "");
      if (h) setGameId(h);
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  useEffect(() => {
    if (!currentRoom) {
      router.push("/");
      return;
    }

    if (currentRoom.metadata.status !== ROOM_STATUS.PLAYING) {
      router.push(`/rooms/#${currentRoomId || ""}`);
    }
  }, [currentRoom, currentRoomId, router]);

  if (!currentRoom || !user || !gameId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-orange-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-orange-950/20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
      </div>
    );
  }

  const GameComponent = GAME_COMPONENTS[gameId];

  if (!GameComponent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-zinc-50 via-white to-orange-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-orange-950/20">
        <span className="text-6xl">🚧</span>
        <h1 className="text-2xl font-extrabold text-gradient">
          اللعبة غير موجودة
        </h1>
        <button
          onClick={() => router.push("/")}
          className="gradient-primary rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98]"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  return <GameComponent roomId={currentRoomId || ""} />;
}
