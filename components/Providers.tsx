"use client";

import { type ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { RoomProvider } from "@/contexts/RoomContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RoomProvider>{children}</RoomProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
