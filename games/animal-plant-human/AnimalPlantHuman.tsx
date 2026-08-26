"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { SyncDB } from "@/lib/syncEngine";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { LETTERS, CATEGORIES, type Category, getDictionaryWords } from "./index";
import { sound } from "@/lib/sound";
import { launchConfetti } from "@/lib/confetti";
import { persistScores } from "@/lib/gameEnd";
import type { Room } from "@/types/room";

const ROUND_TIME = 35;
const REVEAL_TIME = 6;
const TOTAL_ROUNDS = 3;

interface GameData {
  round: number;
  totalRounds: number;
  currentLetter: string;
  timeLeft: number;
  status: "answering" | "revealing" | "finished";
  answers: Record<string, Record<Category, string>>;
  scores: Record<string, Record<Category, number>>;
  players: Record<string, { name: string; photoURL?: string | null; isBot?: boolean }>;
}

function normalizeWord(word: string): string {
  return word
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F]/g, "");
}

function isValidLetterStart(word: string, letter: string): boolean {
  if (!word || word.length < 2) return false;
  const normWord = normalizeWord(word);
  const normLetter = normalizeWord(letter);

  // Handle "ال" prefix
  if (normWord.startsWith("ال") && normWord.length > 2) {
    return normWord.charAt(2) === normLetter;
  }
  return normWord.startsWith(normLetter);
}

