"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { sound } from "@/lib/sound";

export function Header() {
  const { user, profile, signOut } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  const handleToggleTheme = () => {
    sound.playClick();
    toggleTheme();
  };

  return (
    <header className="glass sticky top-0 z-50 flex h-16 items-center justify-between border-b border-[var(--border-base)] px-4 lg:px-8">
      {/* Logo */}
      <Link href="/" className="group flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand text-lg shadow-brand transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
          💡
        </span>
        <span className="text-xl font-black tracking-tight text-gradient">
          فكرة
        </span>
      </Link>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle — animated pill */}
        <button
          onClick={handleToggleTheme}
          title={resolvedTheme === "dark" ? "الوضع النهاري ☀️" : "الوضع الليلي 🌙"}
          aria-label="تبديل الوضع"
          className="relative flex h-8 w-[60px] cursor-pointer items-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-0.5 shadow-inner focus-visible:outline-none"
        >
          {/* Track label hints */}
          <span className="absolute right-1.5 text-[9px] opacity-40 select-none">
            {resolvedTheme === "dark" ? "☀️" : "🌙"}
          </span>
          {/* Thumb */}
          <span
            className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs shadow-md transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
              resolvedTheme === "dark"
                ? "translate-x-0 gradient-brand text-white"
                : "translate-x-[28px] bg-amber-400 text-amber-900"
            }`}
          >
            {resolvedTheme === "dark" ? "🌙" : "☀️"}
          </span>
        </button>

        {/* User Controls */}
        {user ? (
          <div className="flex items-center gap-1.5">
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-xl border border-[var(--border-base)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] shadow-card transition-all duration-200 hover:border-orange-400/50 hover:shadow-brand/20"
            >
              <span className="text-base leading-none">{profile?.photoURL || "👤"}</span>
              <span className="hidden sm:inline max-w-[100px] truncate">
                {profile?.displayName || "اللاعب"}
              </span>
            </Link>

            <button
              onClick={() => signOut()}
              className="hidden sm:flex h-9 items-center rounded-xl px-3 text-xs font-bold text-[var(--text-muted)] transition-all hover:bg-red-500/10 hover:text-red-400 active:scale-95"
            >
              خروج
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-secondary)] transition-all hover:text-[var(--text-primary)]"
            >
              دخول
            </Link>
            <Link
              href="/register"
              className="gradient-brand rounded-xl px-4 py-2 text-xs font-extrabold text-white shadow-brand transition-all duration-300 hover:brightness-110 active:scale-95"
            >
              ابدأ الآن
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
