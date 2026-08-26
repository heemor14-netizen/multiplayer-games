"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "accent";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variants = {
  primary:
    "gradient-brand text-white shadow-brand hover:brightness-110 hover:shadow-[var(--shadow-brand)] active:scale-[0.97]",
  secondary:
    "border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-card hover:border-orange-400/40 hover:shadow-card-hover active:scale-[0.97]",
  danger:
    "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/25 hover:brightness-110 hover:shadow-xl active:scale-[0.97]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] active:scale-[0.97]",
  accent:
    "gradient-accent text-white shadow-lg shadow-purple-500/25 hover:brightness-110 active:scale-[0.97]",
};

const sizes = {
  sm: "px-3.5 py-1.5 text-xs rounded-xl",
  md: "px-5 py-2.5 text-sm rounded-2xl",
  lg: "px-7 py-3.5 text-sm rounded-2xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      className = "",
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 font-extrabold tracking-wide transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]
          disabled:pointer-events-none disabled:opacity-40
          ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {loading && (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