export default function AnimalPlantHuman({ roomId }: { roomId: string }) {
  const { user } = useAuth();
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [answers, setAnswers] = useState<Record<Category, string>>({
    إنسان: "",
    نبات: "",
    حيوان: "",
    جماد: "",
    بلاد: "",
  });
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
        setGameData(room.gameState as unknown as GameData);
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

      await SyncDB.set(`rooms/${roomId}/gameState`, initial);
      sound.playGameStart();
    };

    initHostGame();
  }, [isHost, gameData, roomId]);

  // Round progression and scoring (Host only)
  const calculateScores = useCallback(
    async (currentGameData: GameData) => {
      const snap = (await SyncDB.get(`rooms/${roomId}/gameState/answers`)) as Record<
        string,
        Record<Category, string>
      > | null;
      const allAnswers = snap || {};
      const newScores: Record<string, Record<Category, number>> = {};

      for (const uid of Object.keys(currentGameData.players)) {
        newScores[uid] = { إنسان: 0, نبات: 0, حيوان: 0, جماد: 0, بلاد: 0 };
      }

      const letter = currentGameData.currentLetter;

      for (const category of CATEGORIES) {
        const categoryAnswers: Record<string, string> = {};
        for (const [uid, ans] of Object.entries(allAnswers)) {
          const val = ans?.[category];
          if (val && isValidLetterStart(val, letter)) {
            categoryAnswers[uid] = normalizeWord(val);
          }
        }

        const answerCounts: Record<string, number> = {};
        for (const ans of Object.values(categoryAnswers)) {
          answerCounts[ans] = (answerCounts[ans] || 0) + 1;
        }

        for (const [uid, ans] of Object.entries(categoryAnswers)) {
          if (answerCounts[ans] === 1) {
            newScores[uid][category] = 10;
          } else {
            newScores[uid][category] = 5;
          }
        }
      }

      await SyncDB.update(`rooms/${roomId}/gameState`, { scores: newScores });
    },
    [roomId]
  );

  const nextRound = useCallback(
    async (currentGameData: GameData) => {
      const nextRoundNum = currentGameData.round + 1;

      if (nextRoundNum > currentGameData.totalRounds) {
        // Calculate cumulative score for persisting
        const cumScores: Record<string, number> = {};
        for (const [uid, catScores] of Object.entries(currentGameData.scores || {})) {
          cumScores[uid] = Object.values(catScores).reduce((a, b) => a + b, 0);
        }
        await persistScores(cumScores, currentGameData.players);
        await SyncDB.update(`rooms/${roomId}/gameState`, { status: "finished" });
        await SyncDB.update(`rooms/${roomId}/metadata`, { status: "finished" });
        return;
      }

      const nextLetter = LETTERS[Math.floor(Math.random() * LETTERS.length)];

      await SyncDB.update(`rooms/${roomId}/gameState`, {
        round: nextRoundNum,
        currentLetter: nextLetter,
        timeLeft: ROUND_TIME,
        status: "answering",
        answers: {},
      });

      setAnswers({ إنسان: "", نبات: "", حيوان: "", جماد: "", بلاد: "" });
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
        const delay = Math.random() * 10000 + 4000;
        setTimeout(async () => {
          const letter = gameData.currentLetter;
          const botAns: Record<Category, string> = {
            إنسان: "",
            نبات: "",
            حيوان: "",
            جماد: "",
            بلاد: "",
          };

          for (const cat of CATEGORIES) {
            const list = getDictionaryWords(letter, cat);
            if (list && list.length > 0) {
              botAns[cat] = list[Math.floor(Math.random() * list.length)];
            }
          }

          await SyncDB.update(`rooms/${roomId}/gameState/answers`, {
            [botUid]: botAns,
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

  const submitAnswers = async () => {
    if (!user || submitted || gameData?.status !== "answering") return;

    setSubmitted(true);
    sound.playCorrect();

    await SyncDB.update(`rooms/${roomId}/gameState/answers`, {
      [user.uid]: answers,
    });
  };

  if (!gameData) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <p className="text-base font-bold text-zinc-600 dark:text-zinc-400">جاري اختيار الحرف...</p>
      </div>
    );
  }

  if (gameData.status === "finished") {
    const totalScores: Record<string, number> = {};
    for (const [uid, scores] of Object.entries(gameData.scores || {})) {
      totalScores[uid] = Object.values(scores).reduce((a, b) => a + b, 0);
    }
    const sorted = Object.entries(totalScores).sort(([, a], [, b]) => b - a);

    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 p-4 animate-scale-in">
        <span className="text-6xl sm:text-7xl animate-bounce">🏆</span>
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gradient sm:text-4xl">النتائج النهائية</h1>
          <p className="mt-1 text-sm font-medium text-zinc-500">لعبة إنسان نبات حيوان 🌿</p>
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
        <span className="rounded-xl gradient-primary px-3 py-1 text-xs font-extrabold text-white">
          الجولة {gameData.round} / {gameData.totalRounds}
        </span>

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
            gameData.timeLeft <= 5 ? "bg-red-500" : "bg-gradient-to-r from-emerald-500 to-teal-400"
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Letter Banner */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">الحرف المطلوب</span>
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl gradient-primary text-5xl font-black text-white shadow-xl shadow-orange-500/30 sm:h-24 sm:w-24 sm:text-6xl animate-scale-in">
          {gameData.currentLetter}
        </div>
      </div>

      {/* Inputs or Revealing */}
      {!isRevealing ? (
        <div className="w-full max-w-lg space-y-3">
          {CATEGORIES.map((cat) => {
            const icon =
              cat === "إنسان" ? "👤" : cat === "نبات" ? "🌿" : cat === "حيوان" ? "🐾" : cat === "جماد" ? "📦" : "🌍";

            return (
              <div key={cat} className="flex items-center gap-2">
                <span className="w-20 text-sm font-bold text-zinc-700 dark:text-zinc-300">
                  {icon} {cat}
                </span>
                <input
                  value={answers[cat]}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [cat]: e.target.value }))}
                  disabled={submitted}
                  placeholder={`يبدأ بحرف (${gameData.currentLetter})...`}
                  className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-bold text-zinc-900 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  dir="rtl"
                />
              </div>
            );
          })}

          {!submitted ? (
            <Button onClick={submitAnswers} className="mt-4 w-full" size="lg">
              تأكيد وإرسال الإجابات 🚀
            </Button>
          ) : (
            <div className="mt-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-center text-sm font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              ✅ تم تأكيد إجاباتك بنجاح! في انتظار باقي اللاعبين أو انتهاء الوقت...
            </div>
          )}
        </div>
      ) : (
        <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-white/90 p-5 shadow-xl backdrop-blur-md dark:bg-zinc-900/90 animate-scale-in">
          <h3 className="mb-4 text-center text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
            إجابات ونقاط الجولة (حرف {gameData.currentLetter})
          </h3>

          <div className="space-y-4">
            {CATEGORIES.map((cat) => (
              <div key={cat} className="rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-800/60">
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">{cat}</span>
                <div className="mt-1 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {Object.entries(gameData.players).map(([uid, p]) => {
                    const ans = gameData.answers[uid]?.[cat] || "—";
                    const score = gameData.scores?.[uid]?.[cat] || 0;

                    return (
                      <div key={uid} className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold shadow-sm dark:bg-zinc-800">
                        <span className="text-zinc-600 dark:text-zinc-400">
                          {p.name}: <span className="text-zinc-900 dark:text-zinc-100">{ans}</span>
                        </span>
                        <span className={score > 0 ? "text-emerald-600 font-extrabold" : "text-zinc-400"}>
                          +{score}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
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
