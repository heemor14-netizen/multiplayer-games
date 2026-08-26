"use client";

import { GAMES, type GameId } from "@/lib/constants";
import { sound } from "@/lib/sound";

interface GameSelectorProps {
  currentGame: GameId;
  onChange: (game: GameId) => void;
  disabled?: boolean;
}

export function GameSelector({
  currentGame,
  onChange,
  disabled,
}: GameSelectorProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300">
        اختر اللعبة المطلوبة:
      </span>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {Object.values(GAMES).map((game) => {
          const isSelected = currentGame === game.id;
          return (
            <button
              key={game.id}
              onClick={() => {
                sound.playClick();
                onChange(game.id as GameId);
              }}
              disabled={disabled}
              className={`group relative flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3.5 text-center transition-all duration-200 ${
                isSelected
                  ? "border-orange-500 bg-orange-50/80 text-orange-800 shadow-md shadow-orange-500/15 dark:border-orange-500 dark:bg-orange-950/40 dark:text-orange-200"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-orange-300 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300"
              } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:-translate-y-0.5 active:scale-[0.98]"}`}
            >
              <span className="text-3xl transition-transform duration-200 group-hover:scale-110">
                {game.icon}
              </span>
              <span className="text-xs font-extrabold">{game.name}</span>
              <span className="rounded-md bg-black/5 px-2 py-0.5 text-[10px] font-bold opacity-75 dark:bg-white/10">
                {game.badge}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
