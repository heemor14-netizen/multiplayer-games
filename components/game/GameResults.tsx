"use client";

import { Button } from "@/components/ui/Button";

interface ScoreEntry {
  uid: string;
  name: string;
  score: number;
}

export function GameResults({
  scores,
  onEndGame,
}: {
  scores: ScoreEntry[];
  onEndGame: () => void;
}) {
  const sorted = scores.sort((a, b) => b.score - a.score);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <span className="text-6xl">🏆</span>
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
        النتائج النهائية
      </h1>

      <div className="w-full max-w-md">
        {sorted.map((entry, idx) => (
          <div
            key={entry.uid}
            className={`flex items-center justify-between rounded-lg p-3 ${
              idx === 0
                ? "bg-yellow-100 dark:bg-yellow-900/20"
                : "bg-zinc-50 dark:bg-zinc-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-zinc-500">
                #{idx + 1}
              </span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {entry.name}
              </span>
            </div>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {entry.score} نقطة
            </span>
          </div>
        ))}
      </div>

      <Button onClick={onEndGame}>إنهاء اللعبة</Button>
    </div>
  );
}
