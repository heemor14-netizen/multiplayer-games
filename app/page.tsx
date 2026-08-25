import Link from "next/link";
import { Header } from "@/components/layout/Header";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-20">
        <div className="text-center">
          <h1 className="mb-4 text-5xl font-bold text-zinc-900 dark:text-zinc-100">
            🎮 لعبة مع Friends
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            العب ألعاباً جماعية ممتعة مع أصدقائك أونلاين
          </p>
        </div>

        <div className="grid max-w-2xl grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { icon: "🌿", name: "إنسان نبات حيوان" },
            { icon: "🌍", name: "خمن الدولة" },
            { icon: "🎨", name: "الرسم" },
            { icon: "🧠", name: "مسابقات" },
          ].map((game) => (
            <div
              key={game.name}
              className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <span className="text-3xl">{game.icon}</span>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {game.name}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <Link
            href="/register"
            className="rounded-xl bg-emerald-600 px-8 py-3 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            ابدأ اللعب الآن
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-zinc-300 px-8 py-3 text-lg font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            لدي حساب
          </Link>
        </div>
      </main>
    </div>
  );
}
