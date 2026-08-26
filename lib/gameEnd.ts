import { SyncDB } from "./syncEngine";
import type { UserProfile } from "@/types/user";

export async function persistScores(
  scores: Record<string, unknown>,
  players: Record<string, { name: string; isBot?: boolean }>
) {
  for (const [uid, raw] of Object.entries(scores)) {
    if (players[uid]?.isBot) continue; // Skip bot score persistence

    let total = 0;
    if (typeof raw === "number") {
      total = raw;
    } else if (typeof raw === "object" && raw !== null) {
      total = Object.values(raw as Record<string, number>).reduce(
        (a, b) => a + (typeof b === "number" ? b : 0),
        0
      );
    }

    if (players[uid]) {
      const userProf = (await SyncDB.get(`users/${uid}`)) as UserProfile | null;
      if (userProf) {
        await SyncDB.update(`users/${uid}`, {
          totalScore: (userProf.totalScore || 0) + total,
          gamesPlayed: (userProf.gamesPlayed || 0) + 1,
          displayName: players[uid].name || userProf.displayName,
        });
      }
    }
  }
}
