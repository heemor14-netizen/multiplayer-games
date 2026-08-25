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
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        اللاعبون ({playerList.length})
      </span>
      <div className="flex flex-col gap-1">
        {playerList.map((player) => (
          <div
            key={player.uid}
            className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">
                {player.photoURL ? (
                  <img
                    src={player.photoURL}
                    alt=""
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  player.name.charAt(0)
                )}
              </div>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {player.name}
              </span>
              {player.uid === hostUid && (
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  قائد
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">{player.score} نقطة</span>
              {hostUid === currentUid &&
                player.uid !== currentUid &&
                onKick && (
                  <button
                    onClick={() => onKick(player.uid)}
                    className="rounded p-1 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
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
