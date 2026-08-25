"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useRoom } from "@/contexts/RoomContext";
import { Button } from "@/components/ui/Button";
import { GAMES, BASE_PATH, type GameId } from "@/lib/constants";

export default function DashboardPage() {
  const { profile } = useAuth();
  const { createRoom, availableRooms, joinRoom, sending } = useRoom();
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState<GameId>("animal-plant-human");

  const handleCreate = async () => {
    try {
      const roomId = await createRoom(selectedGame);
      window.location.href = `${BASE_PATH}/rooms/#${roomId}`;
    } catch (err) {
      alert(err instanceof Error ? err.message : "خطأ في إنشاء الغرفة");
    }
  };

  const handleJoin = async (roomId: string) => {
    try {
      await joinRoom(roomId);
      window.location.href = `${BASE_PATH}/rooms/#${roomId}`;
    } catch (err) {
      alert(err instanceof Error ? err.message : "خطأ في الانضمام");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          مرحباً {profile?.displayName || "اللاعب"}
        </h1>
        <p className="text-zinc-500">اختر لعبة وابدأ اللعب مع أصدقائك</p>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
          إنشاء غرفة جديدة
        </h2>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              اختر اللعبة
            </label>
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value as GameId)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {Object.values(GAMES).map((game) => (
                <option key={game.id} value={game.id}>
                  {game.icon} {game.name}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={handleCreate} loading={sending}>
            إنشاء غرفة
          </Button>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
          غرف متاحة
        </h2>
        {availableRooms.length === 0 ? (
          <p className="text-sm text-zinc-500">
            لا توجد غرف متاحة حالياً. أنشئ غرفة جديدة!
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {availableRooms.map((room) => (
              <div
                key={room.id}
                className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {GAMES[room.metadata.game]?.icon}{" "}
                    {GAMES[room.metadata.game]?.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {Object.keys(room.players).length}/{room.metadata.maxPlayers}{" "}
                    لاعب
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleJoin(room.id)}
                  loading={sending}
                >
                  انضمام
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
