"use client";

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./firebase-config";

let _app: ReturnType<typeof initializeApp> | null = null;

function getAppInstance() {
  if (!_app) {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return _app;
}

let _auth: ReturnType<typeof getAuth> | null = null;
let _rtdb: ReturnType<typeof getDatabase> | null = null;
let _firestore: ReturnType<typeof getFirestore> | null = null;

export function getFirebaseAuth() {
  if (!_auth) _auth = getAuth(getAppInstance());
  return _auth;
}

export function getFirebaseRTDB() {
  if (!_rtdb) _rtdb = getDatabase(getAppInstance());
  return _rtdb;
}

export function getFirebaseFirestore() {
  if (!_firestore) _firestore = getFirestore(getAppInstance());
  return _firestore;
}
