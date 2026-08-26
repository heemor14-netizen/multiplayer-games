"use client";

import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-extrabold text-[var(--text-secondary)] tracking-wide uppercase">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full rounded-2xl border bg-[var(--bg-card)] px-4 py-3 text-sm font-medium text-[var(--text-primary)]
            placeholder:text-[var(--text-muted)] placeholder:font-normal
            transition-all duration-200
            focus:outline-none
            focus:border-orange-500/60
            focus:shadow-[0_0_0_3px_rgba(249,115,22,0.15)]
            ${error
              ? "border-red-500/50 focus:border-red-500/70 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]"
              : "border-[var(--border-strong)] hover:border-[var(--border-strong)]"
            }
            ${className}`}
          {...props}
        />
        {hint && !error && (
          <p className="text-[11px] font-medium text-[var(--text-muted)]">{hint}</p>
        )}
        {error && (
          <p className="flex items-center gap-1 text-xs font-bold text-red-500">
            <span>⚠️</span> {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
