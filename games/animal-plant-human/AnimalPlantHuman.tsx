"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ref,
  set,
  get,
  update,
  onValue,
  off,
} from "firebase/database";
import { getFirebaseRTDB } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { LETTERS, CATEGORIES, type Category } from "./index";
import { logger } from "@/lib/logger";

const ROUND_TIME = 30;
const TOTAL_ROUNDS = 3;

interface GameData {
  round: number;
  totalRounds: number;
  currentLetter: string;
  timeLeft: number;
  status: "waiting" | "answering" | "revealing" | "finished";
  answers: Record<string, Record<Category, string>>;
  scores: Record<string, Record<Category, number>>;
  players: Record<string, { name: string }>;
}

export default function AnimalPlantHuman({ roomId }: { roomId: string }) {
  const { user } = useAuth();
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [answers, setAnswers] = useState<Record<Category, string>>({
    إنسان: "",
    نبات: "",
    حيوان: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const calculateScores = useCallback(async (currentGameData: GameData) => {
    const allAnswers: Record<string, Record<Category, string>> = {};

    const answersSnap = await get(ref(getFirebaseRTDB(), `rooms/${roomId}/gameState/answers`));
    const answersData = answersSnap.val();
    if (answersData) {
      Object.assign(allAnswers, answersData);
    }

    const newScores: Record<string, Record<Category, number>> = {};

    for (const uid of Object.keys(currentGameData.players)) {
      newScores[uid] = { إنسان: 0, نبات: 0, حيوان: 0 };
    }

    for (const category of CATEGORIES) {
      const categoryAnswers: Record<string, string> = {};
      for (const [uid, ans] of Object.entries(allAnswers)) {
        if (ans[category]) {
          categoryAnswers[uid] = ans[category];
        }
      }

      const answerCounts: Record<string, number> = {};
      for (const answer of Object.values(categoryAnswers)) {
        answerCounts[answer] = (answerCounts[answer] || 0) + 1;
      }

      for (const [uid, answer] of Object.entries(categoryAnswers)) {
        if (answerCounts[answer] === 1) {
          newScores[uid][category] = 10;
        } else {
          newScores[uid][category] = 5;
        }
      }
    }

    await update(ref(getFirebaseRTDB(), `rooms/${roomId}/gameState`), { scores: newScores });
  }, [roomId]);

  const nextRound = useCallback(async (currentGameData: GameData) => {
    const nextRoundNum = currentGameData.round + 1;

    if (nextRoundNum > currentGameData.totalRounds) {
      await update(ref(getFirebaseRTDB(), `rooms/${roomId}/gameState`), {
        status: "finished",
      });
      return;
    }

    const nextLetter = LETTERS[Math.floor(Math.random() * LETTERS.length)];

    await update(ref(getFirebaseRTDB(), `rooms/${roomId}/gameState`), {
      round: nextRoundNum,
      currentLetter: nextLetter,
      timeLeft: ROUND_TIME,
      status: "answering",
      answers: {},
    });

    setAnswers({ إنسان: "", نبات: "", حيوان: "" });
    setSubmitted(false);
  }, [roomId]);

  const gameRef = ref(getFirebaseRTDB(), `rooms/${roomId}/gameState`);

  useEffect(() => {
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setGameData(data as GameData);
    });

    return () => off(gameRef, "value", unsubscribe);
  }, [roomId, gameRef]);

  const initGame = useCallback(async () => {
    const roomSnap = await get(ref(getFirebaseRTDB(), `rooms/${roomId}`));
    const room = roomSnap.val();
    if (!room) return;

    const players: Record<string, { name: string }> = {};
    for (const [uid, p] of Object.entries(room.players as Record<string, { name: string }>)) {
      players[uid] = { name: p.name };
    }

    const firstLetter = LETTERS[Math.floor(Math.random() * LETTERS.length)];

    const initial: GameData = {
      round: 1,
      totalRounds: TOTAL_ROUNDS,
      currentLetter: firstLetter,
      timeLeft: ROUND_TIME,
      status: "answering",
      answers: {},
      scores: {},
      players,
    };

    await set(gameRef, initial);
    logger.info("Animal-Plant-Human game started", { roomId });
  }, [roomId, gameRef]);

  useEffect(() => {
    if (!gameData || gameData.status !== "answering") return;

    const interval = setInterval(() => {
      setGameData((prev) => {
        if (!prev) return prev;
        if (prev.timeLeft <= 1) {
          clearInterval(interval);
          return { ...prev, timeLeft: 0, status: "revealing" };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameData?.status, gameData?.round]);

  useEffect(() => {
    if (!gameData || gameData.status !== "revealing") return;

    const timeout = setTimeout(async () => {
      await calculateScores(gameData);
      await nextRound(gameData);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [gameData?.status, gameData, calculateScores, nextRound]);

  const submitAnswers = async () => {
    if (!user || submitted) return;

    await update(ref(getFirebaseRTDB(), `rooms/${roomId}/gameState/answers`), {
      [user.uid]: answers,
    });

    setSubmitted(true);
  };

  const endGame = async () => {
    await update(ref(getFirebaseRTDB(), `rooms/${roomId}/metadata`), {
      status: "finished",
    });
  };

  if (!gameData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <span className="text-6xl">🌿</span>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          إنسان نبات حيوان
        </h1>
        <Button onClick={initGame}>بدء اللعبة</Button>
      </div>
    );
  }

  if (gameData.status === "finished") {
    const totalScores: Record<string, number> = {};
    for (const [uid, scores] of Object.entries(gameData.scores)) {
      totalScores[uid] = Object.values(scores).reduce((a, b) => a + b, 0);
    }

    const sorted = Object.entries(totalScores).sort(([, a], [, b]) => b - a);

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
        <span className="text-6xl">🏆</span>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          النتائج النهائية
        </h1>

        <div className="w-full max-w-md">
          {sorted.map(([uid, score], idx) => (
            <div
              key={uid}
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
                  {gameData.players[uid]?.name || uid}
                </span>
              </div>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {score} نقطة
              </span>
            </div>
          ))}
        </div>

        <Button onClick={endGame}>إنهاء اللعبة</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center gap-6 p-4 pt-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          إنسان نبات حيوان
        </h1>
        <p className="text-sm text-zinc-500">
          الجولة {gameData.round}/{gameData.totalRounds}
        </p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <span className="text-sm text-zinc-500">الحرف</span>
        <span className="text-6xl font-bold text-emerald-600 dark:text-emerald-400">
          {gameData.currentLetter}
        </span>
        <div className="flex items-center gap-2">
          <div className="h-2 w-32 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className="h-full bg-emerald-600 transition-all"
              style={{
                width: `${(gameData.timeLeft / ROUND_TIME) * 100}%`,
              }}
            />
          </div>
          <span className="text-sm font-mono text-zinc-600 dark:text-zinc-400">
            {gameData.timeLeft}s
          </span>
        </div>
      </div>

      {gameData.status === "answering" && !submitted && (
        <div className="flex w-full max-w-md flex-col gap-4">
          {CATEGORIES.map((cat) => (
            <div key={cat} className="flex flex-col gap-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {cat === "إنسان" ? "👤" : cat === "نبات" ? "🌿" : "🐾"}{" "}
                {cat}
              </label>
              <input
                value={answers[cat]}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [cat]: e.target.value }))
                }
                placeholder={`اسم ${cat} يبدأ بحرف ${gameData.currentLetter}`}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-3 text-center text-lg dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                dir="rtl"
              />
            </div>
          ))}
          <Button onClick={submitAnswers} className="w-full">
            تأكيد الإجابات
          </Button>
        </div>
      )}

      {gameData.status === "answering" && submitted && (
        <div className="rounded-xl bg-emerald-50 p-6 text-center dark:bg-emerald-900/20">
          <p className="text-emerald-700 dark:text-emerald-400">
            ✅ تم تأكيد إجاباتك. في انتظار اللاعبين الآخرين...
          </p>
        </div>
      )}

      {gameData.status === "revealing" && (
        <div className="w-full max-w-md">
          <h2 className="mb-4 text-center text-lg font-semibold text-zinc-800 dark:text-zinc-200">
            الإجابات
          </h2>
          {CATEGORIES.map((cat) => (
            <div key={cat} className="mb-3">
              <p className="mb-1 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {cat}
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(gameData.answers).map(([uid, ans]) => (
                  <span
                    key={uid}
                    className="rounded-lg bg-zinc-100 px-3 py-1 text-sm dark:bg-zinc-800"
                  >
                    {gameData.players[uid]?.name}:{" "}
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {(ans as Record<Category, string>)[cat] || "—"}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
