"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useRoom } from "@/contexts/RoomContext";
import { GAMES, type GameId } from "@/lib/constants";
import { sound } from "@/lib/sound";

/* ── Landing for unauthenticated visitors ── */
function LandingPage() {
  const { signInAsGuest } = useAuth();

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: "var(--bg-base)" }}
    >
      <Header />
      <main className="relative flex flex-1 flex-col items-center justify-center gap-10 overflow-hidden px-4 py-16 text-center">
        {/* Background orbs */}
        <div
          className="pointer-events-none absolute -top-40 right-1/4 h-[500px] w-[500px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, var(--brand-mid) 0%, transparent 70%)", filter: "blur(80px)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-40 left-1/4 h-[400px] w-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, var(--accent-from) 0%, transparent 70%)", filter: "blur(80px)" }}
        />

        {/* Hero */}
        <div className="relative z-10 animate-slide-up">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 py-1.5 text-xs font-extrabold text-[var(--text-secondary)] shadow-card">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            منصة الألعاب الجماعية العربية الأولى
          </div>
          <h1 className="mt-4 text-5xl font-black leading-tight tracking-tight sm:text-7xl">
            العب مع{" "}
            <span className="text-gradient">أصدقائك</span>
            <br />
            في أي مكان
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base font-medium text-[var(--text-secondary)] sm:text-lg">
            تحدَّ أصدقاءك في إنسان نبات، خمن الدولة، مسابقات، والرسم — بدون تسجيل!
          </p>
        </div>

        {/* Game showcase */}
        <div className="relative z-10 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4 animate-slide-up">
          {Object.values(GAMES).map((game, i) => (
            <div
              key={game.id}
              className="group flex flex-col items-center gap-2.5 rounded-3xl border border-[var(--border-base)] bg-[var(--bg-elevated)] p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-orange-400/30 hover:shadow-brand/30"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="text-4xl transition-transform duration-300 group-hover:scale-125">
                {game.icon}
              </span>
              <span className="text-xs font-extrabold text-[var(--text-primary)]">{game.name}</span>
              <span className="text-[10px] font-bold text-[var(--text-muted)]">{game.badge}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="relative z-10 flex w-full max-w-sm flex-col gap-3 animate-slide-up sm:flex-row">
          <button
            onClick={() => { sound.playClick(); signInAsGuest(); }}
            className="gradient-brand flex-1 rounded-2xl px-8 py-4 text-base font-black text-white shadow-brand transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.97]"
          >
            🚀 العب فوراً كضيف
          </button>
          <Link
            href="/login"
            className="flex flex-1 items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-8 py-4 text-base font-bold text-[var(--text-primary)] shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-400/30 active:scale-[0.97]"
          >
            تسجيل الدخول
          </Link>
        </div>
      </main>
    </div>
  );
}

/* ── Dashboard for logged-in users ── */
function DashboardPage() {
  const { profile } = useAuth();
  const { createRoom, availableRooms, joinRoom, addBot, sending } = useRoom();
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState<GameId>("animal-plant-human");
  const [selectedMaxPlayers, setSelectedMaxPlayers] = useState(4);
  const [filterGame, setFilterGame] = useState<GameId | "all">("all");
  const [joinId, setJoinId] = useState("");

  const handleCreate = async () => {
    try {
      sound.playClick();
      const roomId = await createRoom(selectedGame, selectedMaxPlayers);
      router.push(`/rooms/#${roomId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "خطأ في إنشاء الغرفة");
    }
  };

  const handleQuickPlay = async (gameId: GameId) => {
    try {
      sound.playClick();
      const roomId = await createRoom(gameId, 4);
      await addBot();
      await addBot();
      router.push(`/rooms/#${roomId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "خطأ في بدء اللعب السريع");
    }
  };

  const handleJoin = async (roomId: string) => {
    try {
      sound.playClick();
      await joinRoom(roomId);
      router.push(`/rooms/#${roomId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "خطأ في الانضمام");
    }
  };

  const filteredRooms = availableRooms.filter(
    (r) => filterGame === "all" || r.metadata.game === filterGame
  );

  return (
    <div className="mx-auto max-w-6xl p-4 pb-24 lg:p-8">
      {/* Welcome */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-slide-up">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] sm:text-3xl">
            أهلاً،{" "}
            <span className="text-gradient">{profile?.displayName || "اللاعب"}</span>
            {" "}{profile?.photoURL || "👋"}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">اختر لعبة واستمتع مع أصدقائك</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-[var(--border-base)] bg-[var(--bg-elevated)] px-4 py-2.5 shadow-card self-start">
          <span className="text-lg">🏆</span>
          <div>
            <p className="text-xs font-bold text-[var(--text-muted)]">رصيدك</p>
            <p className="text-sm font-black text-orange-500">{profile?.totalScore || 0} نقطة</p>
          </div>
        </div>
      </div>

      {/* ── Quick Play Strip ── */}
      <section className="mb-8 animate-slide-up">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-[var(--text-primary)]">
          <span className="text-base">⚡</span> لعب سريع مع البوتات
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.values(GAMES).map((g) => (
            <button
              key={g.id}
              onClick={() => handleQuickPlay(g.id as GameId)}
              className="group relative flex flex-col items-center gap-2 overflow-hidden rounded-3xl border border-[var(--border-base)] bg-[var(--bg-elevated)] p-4 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-orange-400/30 hover:shadow-brand/20 active:scale-[0.97]"
            >
              <span className="text-4xl transition-transform duration-300 group-hover:scale-125">
                {g.icon}
              </span>
              <span className="text-xs font-extrabold text-[var(--text-primary)]">{g.name}</span>
              <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-extrabold text-orange-500">
                العب الآن 🤖
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Create Room ── */}
      <section className="mb-8 animate-slide-up">
        <div className="rounded-3xl border border-[var(--border-base)] bg-[var(--bg-elevated)] p-5 shadow-card sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-[var(--text-primary)]">
            <span>✨</span> إنشاء غرفة مخصصة
          </h2>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            {/* Game select */}
            <div className="flex min-w-[200px] flex-col gap-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)]">
                اللعبة
              </label>
              <div className="relative">
                <select
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value as GameId)}
                  className="w-full appearance-none rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-card)] px-4 py-3 pr-10 text-sm font-bold text-[var(--text-primary)] focus:border-orange-500/60 focus:outline-none focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)]"
                >
                  {Object.values(GAMES).map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.icon} {game.name}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  ▾
                </span>
              </div>
            </div>

            {/* Max players */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)]">
                عدد اللاعبين
              </label>
              <div className="flex gap-1">
                {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <button
                    key={n}
                    onClick={() => setSelectedMaxPlayers(n)}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-extrabold transition-all active:scale-95 ${
                      selectedMaxPlayers === n
                        ? "gradient-brand text-white shadow-brand"
                        : "border border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-orange-400/40"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleCreate} loading={sending} size="lg" className="w-full sm:w-auto">
              🎮 إنشاء الغرفة
            </Button>
          </div>
        </div>
      </section>

      {/* ── Available Rooms ── */}
      <section className="animate-slide-up">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-[var(--text-primary)]">
          <span>🚪</span> الغرف المتاحة
        </h2>

        {/* Filters + Join by Code */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {(["all", ...Object.keys(GAMES)] as (GameId | "all")[]).map((id) => {
              const isAll = id === "all";
              const g = isAll ? null : GAMES[id as GameId];
              return (
                <button
                  key={id}
                  onClick={() => setFilterGame(id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-extrabold transition-all ${
                    filterGame === id
                      ? "gradient-brand text-white shadow-brand"
                      : "border border-[var(--border-base)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-orange-400/30"
                  }`}
                >
                  {isAll ? "الكل" : `${g?.icon} ${g?.name}`}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <input
              value={joinId}
              onChange={(e) => setJoinId(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && joinId.trim() && handleJoin(joinId.trim())}
              placeholder="رمز الغرفة..."
              className="w-36 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-card)] px-3 py-2 text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] focus:border-orange-500/60 focus:outline-none"
              dir="ltr"
            />
            <Button
              size="sm"
              onClick={() => joinId.trim() && handleJoin(joinId.trim())}
              disabled={!joinId.trim()}
              loading={sending}
            >
              دخول
            </Button>
          </div>
        </div>

        {/* Room Cards */}
        {filteredRooms.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-[var(--border-strong)] bg-[var(--bg-card)] p-12 text-center">
            <span className="text-5xl">🎮</span>
            <p className="mt-3 text-sm font-extrabold text-[var(--text-primary)]">لا توجد غرف متاحة</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              أنشئ غرفة جديدة أو العب فوراً ضد البوتات
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map((room) => {
              const gameInfo = GAMES[room.metadata.game];
              const count = Object.keys(room.players || {}).length;
              return (
                <div
                  key={room.id}
                  className="flex items-center justify-between gap-3 rounded-3xl border border-[var(--border-base)] bg-[var(--bg-elevated)] p-4 shadow-card transition-all hover:border-orange-400/30 hover:shadow-card-hover"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{gameInfo?.icon || "🎮"}</span>
                    <div>
                      <p className="text-sm font-extrabold text-[var(--text-primary)]">{gameInfo?.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        <span className="font-mono font-bold text-orange-500">{room.id}</span>
                        {" "}&bull; {count}/{room.metadata.maxPlayers} لاعب
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => handleJoin(room.id)} loading={sending}>
                    انضمام
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/* ── Root ── */
export default function Home() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--bg-base)" }}
      >
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return (
      <div
        className="flex min-h-screen flex-row-reverse"
        style={{ background: "gradient-mesh" }}
      >
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-1 flex-col overflow-auto" style={{ background: "var(--bg-base)" }}>
          <Header />
          <main className="flex-1">
            <DashboardPage />
          </main>
        </div>
        {/* Mobile sidebar open button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed bottom-6 left-6 z-30 flex h-14 w-14 items-center justify-center rounded-2xl gradient-brand text-white shadow-brand transition-all hover:brightness-110 active:scale-95 lg:hidden text-xl"
        >
          ☰
        </button>
      </div>
    );
  }

  return <LandingPage />;
}
