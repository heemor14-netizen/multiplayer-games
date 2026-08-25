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
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        اللعبة المحددة
      </span>
      <div className="grid grid-cols-2 gap-2">
        {Object.values(GAMES).map((game) => (
          <button
            key={game.id}
            onClick={() => onChange(game.id)}
            disabled={disabled}
            className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors
              ${
                currentGame === game.id
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
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
