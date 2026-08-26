"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getDatabase, type Database } from "firebase/database";
import { getFirestore, type Firestore } from "firebase/firestore";
import { firebaseConfig } from "./firebase-config";

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "undefined" &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== "undefined" &&
    firebaseConfig.databaseURL &&
    firebaseConfig.databaseURL !== "undefined"
  );
}

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _rtdb: Database | null = null;
let _firestore: Firestore | null = null;

function getAppInstance(): FirebaseApp | null {
  if (typeof window === "undefined") return null;
  if (!isFirebaseConfigured()) return null;

  if (!_app) {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (!_auth) {
    const app = getAppInstance();
    if (app) {
      _auth = getAuth(app);
    }
  }
  return _auth as Auth;
}

export function getFirebaseRTDB(): Database {
  if (!_rtdb) {
    const app = getAppInstance();
    if (app) {
      _rtdb = getDatabase(app);
    }
  }
  return _rtdb as Database;
}

export function getFirebaseFirestore(): Firestore {
  if (!_firestore) {
    const app = getAppInstance();
    if (app) {
      _firestore = getFirestore(app);
    }
  }
  return _firestore as Firestore;
}
