"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { sound } from "@/lib/sound";

const navItems = [
  { href: "/",        label: "اللوبي والألعاب",        icon: "🏠" },
  { href: "/profile", label: "ملفي الشخصي",             icon: "👤" },
];

export function Sidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  const handleNav = () => {
    sound.playClick();
    onClose?.();
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-72 flex-col border-l border-[var(--border-base)] bg-[var(--bg-elevated)] shadow-float transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Profile Section */}
        <div className="flex items-center gap-3.5 p-5 border-b border-[var(--border-base)]">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl gradient-brand text-3xl shadow-brand">
            {profile?.photoURL || "👤"}
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 ring-2 ring-[var(--bg-elevated)] text-[10px]">
              ✓
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold text-[var(--text-primary)]">
              {profile?.displayName || "اللاعب"}
            </p>
            <p className="mt-0.5 text-xs font-bold text-orange-500">
              🏆 {profile?.totalScore || 0} نقطة
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNav}
                className={`flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-200 ${
                  isActive
                    ? "gradient-brand text-white shadow-brand"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Controls */}
        <div className="space-y-2 border-t border-[var(--border-base)] p-4">
          {/* Theme Toggle */}
          <button
            onClick={() => { sound.playClick(); toggleTheme(); }}
            className="flex w-full items-center justify-between rounded-xl border border-[var(--border-base)] bg-[var(--bg-card)] px-4 py-2.5 text-sm font-bold text-[var(--text-secondary)] transition-all hover:border-orange-400/40 hover:text-[var(--text-primary)]"
          >
            <span>المظهر</span>
            <span className="flex items-center gap-1.5 rounded-lg bg-[var(--bg-elevated)] px-2 py-1 text-xs">
              {resolvedTheme === "dark" ? "🌙 ليلي" : "☀️ نهاري"}
            </span>
          </button>

          {/* Sign Out */}
          <button
            onClick={() => { sound.playClick(); signOut(); }}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold text-[var(--text-muted)] transition-all hover:bg-red-500/10 hover:text-red-400"
          >
            <span className="text-lg">🚪</span>
            تسجيل الخروج
          </button>
        </div>
      </aside>
    </>
  );
}
