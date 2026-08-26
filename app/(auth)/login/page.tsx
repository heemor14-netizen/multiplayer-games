"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { sound } from "@/lib/sound";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle, signInAsGuest } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    sound.playClick();

    try {
      await signIn(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ في تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      sound.playClick();
      await signInWithGoogle();
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ في تسجيل الدخول بـ Google");
    }
  };

  const handleGuest = async () => {
    try {
      sound.playClick();
      await signInAsGuest();
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ في الدخول كضيف");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-zinc-50 via-white to-orange-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-orange-950/20">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:py-20">
        <div className="w-full max-w-sm animate-scale-in">
          <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/80 p-6 shadow-2xl backdrop-blur-sm dark:bg-zinc-900/80 sm:p-8">
            <div className="mb-6 text-center">
              <span className="text-5xl block animate-bounce">🎮</span>
              <h1 className="mt-2 text-2xl font-black text-zinc-900 dark:text-zinc-100">
                تسجيل الدخول
              </h1>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="البريد الإلكتروني"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
              />
              <Input
                label="كلمة المرور"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
              />
              <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
                تسجيل الدخول
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-300 to-transparent dark:via-zinc-700" />
              <span className="text-xs font-bold text-zinc-400">أو</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-300 to-transparent dark:via-zinc-700" />
            </div>

            <div className="flex flex-col gap-2.5">
              <Button
                variant="secondary"
                onClick={handleGoogle}
                className="w-full"
                size="md"
              >
                الدخول بـ Google 🌐
              </Button>

              <button
                onClick={handleGuest}
                className="w-full rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-xs font-black text-orange-700 hover:bg-orange-100 transition-all active:scale-95 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300"
              >
                🚀 الدخول الفوري كضيف
              </button>
            </div>

            <p className="mt-5 text-center text-sm text-zinc-500">
              ليس لديك حساب؟{" "}
              <Link
                href="/register"
                className="font-bold text-orange-600 transition-colors hover:text-orange-500"
              >
                أنشئ حساباً جديداً
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
