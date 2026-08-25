"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { href: "/", label: "الرئيسية", icon: "🏠" },
  { href: "/rooms", label: "الغرف", icon: "🚪" },
  { href: "/profile", label: "الملف الشخصي", icon: "👤" },
];

export function Sidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-72 flex-col border-l border-white/10 glass-dark transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-white/10 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary text-lg font-bold text-white shadow-lg shadow-orange-500/25">
            {profile?.photoURL ? (
              <img
                src={profile.photoURL}
                alt=""
                className="h-12 w-12 rounded-2xl"
              />
            ) : (
              profile?.displayName?.charAt(0) || "?"
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">
              {profile?.displayName || "Loading..."}
            </p>
            <p className="truncate text-xs font-medium text-orange-400">
              {profile?.totalScore || 0} نقطة
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? "gradient-primary text-white shadow-lg shadow-orange-500/25"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition-all hover:bg-red-500/10 hover:text-red-300"
          >
            <span className="text-lg">🚪</span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}
