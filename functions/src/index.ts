import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.database();

export const createRoom = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be authenticated"
    );
  }

  const { game } = data;

  if (!game) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Game type is required"
    );
  }

  const validGames = [
    "animal-plant-human",
    "guess-country",
    "drawing",
    "quiz",
  ];
  if (!validGames.includes(game)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Invalid game type"
    );
  }

  const roomId = generateRoomId();

  const room = {
    metadata: {
      host: context.auth.uid,
      game,
      status: "lobby",
      maxPlayers: 4,
      createdAt: admin.database.ServerValue.TIMESTAMP,
    },
    players: {
      [context.auth.uid]: {
        uid: context.auth.uid,
        name: context.auth.token.name || context.auth.token.email?.split("@")[0] || "Player",
        photoURL: context.auth.token.picture || null,
        score: 0,
        joinedAt: admin.database.ServerValue.TIMESTAMP,
      },
    },
    gameState: null,
    chat: {},
  };

  await db.ref(`rooms/${roomId}`).set(room);

  return { roomId };
});

export const kickPlayer = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be authenticated"
    );
  }

  const { roomId, targetUid } = data;

  if (!roomId || !targetUid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "roomId and targetUid are required"
    );
  }

  const roomSnap = await db.ref(`rooms/${roomId}`).once("value");
  const room = roomSnap.val();

  if (!room) {
    throw new functions.https.HttpsError("not-found", "Room not found");
  }

  if (room.metadata.host !== context.auth.uid) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only the host can kick players"
    );
  }

  if (targetUid === context.auth.uid) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Cannot kick yourself"
    );
  }

  await db.ref(`rooms/${roomId}/players/${targetUid}`).remove();

  await db.ref(`rooms/${roomId}/chat`).push({
    uid: "system",
    text: `تم طرد اللاعب`,
    timestamp: admin.database.ServerValue.TIMESTAMP,
  });

  return { success: true };
});

export const endGame = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Must be authenticated"
    );
  }

  const { roomId } = data;

  if (!roomId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "roomId is required"
    );
  }

  const roomSnap = await db.ref(`rooms/${roomId}`).once("value");
  const room = roomSnap.val();

  if (!room) {
    throw new functions.https.HttpsError("not-found", "Room not found");
  }

  if (room.metadata.host !== context.auth.uid) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only the host can end the game"
    );
  }

  const updates: Record<string, unknown> = {};

  updates[`rooms/${roomId}/metadata/status`] = "lobby";
  updates[`rooms/${roomId}/gameState`] = null;

  if (room.gameState?.scores) {
    for (const [uid, scores] of Object.entries(room.gameState.scores as Record<string, unknown>)) {
      let totalScore = 0;
      if (typeof scores === "number") {
        totalScore = scores;
      } else if (typeof scores === "object" && scores !== null) {
        totalScore = Object.values(scores as Record<string, number>).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
      }
      if (totalScore > 0) {
        updates[`users/${uid}/totalScore`] = admin.database.ServerValue.increment(totalScore);
        updates[`users/${uid}/gamesPlayed`] = admin.database.ServerValue.increment(1);
      }
    }
  }

  await db.ref().update(updates);

  return { success: true };
});

function generateRoomId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
