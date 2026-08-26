"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { SyncDB } from "@/lib/syncEngine";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { COUNTRIES_DATA, type CountryGameState, type CountryQuestion } from "./index";
import { sound } from "@/lib/sound";
import { launchConfetti } from "@/lib/confetti";
import { persistScores } from "@/lib/gameEnd";
import type { Room } from "@/types/room";

const ROUND_TIME = 25;
const REVEAL_TIME = 4;
const TOTAL_ROUNDS = 5;

function normalizeArabic(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F]/g, "") // Remove harakat
    .replace(/\s+/g, " ");
}

function isCountryMatch(input: string, question: CountryQuestion): boolean {
  const normInput = normalizeArabic(input);
  const normCountry = normalizeArabic(question.country);
  if (normInput === normCountry) return true;

  return question.aliases.some((alias) => normalizeArabic(alias) === normInput);
}

export default function GuessCountry({ roomId }: { roomId: string }) {
  const { user } = useAuth();
  const [gameData, setGameData] = useState<CountryGameState | null>(null);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const confettiFired = useRef(false);

  // Subscribe to room updates
  useEffect(() => {
    const unsub = SyncDB.subscribe(`rooms/${roomId}`, (data) => {
      const room = data as Room | null;
      if (!room) return;

      setIsHost(room.metadata.host === user?.uid);

      if (room.gameState) {
        setGameData(room.gameState as unknown as CountryGameState);
      }
    });

    return () => unsub();
  }, [roomId, user?.uid]);

  // Host auto-initializes game
  useEffect(() => {
    if (!isHost || gameData) return;

    const initHostGame = async () => {
      const room = (await SyncDB.get(`rooms/${roomId}`)) as Room | null;
      if (!room || room.gameState) return;

      const players: Record<string, { name: string; photoURL?: string | null; isBot?: boolean }> = {};
      for (const [uid, p] of Object.entries(room.players)) {
        players[uid] = { name: p.name, photoURL: p.photoURL, isBot: p.isBot };
      }

      const randomIdx = Math.floor(Math.random() * COUNTRIES_DATA.length);
      const firstQ = COUNTRIES_DATA[randomIdx];

      const initial: CountryGameState = {
        round: 1,
        totalRounds: TOTAL_ROUNDS,
        currentQuestion: firstQ,
        timeLeft: ROUND_TIME,
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
  const calculateScores = useCallback(async (data: CountryGameState) => {
    const snap = (await SyncDB.get(`rooms/${roomId}/gameState/answers`)) as Record<string, string> | null;
    const allAnswers = snap || {};

    const newScores = { ...data.scores };
    const q = data.currentQuestion;

    for (const [uid, ans] of Object.entries(allAnswers)) {
      if (ans && isCountryMatch(ans, q)) {
        newScores[uid] = (newScores[uid] || 0) + 10;
      }
    }

    await SyncDB.update(`rooms/${roomId}/gameState`, { scores: newScores });
  }, [roomId]);

  const nextRound = useCallback(
    async (data: CountryGameState) => {
      const nextRoundNum = data.round + 1;

      if (nextRoundNum > data.totalRounds) {
        await persistScores(data.scores, data.players);
        await SyncDB.update(`rooms/${roomId}/gameState`, { status: "finished" });
        await SyncDB.update(`rooms/${roomId}/metadata`, { status: "finished" });
        return;
      }

      const available = COUNTRIES_DATA.filter((_, i) => !data.usedIndices.includes(i));
      const pool = available.length > 0 ? available : COUNTRIES_DATA;
      const nextQ = pool[Math.floor(Math.random() * pool.length)];
      const nextIdx = COUNTRIES_DATA.indexOf(nextQ);

      await SyncDB.update(`rooms/${roomId}/gameState`, {
        round: nextRoundNum,
        currentQuestion: nextQ,
        timeLeft: ROUND_TIME,
        status: "answering",
        answers: {},
        usedIndices: [...data.usedIndices, nextIdx],
      });

      setAnswer("");
      setSubmitted(false);
    },
    [roomId]
  );

  // Timer interval (Host drives timer)
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

  // Bot simulation
  useEffect(() => {
    if (!isHost || !gameData || gameData.status !== "answering") return;

    const bots = Object.entries(gameData.players).filter(([, p]) => p.isBot);
    if (bots.length === 0) return;

    bots.forEach(([botUid]) => {
      if (!gameData.answers[botUid]) {
        const delay = Math.random() * 8000 + 3000;
        setTimeout(async () => {
          const isCorrect = Math.random() < 0.8;
          const botAnswer = isCorrect
            ? gameData.currentQuestion.country
            : ["مصر", "السعودية", "فرنسا", "اليابان", "تركيا"][Math.floor(Math.random() * 5)];

          await SyncDB.update(`rooms/${roomId}/gameState/answers`, {
            [botUid]: botAnswer,
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

  const submitAnswer = async () => {
    if (!user || submitted || !answer.trim() || gameData?.status !== "answering") return;

    setSubmitted(true);
    const correct = isCountryMatch(answer, gameData.currentQuestion);
    if (correct) {
      sound.playCorrect();
    } else {
      sound.playWrong();
    }

    await SyncDB.update(`rooms/${roomId}/gameState/answers`, {
      [user.uid]: answer.trim(),
    });
  };

  if (!gameData) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        <p className="text-base font-bold text-zinc-600 dark:text-zinc-400">جاري تحميل خريطة الدول...</p>
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
          <p className="mt-1 text-sm font-medium text-zinc-500">لعبة خمن الدولة 🌍</p>
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
  const progressPercent = (gameData.timeLeft / ROUND_TIME) * 100;
  const isRevealing = gameData.status === "revealing";

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 p-4 pt-6">
      {/* Header Info */}
      <div className="flex w-full items-center justify-between rounded-2xl border border-white/20 bg-white/80 p-4 shadow-md backdrop-blur-sm dark:bg-zinc-900/80">
        <div className="flex items-center gap-2">
          <span className="rounded-xl gradient-primary px-3 py-1 text-xs font-extrabold text-white">
            الجولة {gameData.round} / {gameData.totalRounds}
          </span>
          <span className="rounded-xl bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
            قارة {gameData.currentQuestion.continent}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-sm font-bold">
          <span>⏳</span>
          <span className={gameData.timeLeft <= 5 ? "animate-pulse text-red-500 font-extrabold text-lg" : "text-zinc-700 dark:text-zinc-300"}>
            {gameData.timeLeft} ثوانٍ
          </span>
        </div>
      </div>

      {/* Timer Progress */}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`h-full transition-all duration-1000 ${
            gameData.timeLeft <= 5 ? "bg-red-500" : "bg-gradient-to-r from-amber-500 to-orange-500"
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Flag and Hint Card */}
      <div className="flex w-full flex-col items-center gap-4 rounded-3xl border border-white/20 bg-white/90 p-6 text-center shadow-xl backdrop-blur-md dark:bg-zinc-900/90 sm:p-8 animate-fade-in">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 text-5xl shadow-inner dark:bg-amber-950/30 sm:h-24 sm:w-24 sm:text-6xl">
          {gameData.currentQuestion.flag}
        </div>

        <div>
          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-extrabold text-orange-700 dark:bg-orange-950 dark:text-orange-300">
            تبدأ بحرف: {gameData.currentQuestion.letter}
          </span>
          <p className="mt-3 text-lg font-bold text-zinc-800 dark:text-zinc-200 sm:text-xl">
            {gameData.currentQuestion.hint}
          </p>
        </div>
      </div>

      {/* Input or Result Box */}
      {!isRevealing ? (
        <div className="w-full max-w-md space-y-3">
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitAnswer()}
            disabled={submitted}
            placeholder="اكتب اسم الدولة هنا..."
            className="w-full rounded-2xl border-2 border-zinc-300 bg-white px-5 py-3.5 text-center text-lg font-bold text-zinc-900 shadow-sm transition-all focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/20 disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            dir="rtl"
            autoFocus
          />

          {!submitted ? (
            <Button onClick={submitAnswer} disabled={!answer.trim()} className="w-full" size="lg">
              تأكيد الإجابة ✨
            </Button>
          ) : (
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-center text-sm font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              ✅ تم تأكيد إجابتك ({answer}). في انتظار باقي اللاعبين...
            </div>
          )}
        </div>
      ) : (
        <div className="w-full max-w-md rounded-3xl border-2 border-amber-400 bg-amber-50 p-6 text-center shadow-lg dark:border-amber-600 dark:bg-amber-950/40 animate-scale-in">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400">الدولة الصحيحة هي:</p>
          <h3 className="mt-1 text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
            {gameData.currentQuestion.flag} {gameData.currentQuestion.country}
          </h3>

          {/* Reveal Answers List */}
          <div className="mt-4 space-y-2 text-right">
            <p className="text-xs font-bold text-zinc-500">إجابات اللاعبين:</p>
            {Object.entries(gameData.players).map(([uid, p]) => {
              const playerAns = gameData.answers[uid];
              const isCorrect = playerAns ? isCountryMatch(playerAns, gameData.currentQuestion) : false;

              return (
                <div
                  key={uid}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold ${
                    isCorrect
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{p.photoURL || "👤"}</span>
                    <span>{p.name}:</span>
                    <span>{playerAns || "لم يجب"}</span>
                  </div>
                  <span>{isCorrect ? "+10 نقاط ✅" : "❌"}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress count */}
      <div className="text-xs font-bold text-zinc-400">
        أجاب {answeredCount} من {totalPlayersCount} لاعب
      </div>
    </div>
  );
}
