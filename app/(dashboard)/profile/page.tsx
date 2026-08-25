"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function ProfilePage() {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8">
      <h1 className="mb-6 text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
        الملف الشخصي
      </h1>

      <div className="mx-auto max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white/80 p-8 shadow-2xl backdrop-blur-sm dark:bg-zinc-900/80">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl gradient-primary text-4xl font-bold text-white shadow-xl shadow-orange-500/25">
            {profile.photoURL ? (
              <img
                src={profile.photoURL}
                alt=""
                className="h-24 w-24 rounded-3xl"
              />
            ) : (
              profile.displayName.charAt(0)
            )}
          </div>

          <div className="text-center">
            <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
              {profile.displayName}
            </h2>
            <p className="mt-1 text-xs font-medium text-zinc-400">{profile.uid}</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-5 text-center dark:border-orange-800 dark:from-orange-900/20 dark:to-amber-900/20">
            <p className="text-3xl font-extrabold text-orange-600 dark:text-orange-400">
              {profile.totalScore}
            </p>
            <p className="mt-1 text-xs font-bold text-orange-600/70 dark:text-orange-400/70">
              النقاط الكلية
            </p>
          </div>
            <div className="overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 text-center dark:border-amber-800 dark:from-amber-900/20 dark:to-orange-900/20">
            <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {profile.gamesPlayed}
            </p>
            <p className="mt-1 text-xs font-bold text-amber-600/70 dark:text-amber-400/70">
              الألعاب المكتملة
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-zinc-50 p-4 text-center dark:bg-zinc-800/50">
          <p className="text-xs font-medium text-zinc-500">
            عضو منذ:{" "}
            {new Date(profile.createdAt).toLocaleDateString("ar-SA")}
          </p>
        </div>
      </div>
    </div>
  );
}
