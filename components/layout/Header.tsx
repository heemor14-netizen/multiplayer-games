"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="glass dark:glass-dark sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/20 px-4 lg:px-6">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="text-2xl">🎮</span>
        <span className="text-lg font-extrabold text-gradient">
          لعبة مع Friends
        </span>
      </Link>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <Link
              href="/"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-zinc-600 transition-all hover:bg-emerald-50 hover:text-emerald-700 dark:text-zinc-300 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400"
            >
              لوحة التحكم
            </Link>
            <button
              onClick={() => signOut()}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              خروج
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-zinc-600 transition-all hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              تسجيل الدخول
            </Link>
            <Link
              href="/register"
              className="gradient-primary rounded-xl px-5 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:brightness-110 active:scale-[0.98]"
            >
              حساب جديد
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
