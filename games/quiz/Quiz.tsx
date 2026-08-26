"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { SyncDB } from "@/lib/syncEngine";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { QUESTIONS, type QuizGameState, type QuizQuestion } from "./index";
import { sound } from "@/lib/sound";
import { launchConfetti } from "@/lib/confetti";
import { persistScores } from "@/lib/gameEnd";
import type { Room } from "@/types/room";

const ANSWER_TIME = 15;
const REVEAL_TIME = 4;
const TOTAL_ROUNDS = 5;

export default function Quiz({ roomId }: { roomId: string }) {
  const { user } = useAuth();
  const [gameData, setGameData] = useState<QuizGameState | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const confettiFired = useRef(false);

  // Subscribe to game state
  useEffect(() => {
    const unsub = SyncDB.subscribe(`rooms/${roomId}`, (data) => {
      const room = data as Room | null;
      if (!room) return;

      setIsHost(room.metadata.host === user?.uid);

      if (room.gameState) {
        setGameData(room.gameState as unknown as QuizGameState);
      }
    });

    return () => unsub();
  }, [roomId, user?.uid]);

  // Host auto-initializes game if not initialized
  useEffect(() => {
    if (!isHost || gameData) return;

    const initHostGame = async () => {
      const room = (await SyncDB.get(`rooms/${roomId}`)) as Room | null;
      if (!room || room.gameState) return;

      const players: Record<string, { name: string; photoURL?: string | null; isBot?: boolean }> = {};
      for (const [uid, p] of Object.entries(room.players)) {
        players[uid] = { name: p.name, photoURL: p.photoURL, isBot: p.isBot };
      }

      const randomIdx = Math.floor(Math.random() * QUESTIONS.length);
      const firstQ = QUESTIONS[randomIdx];

      const initial: QuizGameState = {
        currentRound: 1,
        totalRounds: TOTAL_ROUNDS,
        currentQuestion: firstQ,
        timeLeft: ANSWER_TIME,
        status: "answering",
        answers: {},
        scores: Object.fromEntries(Object.keys(players).map((k) => [k, 0])),
        players,
        usedIndices: [randomIdx],
      };

      await SyncDB.set(`rooms/${roomId}/gameState`, initial);
      sound.playGameStart();
    };

    initHostGame();
  }, [isHost, gameData, roomId]);

  // Round progression logic (Host only)
  const calculateScores = useCallback(async (data: QuizGameState) => {
    const snap = (await SyncDB.get(`rooms/${roomId}/gameState/answers`)) as Record<string, number> | null;
    const allAnswers = snap || {};

    const newScores = { ...data.scores };
    const correctIdx = data.currentQuestion.correctIndex;

    for (const [uid, ansIdx] of Object.entries(allAnswers)) {
      if (ansIdx === correctIdx) {
        newScores[uid] = (newScores[uid] || 0) + 10;
      }
    }

    await SyncDB.update(`rooms/${roomId}/gameState`, { scores: newScores });
  }, [roomId]);

  const nextRound = useCallback(
    async (data: QuizGameState) => {
      const nextRoundNum = data.currentRound + 1;

      if (nextRoundNum > data.totalRounds) {
        await persistScores(data.scores, data.players);
        await SyncDB.update(`rooms/${roomId}/gameState`, { status: "finished" });
        await SyncDB.update(`rooms/${roomId}/metadata`, { status: "finished" });
        return;
      }

      const available = QUESTIONS.filter((_, i) => !data.usedIndices.includes(i));
      const pool = available.length > 0 ? available : QUESTIONS;
      const nextQ = pool[Math.floor(Math.random() * pool.length)];
      const nextIdx = QUESTIONS.indexOf(nextQ);

      await SyncDB.update(`rooms/${roomId}/gameState`, {
        currentRound: nextRoundNum,
        currentQuestion: nextQ,
        timeLeft: ANSWER_TIME,
        status: "answering",
        answers: {},
        usedIndices: [...data.usedIndices, nextIdx],
      });

      setSelectedOption(null);
      setSubmitted(false);
    },
    [roomId]
  );

  // Timer interval (Host drives the timer)
  useEffect(() => {
    if (!isHost || !gameData || gameData.status !== "answering") return;

    const interval = setInterval(async () => {
      if (gameData.timeLeft <= 1) {
        clearInterval(interval);
        sound.playTick();
        await calculateScores(gameData);
        await SyncDB.update(`rooms/${roomId}/gameState`, {
          status: "revealing",
          timeLeft: REVEAL_TIME,
        });
      } else {
        if (gameData.timeLeft <= 4) {
          sound.playTick();
        }
        await SyncDB.update(`rooms/${roomId}/gameState`, {
          timeLeft: gameData.timeLeft - 1,
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isHost, gameData, roomId, calculateScores]);

  // Revealing timeout (Host moves to next round)
  useEffect(() => {
    if (!isHost || !gameData || gameData.status !== "revealing") return;

    const timeout = setTimeout(async () => {
      await nextRound(gameData);
    }, REVEAL_TIME * 1000);

    return () => clearTimeout(timeout);
  }, [isHost, gameData, nextRound]);

  // Bot simulation (Host generates bot answers)
  useEffect(() => {
    if (!isHost || !gameData || gameData.status !== "answering") return;

    const bots = Object.entries(gameData.players).filter(([, p]) => p.isBot);
    if (bots.length === 0) return;

    bots.forEach(([botUid]) => {
      if (gameData.answers[botUid] === undefined) {
        const delay = Math.random() * 6000 + 2000; // 2-8s thinking time
        setTimeout(async () => {
          // 75% chance correct
          const isCorrect = Math.random() < 0.75;
          const chosenOpt = isCorrect
            ? gameData.currentQuestion.correctIndex
            : Math.floor(Math.random() * gameData.currentQuestion.options.length);

          await SyncDB.update(`rooms/${roomId}/gameState/answers`, {
            [botUid]: chosenOpt,
          });
        }, delay);
      }
    });
  }, [isHost, gameData, roomId]);

  // Confetti on finish
  useEffect(() => {
    if (gameData?.status === "finished" && !confettiFired.current) {
      confettiFired.current = true;
      sound.playVictory();
      launchConfetti();
    }
  }, [gameData?.status]);

  const submitAnswer = async (idx: number) => {
    if (!user || submitted || gameData?.status !== "answering") return;

    setSelectedOption(idx);
    setSubmitted(true);

    if (idx === gameData.currentQuestion.correctIndex) {
      sound.playCorrect();
    } else {
      sound.playWrong();
    }

    await SyncDB.update(`rooms/${roomId}/gameState/answers`, {
      [user.uid]: idx,
    });
  };

  if (!gameData) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        <p className="text-base font-bold text-zinc-600 dark:text-zinc-400">جاري إعداد الأسئلة...</p>
      </div>
    );
  }

  if (gameData.status === "finished") {
    const sorted = Object.entries(gameData.scores || {}).sort(([, a], [, b]) => b - a);

    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 p-4 animate-scale-in">
        <span className="text-6xl sm:text-7xl animate-bounce">🏆</span>
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gradient sm:text-4xl">النتائج النهائية</h1>
          <p className="mt-1 text-sm font-medium text-zinc-500">لعبة مسابقات وتحدي 🧠</p>
        </div>

        <div className="w-full max-w-md space-y-3">
          {sorted.map(([uid, score], idx) => {
            const player = gameData.players[uid];
            return (
              <div
                key={uid}
                className={`flex items-center justify-between rounded-2xl p-4 transition-all ${
                  idx === 0
                    ? "border-2 border-amber-400 bg-gradient-to-l from-amber-50 to-yellow-50 shadow-lg shadow-amber-500/15 dark:border-amber-600 dark:from-amber-950/40 dark:to-yellow-950/40"
                    : "border border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-900/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{player?.photoURL || "👤"}</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {player?.name || uid}
                    </span>
                  </div>
                </div>
                <span className="text-lg font-extrabold text-orange-600 dark:text-orange-400">
                  {score} نقطة
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(gameData.answers || {}).length;
  const totalPlayersCount = Object.keys(gameData.players || {}).length;
  const progressPercent = (gameData.timeLeft / ANSWER_TIME) * 100;

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 p-4 pt-6">
      {/* Header Info */}
      <div className="flex w-full items-center justify-between rounded-2xl border border-white/20 bg-white/80 p-4 shadow-md backdrop-blur-sm dark:bg-zinc-900/80">
        <div className="flex items-center gap-2">
          <span className="rounded-xl gradient-primary px-3 py-1 text-xs font-extrabold text-white">
            الجولة {gameData.currentRound} / {gameData.totalRounds}
          </span>
          <span className="rounded-xl bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700 dark:bg-orange-950/50 dark:text-orange-300">
            {gameData.currentQuestion.category}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-sm font-bold">
          <span>⏳</span>
          <span className={gameData.timeLeft <= 5 ? "animate-pulse text-red-500 font-extrabold text-lg" : "text-zinc-700 dark:text-zinc-300"}>
            {gameData.timeLeft} ثوانٍ
          </span>
        </div>
      </div>

      {/* Timer Progress Bar */}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`h-full transition-all duration-1000 ${
            gameData.timeLeft <= 5 ? "bg-red-500" : "bg-gradient-to-r from-orange-500 to-amber-400"
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="w-full overflow-hidden rounded-3xl border border-white/20 bg-white/90 p-6 text-center shadow-xl backdrop-blur-md dark:bg-zinc-900/90 sm:p-8 animate-fade-in">
        <span className="text-4xl">💡</span>
        <h2 className="mt-3 text-xl font-extrabold text-zinc-900 dark:text-zinc-100 sm:text-2xl">
          {gameData.currentQuestion.question}
        </h2>
      </div>

      {/* Options Grid */}
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {gameData.currentQuestion.options.map((opt, idx) => {
          const isSelected = selectedOption === idx;
          const isCorrect = idx === gameData.currentQuestion.correctIndex;
          const isRevealing = gameData.status === "revealing";

          let btnStyle = "border-zinc-200 bg-white text-zinc-800 hover:border-orange-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200";

          if (isRevealing) {
            if (isCorrect) {
              btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-700 font-extrabold shadow-lg shadow-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-300";
            } else if (isSelected && !isCorrect) {
              btnStyle = "border-red-500 bg-red-50 text-red-700 line-through dark:bg-red-950/40 dark:text-red-300";
            } else {
              btnStyle = "opacity-50 border-zinc-200 bg-zinc-50 dark:bg-zinc-900";
            }
          } else if (isSelected) {
            btnStyle = "border-orange-500 bg-orange-50 text-orange-700 font-extrabold shadow-lg shadow-orange-500/20 dark:bg-orange-950/40 dark:text-orange-300";
          }

          return (
            <button
              key={idx}
              onClick={() => submitAnswer(idx)}
              disabled={submitted || isRevealing}
              className={`flex items-center justify-between rounded-2xl border-2 p-4 text-right text-base font-bold transition-all duration-200 ${btnStyle} ${
                submitted || isRevealing ? "cursor-default" : "cursor-pointer hover:-translate-y-0.5 active:scale-[0.98]"
              }`}
            >
              <span>{opt}</span>
              {isRevealing && isCorrect && <span className="text-xl">✅</span>}
              {isRevealing && isSelected && !isCorrect && <span className="text-xl">❌</span>}
            </button>
          );
        })}
      </div>

      {/* Answer status */}
      <div className="flex w-full items-center justify-between text-xs font-bold text-zinc-500 dark:text-zinc-400">
        <span>
          أجاب: {answeredCount} من {totalPlayersCount} لاعب
        </span>
        {submitted && gameData.status === "answering" && (
          <span className="text-emerald-600 dark:text-emerald-400">✅ تم تسجيل إجابتك، في انتظار باقي اللاعبين...</span>
        )}
      </div>

      {/* Live Player Answers / Scores Strip */}
      <div className="flex w-full flex-wrap gap-2 justify-center pt-2">
        {Object.entries(gameData.players).map(([uid, p]) => {
          const hasAnswered = gameData.answers[uid] !== undefined;
          const userScore = gameData.scores[uid] || 0;
          return (
            <div
              key={uid}
              className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                hasAnswered
                  ? "border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              <span>{p.photoURL || "👤"}</span>
              <span>{p.name}</span>
              <span className="rounded-md bg-black/10 px-1.5 py-0.5 text-[10px]">{userScore} نقطة</span>
              {hasAnswered && <span>✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
