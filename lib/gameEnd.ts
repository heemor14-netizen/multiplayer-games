import { getFirebaseRTDB } from "./firebase";
import { ref, update, increment } from "firebase/database";

export async function persistScores(
  scores: Record<string, unknown>,
  players: Record<string, { name: string }>
) {
  const db = getFirebaseRTDB();
  const updates: Record<string, unknown> = {};

  for (const [uid, raw] of Object.entries(scores)) {
    let total = 0;
    if (typeof raw === "number") {
      total = raw;
    } else if (typeof raw === "object" && raw !== null) {
      total = Object.values(raw as Record<string, number>).reduce(
        (a, b) => a + (typeof b === "number" ? b : 0),
        0
      );
    }

    if (players[uid] && total > 0) {
      updates[`users/${uid}/totalScore`] = increment(total);
      updates[`users/${uid}/gamesPlayed`] = increment(1);
      updates[`users/${uid}/displayName`] = players[uid].name;
    }
  }

  if (Object.keys(updates).length > 0) {
    await update(ref(db), updates);
  }
}
