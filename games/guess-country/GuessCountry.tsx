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
import { COUNTRIES } from "./index";
import { logger } from "@/lib/logger";

const ROUND_TIME = 30;
const TOTAL_ROUNDS = 5;

interface CountryData {
  round: number;
  totalRounds: number;
  currentHint: string;
  currentLetter: string;
  timeLeft: number;
  status: "answering" | "revealing" | "finished";
  answers: Record<string, string>;
  scores: Record<string, number>;
  players: Record<string, { name: string }>;
}

function getRandomQuestion(): { hint: string; letter: string } {
  const letters = Object.keys(COUNTRIES);
  const letter = letters[Math.floor(Math.random() * letters.length)];
  const questions = COUNTRIES[letter];
  const q = questions[Math.floor(Math.random() * questions.length)];
  return { hint: q.hint, letter: q.letter };
}

export default function GuessCountry({ roomId }: { roomId: string }) {
  const { user } = useAuth();
  const [gameData, setGameData] = useState<CountryData | null>(null);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const calculateScores = useCallback(async (data: CountryData) => {
    const db = getFirebaseRTDB();
    const snap = await get(ref(db, `rooms/${roomId}/gameState/answers`));
    const allAnswers = snap.val() || {};

    const newScores: Record<string, number> = {};
    for (const uid of Object.keys(data.players)) {
      newScores[uid] = 0;
    }

    const answerCounts: Record<string, number> = {};
    for (const ans of Object.values(allAnswers) as string[]) {
      const normalized = ans.trim().toLowerCase();
      answerCounts[normalized] = (answerCounts[normalized] || 0) + 1;
    }

    for (const [uid, ans] of Object.entries(allAnswers) as [string, string][]) {
      const normalized = (ans as string).trim().toLowerCase();
      if (answerCounts[normalized] === 1) {
        newScores[uid] = 10;
      } else if (answerCounts[normalized] > 1) {
        newScores[uid] = 5;
      }
    }

    await update(ref(db, `rooms/${roomId}/gameState`), { scores: newScores });
  }, [roomId]);

  const nextRound = useCallback(async (data: CountryData) => {
    const db = getFirebaseRTDB();
    const nextRoundNum = data.round + 1;

    if (nextRoundNum > data.totalRounds) {
      await update(ref(db, `rooms/${roomId}/gameState`), { status: "finished" });
      return;
    }

    const q = getRandomQuestion();
    await update(ref(db, `rooms/${roomId}/gameState`), {
      round: nextRoundNum,
      currentHint: q.hint,
      currentLetter: q.letter,
      timeLeft: ROUND_TIME,
      status: "answering",
      answers: {},
    });

    setAnswer("");
    setSubmitted(false);
  }, [roomId]);

  const gameRef = ref(getFirebaseRTDB(), `rooms/${roomId}/gameState`);

  useEffect(() => {
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setGameData(data as CountryData);
    });
    return () => off(gameRef, "value", unsubscribe);
  }, [roomId, gameRef]);

  const initGame = useCallback(async () => {
    const db = getFirebaseRTDB();
    const roomSnap = await get(ref(db, `rooms/${roomId}`));
    const room = roomSnap.val();
    if (!room) return;

    const players: Record<string, { name: string }> = {};
    for (const [uid, p] of Object.entries(room.players as Record<string, { name: string }>)) {
      players[uid] = { name: p.name };
    }

    const q = getRandomQuestion();
    const initial: CountryData = {
      round: 1,
      totalRounds: TOTAL_ROUNDS,
      currentHint: q.hint,
      currentLetter: q.letter,
      timeLeft: ROUND_TIME,
      status: "answering",
      answers: {},
      scores: {},
      players,
    };

    await set(ref(db, `rooms/${roomId}/gameState`), initial);
    logger.info("Guess Country game started", { roomId });
  }, [roomId]);

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

  const submitAnswer = async () => {
    if (!user || submitted || !answer.trim()) return;

    const db = getFirebaseRTDB();
    await update(ref(db, `rooms/${roomId}/gameState/answers`), {
      [user.uid]: answer.trim(),
    });
    setSubmitted(true);
  };

  const endGame = async () => {
    const db = getFirebaseRTDB();
    await update(ref(db, `rooms/${roomId}/metadata`), { status: "finished" });
  };

  if (!gameData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <span className="text-6xl">🌍</span>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">خمن الدولة</h1>
        <Button onClick={initGame}>بدء اللعبة</Button>
      </div>
    );
  }

  if (gameData.status === "finished") {
    const sorted = Object.entries(gameData.scores).sort(([, a], [, b]) => b - a);

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
        <span className="text-6xl">🏆</span>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">النتائج النهائية</h1>

        <div className="w-full max-w-md">
          {sorted.map(([uid, score], idx) => (
            <div
              key={uid}
              className={`flex items-center justify-between rounded-lg p-3 ${
                idx === 0 ? "bg-yellow-100 dark:bg-yellow-900/20" : "bg-zinc-50 dark:bg-zinc-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-zinc-500">#{idx + 1}</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {gameData.players[uid]?.name || uid}
                </span>
              </div>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{score} نقطة</span>
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
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">خمن الدولة</h1>
        <p className="text-sm text-zinc-500">الجولة {gameData.round}/{gameData.totalRounds}</p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="rounded-2xl bg-emerald-100 px-8 py-6 text-center dark:bg-emerald-900/20">
          <p className="mb-2 text-sm text-emerald-600 dark:text-emerald-400">التلميح</p>
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {gameData.currentHint}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            يبدأ بحرف: <span className="font-bold text-emerald-600">{gameData.currentLetter}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-2 w-32 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div
              className="h-full bg-emerald-600 transition-all"
              style={{ width: `${(gameData.timeLeft / ROUND_TIME) * 100}%` }}
            />
          </div>
          <span className="text-sm font-mono text-zinc-600 dark:text-zinc-400">{gameData.timeLeft}s</span>
        </div>
      </div>

      {gameData.status === "answering" && !submitted && (
        <div className="flex w-full max-w-md flex-col gap-4">
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitAnswer()}
            placeholder="اسم الدولة..."
            className="rounded-lg border border-zinc-300 bg-white px-4 py-3 text-center text-lg dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            dir="rtl"
          />
          <Button onClick={submitAnswer} disabled={!answer.trim()} className="w-full">
            تأكيد الإجابة
          </Button>
        </div>
      )}

      {gameData.status === "answering" && submitted && (
        <div className="rounded-xl bg-emerald-50 p-6 text-center dark:bg-emerald-900/20">
          <p className="text-emerald-700 dark:text-emerald-400">
            ✅ تم تأكيد إجابتك. في انتظار اللاعبين الآخرين...
          </p>
        </div>
      )}

      {gameData.status === "revealing" && (
        <div className="w-full max-w-md">
          <h2 className="mb-4 text-center text-lg font-semibold text-zinc-800 dark:text-zinc-200">
            الإجابات
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(gameData.answers).map(([uid, ans]) => (
              <span
                key={uid}
                className="rounded-lg bg-zinc-100 px-3 py-1 text-sm dark:bg-zinc-800"
              >
                {gameData.players[uid]?.name}:{" "}
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{ans as string}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
