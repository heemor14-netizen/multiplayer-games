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
import { QUESTIONS, type QuizGameState } from "./index";
import { logger } from "@/lib/logger";
import { persistScores } from "@/lib/gameEnd";

const SHOW_TIME = 10;
const ANSWER_TIME = 15;
const TOTAL_ROUNDS = 5;

export default function Quiz({ roomId }: { roomId: string }) {
  const { user } = useAuth();
  const [gameData, setGameData] = useState<QuizGameState | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const calculateScores = useCallback(async (data: QuizGameState) => {
    const db = getFirebaseRTDB();
    const snap = await get(ref(db, `rooms/${roomId}/gameState/answers`));
    const allAnswers = snap.val() || {};

    const newScores: Record<string, number> = {};
    for (const uid of Object.keys(data.players)) {
      newScores[uid] = 0;
    }

    for (const [uid, ansIdx] of Object.entries(allAnswers) as [string, number][]) {
      if (ansIdx === data.currentQuestion.correctIndex) {
        newScores[uid] = 10;
      }
    }

    await update(ref(db, `rooms/${roomId}/gameState`), { scores: newScores });
  }, [roomId]);

  const nextRound = useCallback(async (data: QuizGameState) => {
    const db = getFirebaseRTDB();
    const nextRoundNum = data.currentRound + 1;

    if (nextRoundNum > data.totalRounds) {
      await update(ref(db, `rooms/${roomId}/gameState`), { status: "finished" });
      return;
    }

    const available = QUESTIONS.filter((_, i) => !data.usedIndices.includes(i));
    const nextQ = available[Math.floor(Math.random() * available.length)];
    const nextIdx = QUESTIONS.indexOf(nextQ);

    await update(ref(db, `rooms/${roomId}/gameState`), {
      currentRound: nextRoundNum,
      currentQuestion: nextQ,
      timeLeft: SHOW_TIME,
      status: "showing",
      answers: {},
      usedIndices: [...data.usedIndices, nextIdx],
    });

    setSelectedOption(null);
    setSubmitted(false);
  }, [roomId]);

  const gameRef = ref(getFirebaseRTDB(), `rooms/${roomId}/gameState`);

  useEffect(() => {
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setGameData(data as QuizGameState);
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

    const firstQ = QUESTIONS[0];
    const firstIdx = 0;

    const initial: QuizGameState = {
      currentRound: 1,
      totalRounds: TOTAL_ROUNDS,
      currentQuestion: firstQ,
      timeLeft: SHOW_TIME,
      status: "showing",
      answers: {},
      scores: {},
      players,
      usedIndices: [firstIdx],
    };

    await set(ref(db, `rooms/${roomId}/gameState`), initial);
    logger.info("Quiz game started", { roomId });
  }, [roomId]);

  useEffect(() => {
    if (!gameData) return;
    if (gameData.status !== "showing" && gameData.status !== "answering") return;

    const interval = setInterval(() => {
      setGameData((prev) => {
        if (!prev) return prev;
        if (prev.timeLeft <= 1) {
          clearInterval(interval);
          if (prev.status === "showing") {
            return { ...prev, timeLeft: ANSWER_TIME, status: "answering" };
          }
          return { ...prev, timeLeft: 0, status: "revealing" };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameData?.status, gameData?.currentRound]);

  useEffect(() => {
    if (!gameData || gameData.status !== "revealing") return;

    const timeout = setTimeout(async () => {
      await calculateScores(gameData);
      await nextRound(gameData);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [gameData?.status, gameData, calculateScores, nextRound]);

  const submitAnswer = async () => {
    if (!user || submitted || selectedOption === null) return;

    const db = getFirebaseRTDB();
    await update(ref(db, `rooms/${roomId}/gameState/answers`), {
      [user.uid]: selectedOption,
    });
    setSubmitted(true);
  };

  const endGame = async () => {
    if (!gameData) return;
    await persistScores(gameData.scores as Record<string, unknown>, gameData.players);
    const db = getFirebaseRTDB();
    await update(ref(db, `rooms/${roomId}/metadata`), { status: "finished" });
  };

  if (!gameData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <span className="text-6xl">🧠</span>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">مسابقات</h1>
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
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">🧠 مسابقات</h1>
        <p className="text-sm text-zinc-500">
          الجولة {gameData.currentRound}/{gameData.totalRounds}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="h-2 w-32 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className="h-full bg-emerald-600 transition-all"
            style={{ width: `${(gameData.timeLeft / (gameData.status === "showing" ? SHOW_TIME : ANSWER_TIME)) * 100}%` }}
          />
        </div>
        <span className="text-sm font-mono text-zinc-600 dark:text-zinc-400">{gameData.timeLeft}s</span>
      </div>

      {gameData.status === "showing" && (
        <div className="w-full max-w-lg rounded-2xl bg-blue-50 p-8 text-center dark:bg-blue-900/20">
          <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {gameData.currentQuestion.question}
          </p>
          <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">تذكّر السؤال...</p>
        </div>
      )}

      {gameData.status === "answering" && (
        <div className="w-full max-w-lg">
          <p className="mb-4 text-center text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {gameData.currentQuestion.question}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {gameData.currentQuestion.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (!submitted) setSelectedOption(idx);
                }}
                disabled={submitted}
                className={`rounded-xl border-2 p-4 text-center text-sm font-medium transition-colors
                  ${
                    selectedOption === idx
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  }
                  ${submitted ? "cursor-not-allowed opacity-70" : "cursor-pointer"}
                `}
              >
                {opt}
              </button>
            ))}
          </div>

          {!submitted && (
            <Button onClick={submitAnswer} disabled={selectedOption === null} className="mt-4 w-full">
              تأكيد الإجابة
            </Button>
          )}

          {submitted && (
            <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-center dark:bg-emerald-900/20">
              <p className="text-emerald-700 dark:text-emerald-400">
                ✅ تم تأكيد إجابتك
              </p>
            </div>
          )}
        </div>
      )}

      {gameData.status === "revealing" && (
        <div className="w-full max-w-lg">
          <div className="rounded-2xl bg-zinc-50 p-6 dark:bg-zinc-800">
            <p className="mb-2 text-sm text-zinc-500">السؤال</p>
            <p className="mb-4 font-semibold text-zinc-900 dark:text-zinc-100">
              {gameData.currentQuestion.question}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {gameData.currentQuestion.options.map((opt, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-3 text-center text-sm ${
                    idx === gameData.currentQuestion.correctIndex
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400"
                  }`}
                >
                  {opt}
                  {idx === gameData.currentQuestion.correctIndex && " ✅"}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">إجابات اللاعبين</span>
            {Object.entries(gameData.answers).map(([uid, ansIdx]) => (
              <div key={uid} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
                <span className="text-sm text-zinc-900 dark:text-zinc-100">
                  {gameData.players[uid]?.name}
                </span>
                <span className={`text-sm ${(ansIdx as number) === gameData.currentQuestion.correctIndex ? "text-emerald-600 font-medium" : "text-red-500"}`}>
                  {gameData.currentQuestion.options[ansIdx as number]}
                  {(ansIdx as number) === gameData.currentQuestion.correctIndex ? " ✅" : " ❌"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
