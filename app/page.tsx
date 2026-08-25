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
      <main className="flex flex-1 flex-col items-center justify-center gap-12 px-4 py-20">
        <div className="text-center animate-slide-up">
          <h1 className="mb-4 text-5xl font-extrabold md:text-7xl">
            <span className="text-gradient">🎮 لعبة مع Friends</span>
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 md:text-xl">
            العب ألعاباً جماعية ممتعة مع أصدقائك أونلاين
          </p>
        </div>

        <div className="grid max-w-3xl grid-cols-2 gap-5 md:grid-cols-4 animate-slide-up">
          {[
            { icon: "🌿", name: "إنسان نبات حيوان", color: "from-emerald-400 to-teal-500" },
            { icon: "🌍", name: "خمن الدولة", color: "from-blue-400 to-indigo-500" },
            { icon: "🎨", name: "الرسم", color: "from-amber-400 to-orange-500" },
            { icon: "🧠", name: "مسابقات", color: "from-purple-400 to-pink-500" },
          ].map((game, i) => (
            <div
              key={game.name}
              className="group relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-white/20 bg-white/80 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:bg-zinc-900/80"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 transition-opacity duration-300 group-hover:opacity-10`} />
              <span className="relative text-4xl transition-transform duration-300 group-hover:scale-110">{game.icon}</span>
              <span className="relative text-sm font-bold text-zinc-700 dark:text-zinc-300">
                {game.name}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-4 animate-slide-up">
          <Link
            href="/register"
            className="gradient-primary rounded-2xl px-10 py-4 text-lg font-bold text-white shadow-xl shadow-emerald-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-emerald-500/30 hover:brightness-110 active:scale-[0.98]"
          >
            ابدأ اللعب الآن
          </Link>
          <Link
            href="/login"
            className="rounded-2xl border-2 border-zinc-200 bg-white/80 px-10 py-4 text-lg font-bold text-zinc-700 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:border-emerald-600 active:scale-[0.98]"
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
  const [filterGame, setFilterGame] = useState<GameId | "all">("all");
  const [joinId, setJoinId] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="p-4 lg:p-8">
      <div className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
          مرحباً <span className="text-gradient">{profile?.displayName || "اللاعب"}</span>
        </h1>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">اختر لعبة وابدأ اللعب مع أصدقائك</p>
      </div>

      <div className="mb-8 animate-slide-up">
        <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/80 p-6 shadow-lg backdrop-blur-sm dark:bg-zinc-900/80">
          <h2 className="mb-4 text-lg font-bold text-zinc-800 dark:text-zinc-200">
            ✨ إنشاء غرفة جديدة
          </h2>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                اختر اللعبة
              </label>
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value as GameId)}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100"
              >
                {Object.values(GAMES).map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.icon} {game.name}
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={handleCreate} loading={sending} size="lg">
              إنشاء غرفة
            </Button>
          </div>
        </div>
      </div>

      <div className="animate-slide-up">
        <h2 className="mb-4 text-lg font-bold text-zinc-800 dark:text-zinc-200">
          🚪 غرف متاحة
        </h2>

        <div className="mb-5 flex flex-wrap gap-2">
          <button
            onClick={() => setFilterGame("all")}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200 ${
              filterGame === "all"
                ? "gradient-primary text-white shadow-lg shadow-emerald-500/25"
                : "bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 dark:hover:bg-zinc-700"
            }`}
          >
            الكل
          </button>
          {Object.values(GAMES).map((game) => (
            <button
              key={game.id}
              onClick={() => setFilterGame(game.id as GameId)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200 ${
                filterGame === game.id
                  ? "gradient-primary text-white shadow-lg shadow-emerald-500/25"
                  : "bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 dark:hover:bg-zinc-700"
              }`}
            >
              {game.icon} {game.name}
            </button>
          ))}
        </div>

        <div className="mb-5 flex items-center gap-3">
          <input
            value={joinId}
            onChange={(e) => setJoinId(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && joinId.trim() && handleJoin(joinId.trim())}
            placeholder="أدخل رقم الغرفة..."
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100"
            dir="ltr"
          />
          <Button
            size="md"
            onClick={() => joinId.trim() && handleJoin(joinId.trim())}
            disabled={!joinId.trim()}
            loading={sending}
          >
            انضمام بالرقم
          </Button>
        </div>

        {availableRooms.filter((r) => filterGame === "all" || r.metadata.game === filterGame).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
            <span className="text-4xl">🎮</span>
            <p className="mt-2 text-sm font-medium text-zinc-500">
              لا توجد غرف متاحة حالياً. أنشئ غرفة جديدة!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableRooms
              .filter((r) => filterGame === "all" || r.metadata.game === filterGame)
              .map((room) => (
              <div
                key={room.id}
                className="group overflow-hidden rounded-2xl border border-white/20 bg-white/80 p-5 shadow-md backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:bg-zinc-900/80"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {GAMES[room.metadata.game]?.icon}{" "}
                      {GAMES[room.metadata.game]?.name}
                    </p>
                    <p className="mt-1 text-xs font-medium text-zinc-500">
                      {room.id} | {Object.keys(room.players).length}/{room.metadata.maxPlayers}{" "}
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-screen flex-row-reverse bg-gradient-to-br from-zinc-50 via-white to-emerald-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-emerald-950/20">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-auto">
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed bottom-6 left-6 z-30 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary text-white shadow-xl shadow-emerald-500/30 transition-all hover:shadow-2xl hover:brightness-110 active:scale-95 lg:hidden"
          >
            ☰
          </button>
          <DashboardPage />
        </main>
      </div>
    );
  }

  return <LandingPage />;
}
