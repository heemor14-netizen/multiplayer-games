"use client";

import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm
            placeholder:text-zinc-400 transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400 focus:shadow-lg focus:shadow-orange-500/10
            dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100 dark:placeholder:text-zinc-500
            dark:focus:ring-orange-400/30 dark:focus:border-orange-400
            ${error ? "border-red-400 focus:ring-red-400/50 focus:border-red-400" : ""}
            ${className}`}
          {...props}
        />
        {error && <p className="text-xs font-medium text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
