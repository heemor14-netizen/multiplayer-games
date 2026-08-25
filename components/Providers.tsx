"use client";

import { type ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { RoomProvider } from "@/contexts/RoomContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <RoomProvider>{children}</RoomProvider>
    </AuthProvider>
  );
}
