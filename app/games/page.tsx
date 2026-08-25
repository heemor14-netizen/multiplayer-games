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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  const GameComponent = GAME_COMPONENTS[gameId];

  if (!GameComponent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <span className="text-6xl">🚧</span>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          اللعبة غير موجودة
        </h1>
        <button
          onClick={() => router.push("/")}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  return <GameComponent roomId={currentRoomId || ""} />;
}
