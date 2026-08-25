"use client";

import type { RoomPlayer } from "@/types/room";

interface PlayerListProps {
  players: Record<string, RoomPlayer>;
  hostUid: string;
  currentUid: string;
  onKick?: (uid: string) => void;
}

export function PlayerList({
  players,
  hostUid,
  currentUid,
  onKick,
}: PlayerListProps) {
  const playerList = Object.values(players);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/80 p-3 shadow-lg backdrop-blur-sm dark:bg-zinc-900/80 sm:p-5">
      <span className="mb-2 block text-xs font-bold text-zinc-700 dark:text-zinc-300 sm:mb-3 sm:text-sm">
        اللاعبون ({playerList.length})
      </span>
      <div className="flex flex-col gap-1.5 sm:gap-2">
        {playerList.map((player) => (
          <div
            key={player.uid}
            className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2 transition-all hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 sm:px-4 sm:py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl gradient-primary text-sm font-bold text-white shadow-md shadow-orange-500/20 sm:h-9 sm:w-9">
                {player.photoURL ? (
                  <img
                    src={player.photoURL}
                    alt=""
                    className="h-8 w-8 rounded-xl sm:h-9 sm:w-9"
                  />
                ) : (
                  player.name.charAt(0)
                )}
              </div>
              <div>
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {player.name}
                </span>
                {player.uid === hostUid && (
                  <span className="mr-2 inline-block rounded-lg bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                    قائد
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-orange-600 dark:text-orange-400">{player.score} نقطة</span>
              {hostUid === currentUid &&
                player.uid !== currentUid &&
                onKick && (
                  <button
                    onClick={() => onKick(player.uid)}
                    className="rounded-lg px-2 py-1 text-xs font-bold text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    طرد
                  </button>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
