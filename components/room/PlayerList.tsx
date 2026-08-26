"use client";

import type { RoomPlayer } from "@/types/room";

interface PlayerListProps {
  players: Record<string, RoomPlayer>;
  hostUid: string;
  currentUid: string;
  onKick?: (uid: string) => void;
  onAddBot?: () => void;
  onRemoveBot?: (uid: string) => void;
}

export function PlayerList({
  players,
  hostUid,
  currentUid,
  onKick,
  onAddBot,
  onRemoveBot,
}: PlayerListProps) {
  const playerList = Object.values(players);
  const isHost = hostUid === currentUid;

  return (
    <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/80 p-5 shadow-lg backdrop-blur-sm dark:bg-zinc-900/80">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">
          👥 اللاعبون الموجدون ({playerList.length})
        </span>

        {isHost && onAddBot && (
          <button
            onClick={onAddBot}
            className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 transition-all hover:bg-purple-100 active:scale-95 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300"
          >
            <span>🤖 إضافة لاعب آلي (بوت)</span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {playerList.map((player) => {
          const isCurrentPlayer = player.uid === currentUid;
          const isPlayerHost = player.uid === hostUid;
          const isBot = Boolean(player.isBot);

          return (
            <div
              key={player.uid}
              className={`flex items-center justify-between rounded-2xl border p-3.5 transition-all ${
                isCurrentPlayer
                  ? "border-orange-300 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20"
                  : "border-zinc-100 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-800/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl gradient-primary text-2xl shadow-md shadow-orange-500/20">
                  {player.photoURL || (isBot ? "🤖" : "👤")}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                      {player.name}
                    </span>
                    {isCurrentPlayer && (
                      <span className="rounded-md bg-zinc-200 px-1.5 py-0.5 text-[10px] font-bold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                        أنت
                      </span>
                    )}
                  </div>

                  <div className="mt-0.5 flex items-center gap-1.5">
                    {isPlayerHost && (
                      <span className="rounded-lg bg-orange-100 px-2 py-0.5 text-[10px] font-extrabold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                        👑 قائد الغرفة
                      </span>
                    )}
                    {isBot && (
                      <span className="rounded-lg bg-purple-100 px-2 py-0.5 text-[10px] font-extrabold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                        🤖 ذكاء اصطناعي
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-orange-600 dark:text-orange-400">
                  {player.score || 0} نقطة
                </span>

                {isHost && !isCurrentPlayer && (
                  <>
                    {isBot && onRemoveBot ? (
                      <button
                        onClick={() => onRemoveBot(player.uid)}
                        className="rounded-xl bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-700 transition-colors hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300"
                      >
                        حذف
                      </button>
                    ) : onKick ? (
                      <button
                        onClick={() => onKick(player.uid)}
                        className="rounded-xl bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 transition-colors hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400"
                      >
                        طرد
                      </button>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
