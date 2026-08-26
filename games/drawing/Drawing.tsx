"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { SyncDB } from "@/lib/syncEngine";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { DRAW_WORDS, type DrawingState, type GuessEntry } from "./index";
import { sound } from "@/lib/sound";
import { launchConfetti } from "@/lib/confetti";
import { persistScores } from "@/lib/gameEnd";
import type { Room } from "@/types/room";

const DRAW_TIME = 60;
const ROUND_END_TIME = 4;
const TOTAL_ROUNDS = 3;

const PALETTE = [
  "#000000",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
  "#78350f",
];

export default function Drawing({ roomId }: { roomId: string }) {
  const { user } = useAuth();
  const [gameData, setGameData] = useState<DrawingState | null>(null);
  const [guess, setGuess] = useState("");
  const [isHost, setIsHost] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState("#000000");
  const [drawSize, setDrawSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const confettiFired = useRef(false);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to room updates
  useEffect(() => {
    const unsub = SyncDB.subscribe(`rooms/${roomId}`, (data) => {
      const room = data as Room | null;
      if (!room) return;

      setIsHost(room.metadata.host === user?.uid);

      if (room.gameState) {
        const state = room.gameState as unknown as DrawingState;
        setGameData(state);

        // Update canvas image if we are not the drawer
        if (state.currentDrawer !== user?.uid && state.drawingData && canvasRef.current) {
          const img = new Image();
          img.onload = () => {
            const ctx = canvasRef.current?.getContext("2d");
            if (ctx && canvasRef.current) {
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
              ctx.drawImage(img, 0, 0);
            }
          };
          img.src = state.drawingData;
        }
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
      const playerUids = Object.keys(room.players);
      for (const [uid, p] of Object.entries(room.players)) {
        players[uid] = { name: p.name, photoURL: p.photoURL, isBot: p.isBot };
      }

      const firstDrawer = playerUids[0];
      const word = DRAW_WORDS[Math.floor(Math.random() * DRAW_WORDS.length)];

      const initial: DrawingState = {
        currentRound: 1,
        totalRounds: TOTAL_ROUNDS,
        currentDrawer: firstDrawer,
        currentWord: word,
        timeLeft: DRAW_TIME,
        status: "drawing",
        guesses: [],
        scores: Object.fromEntries(playerUids.map((k) => [k, 0])),
        players,
        correctGuessers: [],
        drawingData: "",
      };

      await SyncDB.set(`rooms/${roomId}/gameState`, initial);
      sound.playGameStart();
    };

    initHostGame();
  }, [isHost, gameData, roomId]);

  // Round progression (Host only)
  const nextRound = useCallback(
    async (currentData: DrawingState) => {
      const nextRoundNum = currentData.currentRound + 1;

      if (nextRoundNum > currentData.totalRounds) {
        await persistScores(currentData.scores, currentData.players);
        await SyncDB.update(`rooms/${roomId}/gameState`, { status: "finished" });
        await SyncDB.update(`rooms/${roomId}/metadata`, { status: "finished" });
        return;
      }

      const playerUids = Object.keys(currentData.players);
      const currentIdx = playerUids.indexOf(currentData.currentDrawer);
      const nextDrawer = playerUids[(currentIdx + 1) % playerUids.length];
      const word = DRAW_WORDS[Math.floor(Math.random() * DRAW_WORDS.length)];

      // Clear canvas locally
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }

      await SyncDB.update(`rooms/${roomId}/gameState`, {
        currentRound: nextRoundNum,
        currentDrawer: nextDrawer,
        currentWord: word,
        timeLeft: DRAW_TIME,
        status: "drawing",
        guesses: [],
        correctGuessers: [],
        drawingData: "",
      });

      setGuess("");
    },
    [roomId]
  );

  // Timer interval (Host drives timer)
  useEffect(() => {
    if (!isHost || !gameData || gameData.status !== "drawing") return;

    const interval = setInterval(async () => {
      if (gameData.timeLeft <= 1) {
        clearInterval(interval);
        sound.playTick();
        await SyncDB.update(`rooms/${roomId}/gameState`, {
          status: "round-end",
          timeLeft: ROUND_END_TIME,
        });
      } else {
        if (gameData.timeLeft <= 5) {
          sound.playTick();
        }
        await SyncDB.update(`rooms/${roomId}/gameState`, {
          timeLeft: gameData.timeLeft - 1,
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isHost, gameData, roomId]);

  // Round end timeout
  useEffect(() => {
    if (!isHost || !gameData || gameData.status !== "round-end") return;

    const timeout = setTimeout(async () => {
      await nextRound(gameData);
    }, ROUND_END_TIME * 1000);

    return () => clearTimeout(timeout);
  }, [isHost, gameData, nextRound]);

  // Bot simulation (Bots guess when not drawing, or draw simple shapes if drawing)
  useEffect(() => {
    if (!isHost || !gameData || gameData.status !== "drawing") return;

    const bots = Object.entries(gameData.players).filter(([uid, p]) => p.isBot && uid !== gameData.currentDrawer);
    if (bots.length === 0) return;

    bots.forEach(([botUid, botPlayer]) => {
      if (!gameData.correctGuessers.includes(botUid)) {
        const delay = Math.random() * 20000 + 8000;
        setTimeout(async () => {
          const isCorrect = Math.random() < 0.7;
          const guessText = isCorrect
            ? gameData.currentWord
            : DRAW_WORDS[Math.floor(Math.random() * DRAW_WORDS.length)];

          const newGuesses = [
            ...(gameData.guesses || []),
            {
              uid: botUid,
              name: botPlayer.name,
              text: guessText,
              correct: isCorrect,
              timestamp: Date.now(),
            },
          ];

          const updates: Record<string, unknown> = {
            guesses: newGuesses,
          };

          if (isCorrect) {
            const newCorrect = [...gameData.correctGuessers, botUid];
            const drawerScore = (gameData.scores[gameData.currentDrawer] || 0) + 5;
            const guesserScore = (gameData.scores[botUid] || 0) + 10;

            updates.correctGuessers = newCorrect;
            updates[`scores/${gameData.currentDrawer}`] = drawerScore;
            updates[`scores/${botUid}`] = guesserScore;

            if (newCorrect.length >= Object.keys(gameData.players).length - 1) {
              updates.status = "round-end";
              updates.timeLeft = ROUND_END_TIME;
            }
          }

          await SyncDB.update(`rooms/${roomId}/gameState`, updates);
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

  // Drawing Canvas Handlers
  const isDrawer = user?.uid === gameData?.currentDrawer;

  const saveCanvasData = useCallback(async () => {
    if (!canvasRef.current || !isDrawer) return;
    const dataUrl = canvasRef.current.toDataURL("image/webp", 0.6);
    await SyncDB.update(`rooms/${roomId}/gameState`, { drawingData: dataUrl });
  }, [isDrawer, roomId]);

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawer || gameData?.status !== "drawing") return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    lastPos.current = {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawer || !canvasRef.current || !lastPos.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.strokeStyle = isEraser ? "#ffffff" : drawColor;
    ctx.lineWidth = isEraser ? drawSize * 3 : drawSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastPos.current = { x, y };

    // Debounced sync to other players
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveCanvasData();
    }, 250);
  };

  const stopDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPos.current = null;
    saveCanvasData();
  };

  const clearCanvas = async () => {
    if (!canvasRef.current || !isDrawer) return;
    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    sound.playClick();
    await saveCanvasData();
  };

  const submitGuess = async () => {
    if (!user || !gameData || !guess.trim() || isDrawer || gameData.status !== "drawing") return;
    if (gameData.correctGuessers.includes(user.uid)) return;

    const trimmed = guess.trim();
    const isCorrect = trimmed === gameData.currentWord;

    if (isCorrect) {
      sound.playCorrect();
    } else {
      sound.playMessage();
    }

    const newGuess: GuessEntry = {
      uid: user.uid,
      name: gameData.players[user.uid]?.name || "لاعب",
      text: trimmed,
      correct: isCorrect,
      timestamp: Date.now(),
    };

    const newGuesses = [...(gameData.guesses || []), newGuess];
    const updates: Record<string, unknown> = {
      guesses: newGuesses,
    };

    if (isCorrect) {
      const newCorrect = [...gameData.correctGuessers, user.uid];
      const drawerScore = (gameData.scores[gameData.currentDrawer] || 0) + 5;
      const guesserScore = (gameData.scores[user.uid] || 0) + 10;

      updates.correctGuessers = newCorrect;
      updates[`scores/${gameData.currentDrawer}`] = drawerScore;
      updates[`scores/${user.uid}`] = guesserScore;

      if (newCorrect.length >= Object.keys(gameData.players).length - 1) {
        updates.status = "round-end";
        updates.timeLeft = ROUND_END_TIME;
      }
    }

    await SyncDB.update(`rooms/${roomId}/gameState`, updates);
    setGuess("");
  };

  if (!gameData) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
        <p className="text-base font-bold text-zinc-600 dark:text-zinc-400">جاري تجهيز لوحة الرسم...</p>
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
          <p className="mt-1 text-sm font-medium text-zinc-500">لعبة الرسم والتخمين 🎨</p>
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

  const drawerPlayer = gameData.players[gameData.currentDrawer];
  const hasGuessedCorrectly = user && gameData.correctGuessers.includes(user.uid);
  const progressPercent = (gameData.timeLeft / DRAW_TIME) * 100;

  // Masked word hint (e.g. "_ _ _ _ (4 أحرف)")
  const wordHint = gameData.currentWord
    .split("")
    .map(() => "_")
    .join(" ") + ` (${gameData.currentWord.length} حروف)`;

  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 p-3 sm:p-6">
      {/* Top Bar */}
      <div className="flex w-full items-center justify-between rounded-2xl border border-white/20 bg-white/80 p-3.5 shadow-md backdrop-blur-sm dark:bg-zinc-900/80">
        <div className="flex items-center gap-2">
          <span className="rounded-xl gradient-primary px-3 py-1 text-xs font-extrabold text-white">
            الجولة {gameData.currentRound} / {gameData.totalRounds}
          </span>
          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
            الراسم: <strong className="text-purple-600 dark:text-purple-400">{drawerPlayer?.name || "اللاعب"}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-sm font-bold">
          <span>⏳</span>
          <span className={gameData.timeLeft <= 5 ? "animate-pulse text-red-500 font-extrabold text-lg" : "text-zinc-700 dark:text-zinc-300"}>
            {gameData.timeLeft}s
          </span>
        </div>
      </div>

      {/* Timer Progress */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`h-full transition-all duration-1000 ${
            gameData.timeLeft <= 5 ? "bg-red-500" : "bg-gradient-to-r from-purple-500 to-pink-500"
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Secret Word or Guess Hint */}
      <div className="flex w-full items-center justify-center rounded-2xl border border-purple-200 bg-purple-50/80 p-3 text-center dark:border-purple-900 dark:bg-purple-950/40">
        {isDrawer ? (
          <div>
            <span className="text-xs font-bold text-purple-700 dark:text-purple-300">الكلمة المطلوب رسمها: </span>
            <span className="text-xl font-extrabold text-purple-900 dark:text-purple-100">{gameData.currentWord}</span>
          </div>
        ) : hasGuessedCorrectly ? (
          <div className="text-emerald-700 dark:text-emerald-300 font-bold">
            🎉 أحسنت! لقد خمنت الكلمة بنجاح ({gameData.currentWord})
          </div>
        ) : (
          <div>
            <span className="text-xs font-bold text-purple-700 dark:text-purple-300">خمّن الكلمة: </span>
            <span className="font-mono text-lg font-extrabold tracking-widest text-purple-900 dark:text-purple-100">
              {wordHint}
            </span>
          </div>
        )}
      </div>

      {/* Main Drawing & Chat Grid */}
      <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Canvas Area */}
        <div className="flex flex-col items-center gap-3 lg:col-span-2">
          {/* Drawer Tools Bar */}
          {isDrawer && gameData.status === "drawing" && (
            <div className="flex w-full flex-wrap items-center justify-between gap-2 rounded-2xl border border-zinc-200 bg-white/90 p-2.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90">
              {/* Palette */}
              <div className="flex flex-wrap items-center gap-1.5">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setDrawColor(c);
                      setIsEraser(false);
                    }}
                    className={`h-7 w-7 rounded-full border-2 transition-transform ${
                      drawColor === c && !isEraser ? "scale-125 border-purple-500 shadow-md" : "border-zinc-300"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              {/* Sizes & Eraser & Clear */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEraser(!isEraser)}
                  className={`rounded-xl px-2.5 py-1 text-xs font-bold transition-all ${
                    isEraser
                      ? "bg-purple-600 text-white"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  🧹 ممحاة
                </button>

                <select
                  value={drawSize}
                  onChange={(e) => setDrawSize(Number(e.target.value))}
                  className="rounded-xl border border-zinc-300 bg-white px-2 py-1 text-xs font-bold dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <option value={2}>رفيع</option>
                  <option value={5}>متوسط</option>
                  <option value={10}>عريض</option>
                  <option value={18}>كبير جداً</option>
                </select>

                <button
                  onClick={clearCanvas}
                  className="rounded-xl bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300"
                >
                  مسح اللوحة
                </button>
              </div>
            </div>
          )}

          {/* Canvas Element */}
          <div className="relative w-full overflow-hidden rounded-3xl border-2 border-zinc-300 bg-white shadow-xl dark:border-zinc-700">
            <canvas
              ref={canvasRef}
              width={600}
              height={420}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
              className={`h-[320px] w-full touch-none sm:h-[400px] ${
                isDrawer && gameData.status === "drawing" ? (isEraser ? "cursor-cell" : "cursor-crosshair") : "cursor-default"
              }`}
            />

            {gameData.status === "round-end" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in text-center p-4">
                <span className="text-4xl">🎉</span>
                <p className="mt-2 text-sm font-bold text-zinc-300">انتهت الجولة! الكلمة كانت:</p>
                <h3 className="text-3xl font-extrabold text-white">{gameData.currentWord}</h3>
              </div>
            )}
          </div>
        </div>

        {/* Live Guesses Chat & Scoreboard */}
        <div className="flex flex-col gap-3">
          {/* Player list */}
          <div className="rounded-2xl border border-white/20 bg-white/80 p-3 shadow-md backdrop-blur-sm dark:bg-zinc-900/80">
            <h4 className="text-xs font-bold text-zinc-500 mb-2">المشاركون والنقاط:</h4>
            <div className="space-y-1.5">
              {Object.entries(gameData.players).map(([uid, p]) => {
                const isCurrentDrawer = uid === gameData.currentDrawer;
                const hasGuessed = gameData.correctGuessers.includes(uid);
                const score = gameData.scores[uid] || 0;

                return (
                  <div
                    key={uid}
                    className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-bold ${
                      hasGuessed
                        ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : isCurrentDrawer
                        ? "bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
                        : "bg-zinc-50 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{p.photoURL || "👤"}</span>
                      <span>{p.name}</span>
                      {isCurrentDrawer && <span className="text-[10px] bg-purple-200 px-1 rounded dark:bg-purple-900">راسم 🎨</span>}
                      {hasGuessed && <span className="text-[10px] text-emerald-600 font-extrabold">خمّن ✅</span>}
                    </div>
                    <span className="text-orange-600 dark:text-orange-400">{score} نقطة</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guesses Log */}
          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/80 shadow-md backdrop-blur-sm dark:bg-zinc-900/80 min-h-[220px]">
            <div className="border-b border-zinc-100 p-2.5 text-xs font-bold text-zinc-500 dark:border-zinc-800">
              💬 التخمينات المباشرة:
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 max-h-[200px]">
              {(gameData.guesses || []).length === 0 ? (
                <p className="text-center text-xs text-zinc-400 pt-6">لا توجد تخمينات بعد. اكتب تخمينك أدناه!</p>
              ) : (
                (gameData.guesses || []).map((g, i) => (
                  <div
                    key={i}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                      g.correct
                        ? "bg-emerald-100 text-emerald-800 font-black dark:bg-emerald-950/60 dark:text-emerald-200"
                        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    <span className="opacity-70">{g.name}: </span>
                    <span>{g.correct ? "خمن الكلمة الصحيحة! 🎉" : g.text}</span>
                  </div>
                ))
              )}
            </div>

            {/* Input Box for Guessers */}
            {!isDrawer && !hasGuessedCorrectly && gameData.status === "drawing" && (
              <div className="border-t border-zinc-100 p-2 flex gap-1.5 dark:border-zinc-800">
                <input
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitGuess()}
                  placeholder="اكتب تخمينك واضغط Enter..."
                  className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold focus:border-purple-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800"
                  dir="rtl"
                />
                <Button size="sm" onClick={submitGuess} disabled={!guess.trim()}>
                  إرسال
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
