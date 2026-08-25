"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { href: "/", label: "الرئيسية", icon: "🏠" },
  { href: "/rooms", label: "الغرف", icon: "🚪" },
  { href: "/profile", label: "الملف الشخصي", icon: "👤" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  return (
    <aside className="flex w-64 flex-col border-l border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-lg text-white">
          {profile?.photoURL ? (
            <img
              src={profile.photoURL}
              alt=""
              className="h-10 w-10 rounded-full"
            />
          ) : (
            profile?.displayName?.charAt(0) || "?"
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {profile?.displayName || "Loading..."}
          </p>
          <p className="truncate text-xs text-zinc-500">
            {profile?.totalScore || 0} نقطة
          </p>
        </div>
      </div>

      <nav className="flex-1 p-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors
                ${
                  isActive
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          <span>🚪</span>
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}
