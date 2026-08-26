"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AVATARS } from "@/lib/avatars";
import { sound } from "@/lib/sound";

export default function ProfilePage() {
  const { profile, updateAvatar, updateName } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  if (!profile) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  const handleSaveName = async () => {
    if (nameInput.trim()) {
      sound.playClick();
      await updateName(nameInput.trim());
      setEditingName(false);
    }
  };

  const handlePickAvatar = async (avatar: string) => {
    sound.playClick();
    await updateAvatar(avatar);
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <h1 className="mb-6 text-2xl font-black text-zinc-900 dark:text-zinc-100 sm:text-3xl">
        الملف الشخصي 👤
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Info Card */}
        <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:bg-zinc-900/80 sm:p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl gradient-primary text-5xl text-white shadow-xl shadow-orange-500/25 animate-scale-in">
              {profile.photoURL || "👤"}
            </div>

            <div>
              {editingName ? (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="الاسم الجديد..."
                    className="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm font-bold text-center dark:border-zinc-700 dark:bg-zinc-800"
                    dir="rtl"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="gradient-primary rounded-xl px-3 py-1.5 text-xs font-bold text-white shadow"
                  >
                    حفظ
                  </button>
                  <button
                    onClick={() => setEditingName(false)}
                    className="rounded-xl bg-zinc-200 px-3 py-1.5 text-xs font-bold dark:bg-zinc-700"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
                    {profile.displayName}
                  </h2>
                  <button
                    onClick={() => {
                      setNameInput(profile.displayName);
                      setEditingName(true);
                    }}
                    title="تعديل الاسم"
                    className="text-sm opacity-60 hover:opacity-100 transition-opacity"
                  >
                    ✏️
                  </button>
                </div>
              )}
              <p className="mt-1 font-mono text-xs text-zinc-400">{profile.uid}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-4 text-center dark:border-orange-900/40 dark:from-orange-950/40 dark:to-amber-950/40">
              <p className="text-2xl font-black text-orange-600 dark:text-orange-400">
                {profile.totalScore}
              </p>
              <p className="mt-1 text-[11px] font-bold text-orange-700/70 dark:text-orange-400/70">
                النقاط الكلية 🏆
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 text-center dark:border-amber-900/40 dark:from-amber-950/40 dark:to-orange-950/40">
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {profile.gamesPlayed}
              </p>
              <p className="mt-1 text-[11px] font-bold text-amber-700/70 dark:text-amber-400/70">
                المباريات المكتملة 🎮
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-zinc-50 p-3 text-center dark:bg-zinc-800/50">
            <p className="text-xs font-bold text-zinc-400">
              عضو منذ: {new Date(profile.createdAt).toLocaleDateString("ar-SA")}
            </p>
          </div>
        </div>

        {/* Avatar Picker Card */}
        <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:bg-zinc-900/80">
          <h3 className="mb-2 text-sm font-extrabold text-zinc-800 dark:text-zinc-200">
            ✨ اختر صورتك الرمزية (الأفاتار)
          </h3>
          <p className="mb-4 text-xs text-zinc-500">اضغط على أي رمز ليصبح صورتك في اللعبة</p>

          <div className="grid grid-cols-5 gap-2.5 sm:gap-3">
            {AVATARS.map((avatar) => {
              const isSelected = profile.photoURL === avatar;
              return (
                <button
                  key={avatar}
                  onClick={() => handlePickAvatar(avatar)}
                  className={`flex h-14 w-full items-center justify-center rounded-2xl text-2xl transition-all duration-200 ${
                    isSelected
                      ? "gradient-primary scale-110 shadow-lg shadow-orange-500/30 ring-2 ring-orange-400"
                      : "border border-zinc-200 bg-white hover:scale-105 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800"
                  }`}
                >
                  {avatar}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
