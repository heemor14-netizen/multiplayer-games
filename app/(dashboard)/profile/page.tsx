"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function ProfilePage() {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        الملف الشخصي
      </h1>

      <div className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600 text-3xl text-white">
            {profile.photoURL ? (
              <img
                src={profile.photoURL}
                alt=""
                className="h-20 w-20 rounded-full"
              />
            ) : (
              profile.displayName.charAt(0)
            )}
          </div>

          <div className="text-center">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {profile.displayName}
            </h2>
            <p className="text-sm text-zinc-500">{profile.uid}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-emerald-50 p-4 text-center dark:bg-emerald-900/20">
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
              {profile.totalScore}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500">
              النقاط الكلية
            </p>
          </div>
          <div className="rounded-xl bg-blue-50 p-4 text-center dark:bg-blue-900/20">
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {profile.gamesPlayed}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-500">
              الألعاب المكتملة
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800">
          <p className="text-xs text-zinc-500">
            عضو منذ:{" "}
            {new Date(profile.createdAt).toLocaleDateString("ar-SA")}
          </p>
        </div>
      </div>
    </div>
  );
}
