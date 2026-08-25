"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  ref,
  set,
  get,
  update,
  onValue,
  off,
  push,
} from "firebase/database";
import { getFirebaseRTDB } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { DRAW_WORDS, type DrawingState } from "./index";
import { logger } from "@/lib/logger";
import { persistScores } from "@/lib/gameEnd";

const DRAW_TIME = 60;
const GUESS_TIME = 30;
const TOTAL_ROUNDS = 3;

export default function Drawing({ roomId }: { roomId: string }) {
  const { user } = useAuth();
  const [gameData, setGameData] = useState<DrawingState | null>(null);
  const [guess, setGuess] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState("#000000");
  const [drawSize, setDrawSize] = useState(4);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const nextRound = useCallback(async () => {
    if (!gameData) return;
    const db = getFirebaseRTDB();
    const nextRoundNum = gameData.currentRound + 1;

    if (nextRoundNum > gameData.totalRounds) {
      await update(ref(db, `rooms/${roomId}/gameState`), { status: "finished" });
      return;
    }

    const playerUids = Object.keys(gameData.players);
    const currentIdx = playerUids.indexOf(gameData.currentDrawer);
    const nextDrawer = playerUids[(currentIdx + 1) % playerUids.length];
    const word = DRAW_WORDS[Math.floor(Math.random() * DRAW_WORDS.length)];

    await update(ref(db, `rooms/${roomId}/gameState`), {
      currentRound: nextRoundNum,
      currentDrawer: nextDrawer,
      currentWord: word,
      timeLeft: DRAW_TIME,
      status: "drawing",
      guesses: {},
      correctGuessers: [],
      drawingData: "",
    });
  }, [gameData, roomId]);

  const gameRef = ref(getFirebaseRTDB(), `rooms/${roomId}/gameState`);

  useEffect(() => {
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setGameData(data as DrawingState);
        if (data.drawingData && canvasRef.current) {
          const img = new Image();
          img.onload = () => {
            const ctx = canvasRef.current?.getContext("2d");
            if (ctx) {
              ctx.clearRect(0, 0, 300, 300);
              ctx.drawImage(img, 0, 0);
            }
          };
          img.src = data.drawingData;
        }
      }
    });
    return () => off(gameRef, "value", unsubscribe);
  }, [roomId, gameRef]);

  const initGame = useCallback(async () => {
    const db = getFirebaseRTDB();
    const roomSnap = await get(ref(db, `rooms/${roomId}`));
    const room = roomSnap.val();
    if (!room) return;

    const players: Record<string, { name: string }> = {};
    const playerUids = Object.keys(room.players);
    for (const [uid, p] of Object.entries(room.players as Record<string, { name: string }>)) {
      players[uid] = { name: p.name };
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
      guesses: {},
      scores: {},
      players,
      correctGuessers: [],
      drawingData: "",
    };

    await set(ref(db, `rooms/${roomId}/gameState`), initial);
    logger.info("Drawing game started", { roomId });
  }, [roomId]);

  useEffect(() => {
    if (!gameData) return;
    if (gameData.status !== "drawing" && gameData.status !== "guessing") return;

    const interval = setInterval(() => {
      setGameData((prev) => {
        if (!prev) return prev;
        if (prev.timeLeft <= 1) {
          clearInterval(interval);
          if (prev.status === "drawing") {
            return { ...prev, timeLeft: GUESS_TIME, status: "guessing" };
          }
          return { ...prev, timeLeft: 0, status: "round-end" };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameData?.status, gameData?.currentRound]);

  useEffect(() => {
    if (!gameData || gameData.status !== "round-end") return;

    const timeout = setTimeout(async () => {
      await nextRound();
    }, 3000);

    return () => clearTimeout(timeout);
  }, [gameData?.status, gameData, nextRound]);

  const saveDrawing = async () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL();
    const db = getFirebaseRTDB();
    await update(ref(db, `rooms/${roomId}/gameState`), { drawingData: dataUrl });
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!gameData || gameData.currentDrawer !== user?.uid) return;
    if (gameData.status !== "drawing") return;
    setIsDrawing(true);
    const rect = e.currentTarget.getBoundingClientRect();
    lastPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current || !lastPos.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawSize;
    ctx.lineCap = "round";
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastPos.current = { x, y };
  };

  const stopDraw = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const submitGuess = async () => {
    if (!user || !gameData || !guess.trim()) return;
    if (gameData.currentDrawer === user.uid) return;

    const db = getFirebaseRTDB();
    const isCorrect = guess.trim() === gameData.currentWord;

    await push(ref(db, `rooms/${roomId}/gameState/guesses`), {
      uid: user.uid,
      text: guess.trim(),
      correct: isCorrect,
    });

    if (isCorrect) {
      const newCorrect = [...gameData.correctGuessers, user.uid];
      const drawerScore = (gameData.scores[gameData.currentDrawer] || 0) + 5;
      const guesserScore = (gameData.scores[user.uid] || 0) + 10;

      const updates: Record<string, unknown> = {
        correctGuessers: newCorrect,
        [`scores/${gameData.currentDrawer}`]: drawerScore,
        [`scores/${user.uid}`]: guesserScore,
      };

      if (newCorrect.length >= Object.keys(gameData.players).length - 1) {
        updates.status = "round-end";
        updates.timeLeft = 0;
      }

      await update(ref(db, `rooms/${roomId}/gameState`), updates);
    }

    setGuess("");
  };

  const endGame = async () => {
    if (!gameData) return;
    await persistScores(gameData.scores as Record<string, unknown>, gameData.players);
    const db = getFirebaseRTDB();
    await update(ref(db, `rooms/${roomId}/metadata`), { status: "finished" });
  };

  const isDrawer = user?.uid === gameData?.currentDrawer;

  if (!gameData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <span className="text-6xl">🎨</span>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">الرسم</h1>
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
    <div className="flex min-h-screen flex-col items-center gap-4 p-4 pt-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">🎨 الرسم</h1>
        <p className="text-sm text-zinc-500">
          الجولة {gameData.currentRound}/{gameData.totalRounds}
        </p>
        <p className="text-sm text-zinc-500">
          الراسم: {gameData.players[gameData.currentDrawer]?.name}
        </p>
      </div>

      {isDrawer && gameData.status === "drawing" && (
        <div className="rounded-lg bg-amber-100 px-4 py-2 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
          الكلمة: <span className="font-bold">{gameData.currentWord}</span>
        </div>
      )}

      {!isDrawer && gameData.status === "drawing" && (
        <div className="rounded-lg bg-blue-100 px-4 py-2 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
          الراسم يرسم... خمّن بعد انتهاء وقت الرسم
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="h-2 w-32 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className="h-full bg-emerald-600 transition-all"
            style={{ width: `${(gameData.timeLeft / (gameData.status === "drawing" ? DRAW_TIME : GUESS_TIME)) * 100}%` }}
          />
        </div>
        <span className="text-sm font-mono text-zinc-600 dark:text-zinc-400">{gameData.timeLeft}s</span>
      </div>

      <div className="flex flex-col items-center gap-4 lg:flex-row">
        <div className="flex flex-col items-center gap-2">
          {isDrawer && gameData.status === "drawing" && (
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={drawColor}
                onChange={(e) => setDrawColor(e.target.value)}
                className="h-8 w-8 cursor-pointer"
              />
              <input
                type="range"
                min={1}
                max={20}
                value={drawSize}
                onChange={(e) => setDrawSize(Number(e.target.value))}
                className="w-20"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const ctx = canvasRef.current?.getContext("2d");
                  ctx?.clearRect(0, 0, 300, 300);
                }}
              >
                مسح
              </Button>
              <Button size="sm" onClick={saveDrawing}>
                حفظ
              </Button>
            </div>
          )}

          <canvas
            ref={canvasRef}
            width={300}
            height={300}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            className={`rounded-xl border-2 border-zinc-300 bg-white dark:border-zinc-700 ${
              isDrawer && gameData.status === "drawing" ? "cursor-crosshair" : "cursor-default"
            }`}
          />
        </div>

        <div className="flex w-full max-w-sm flex-col gap-4">
          {gameData.status === "guessing" && !isDrawer && (
            <div className="flex gap-2">
              <input
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitGuess()}
                placeholder="ما الذي يرسمه؟"
                className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                dir="rtl"
              />
              <Button onClick={submitGuess} disabled={!guess.trim()}>
                خمّن
              </Button>
            </div>
          )}

          {gameData.status === "round-end" && (
            <div className="rounded-lg bg-emerald-50 p-4 text-center dark:bg-emerald-900/20">
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                الكلمة كانت: {gameData.currentWord}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">اللاعبون والنقاط</span>
            {Object.entries(gameData.players).map(([uid, p]) => (
              <div key={uid} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{p.name}</span>
                  {uid === gameData.currentDrawer && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">راسم</span>
                  )}
                  {gameData.correctGuessers.includes(uid) && (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">خمّن ✅</span>
                  )}
                </div>
                <span className="text-xs text-zinc-500">{gameData.scores[uid] || 0} نقطة</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
