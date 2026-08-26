"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRoom } from "@/contexts/RoomContext";
import { ROOM_STATUS, BASE_PATH } from "@/lib/constants";
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
  const { currentRoom, currentRoomId, joinRoom } = useRoom();
  const router = useRouter();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash) {
      window.location.href = `${BASE_PATH}/`;
      return;
    }

    const parts = hash.split(":");
    if (parts.length === 2) {
      setRoomId(parts[0]);
      setGameId(parts[1]);
    } else {
      setGameId(hash);
    }

    const handleHash = () => {
      const h = window.location.hash.replace("#", "");
      if (!h) return;
      const p = h.split(":");
      if (p.length === 2) {
        setRoomId(p[0]);
        setGameId(p[1]);
      } else {
        setGameId(h);
      }
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  useEffect(() => {
    if (!roomId || !user || currentRoomId) return;

    setJoining(true);
    joinRoom(roomId).catch((err) => {
      logger.error("Games page failed to join room", err);
      window.location.href = `${BASE_PATH}/`;
    }).finally(() => setJoining(false));
  }, [roomId, user, currentRoomId, joinRoom]);

  useEffect(() => {
    if (!currentRoom || !roomId) return;

    if (currentRoom.metadata.status === ROOM_STATUS.PLAYING) {
      return;
    }

    if (currentRoom.metadata.status === ROOM_STATUS.FINISHED) {
      window.location.href = `${BASE_PATH}/rooms/#${roomId}`;
    }
  }, [currentRoom, roomId]);

  if (!user || !gameId || joining || !currentRoom) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-orange-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-orange-950/20">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
          <p className="mt-4 text-sm text-zinc-500">جاري تحميل اللعبة...</p>
        </div>
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
          onClick={() => { window.location.href = `${BASE_PATH}/`; }}
          className="gradient-primary rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-xl hover:brightness-110 active:scale-[0.98]"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  return <GameComponent roomId={roomId || ""} />;
}
