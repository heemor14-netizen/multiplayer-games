"use client";

import { GAMES, type GameId } from "@/lib/constants";

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
    <div className="flex flex-col gap-2">
      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 sm:text-sm">
        اللعبة المحددة
      </span>
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
        {Object.values(GAMES).map((game) => (
          <button
            key={game.id}
            onClick={() => onChange(game.id)}
            disabled={disabled}
            className={`flex items-center gap-1.5 rounded-xl border-2 p-2.5 text-xs font-medium transition-all duration-200 sm:gap-2 sm:p-3 sm:text-sm
              ${
                currentGame === game.id
                  ? "border-orange-400 bg-orange-50 text-orange-700 shadow-md shadow-orange-500/10 dark:border-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            <span className="text-xl">{game.icon}</span>
            <span>{game.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
