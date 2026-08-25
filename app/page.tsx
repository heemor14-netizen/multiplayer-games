"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useRoom } from "@/contexts/RoomContext";
import { GAMES, BASE_PATH, type GameId } from "@/lib/constants";

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-20">
        <div className="text-center">
          <h1 className="mb-4 text-5xl font-bold text-zinc-900 dark:text-zinc-100">
            🎮 لعبة مع Friends
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            العب ألعاباً جماعية ممتعة مع أصدقائك أونلاين
          </p>
        </div>

        <div className="grid max-w-2xl grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { icon: "🌿", name: "إنسان نبات حيوان" },
            { icon: "🌍", name: "خمن الدولة" },
            { icon: "🎨", name: "الرسم" },
            { icon: "🧠", name: "مسابقات" },
          ].map((game) => (
            <div
              key={game.name}
              className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="text-3xl">{game.icon}</span>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {game.name}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <Link
            href="/register"
            className="rounded-xl bg-emerald-600 px-8 py-3 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            ابدأ اللعب الآن
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-zinc-300 px-8 py-3 text-lg font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            لدي حساب
          </Link>
        </div>
      </main>
    </div>
  );
}

function DashboardPage() {
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

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-screen flex-row-reverse">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <DashboardPage />
        </main>
      </div>
    );
  }

  return <LandingPage />;
}
