"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { BASE_PATH } from "@/lib/constants";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signUp(email, password, name);
      window.location.href = `${BASE_PATH}/`;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "خطأ في إنشاء الحساب"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
      window.location.href = `${BASE_PATH}/`;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "خطأ في تسجيل الدخول بـ Google"
      );
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-zinc-50 via-white to-orange-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-orange-950/20">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:py-20">
        <div className="w-full max-w-sm animate-scale-in">
          <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/80 p-6 shadow-2xl backdrop-blur-sm dark:bg-zinc-900/80 sm:p-8">
            <div className="mb-6 text-center">
              <span className="text-4xl">🎮</span>
              <h1 className="mt-2 text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                إنشاء حساب جديد
              </h1>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="الاسم"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
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
                minLength={6}
                dir="ltr"
              />
              <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
                إنشاء الحساب
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-300 to-transparent dark:via-zinc-700" />
              <span className="text-xs font-bold text-zinc-400">أو</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-300 to-transparent dark:via-zinc-700" />
            </div>

            <Button
              variant="secondary"
              onClick={handleGoogle}
              className="w-full"
              size="lg"
            >
              التسجيل بـ Google
            </Button>

            <p className="mt-5 text-center text-sm text-zinc-500">
              لديك حساب بالفعل؟{" "}
              <Link
                href="/login"
                className="font-bold text-orange-600 transition-colors hover:text-orange-500"
              >
                سجّل الدخول
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
