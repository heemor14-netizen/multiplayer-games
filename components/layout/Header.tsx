"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="glass dark:glass-dark sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/20 px-4 lg:px-6">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="text-2xl">💡</span>
        <span className="text-lg font-extrabold text-gradient">
          فكرة
        </span>
      </Link>

      <div className="flex items-center gap-1 sm:gap-3">
        {user ? (
          <>
            <Link
              href="/"
              className="rounded-xl px-2 py-2 text-xs font-semibold text-zinc-600 transition-all hover:bg-orange-50 hover:text-orange-700 dark:text-zinc-300 dark:hover:bg-orange-900/20 dark:hover:text-orange-400 sm:px-4 sm:text-sm"
            >
              <span className="hidden sm:inline">لوحة التحكم</span>
              <span className="sm:hidden">🏠</span>
            </Link>
            <button
              onClick={() => signOut()}
              className="rounded-xl px-2 py-2 text-xs font-semibold text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-900/20 sm:px-4 sm:text-sm"
            >
              <span className="hidden sm:inline">خروج</span>
              <span className="sm:hidden">🚪</span>
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="rounded-xl px-2 py-2 text-xs font-semibold text-zinc-600 transition-all hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:px-4 sm:text-sm"
            >
              <span className="hidden sm:inline">تسجيل الدخول</span>
              <span className="sm:hidden">دخول</span>
            </Link>
            <Link
              href="/register"
              className="gradient-primary rounded-xl px-3 py-2 text-xs font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-xl hover:shadow-orange-500/30 hover:brightness-110 active:scale-[0.98] sm:px-5 sm:text-sm"
            >
              <span className="hidden sm:inline">حساب جديد</span>
              <span className="sm:hidden">سجّل</span>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
