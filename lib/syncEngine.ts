"use client";

import {
  ref,
  set as fbSet,
  get as fbGet,
  update as fbUpdate,
  remove as fbRemove,
  onValue as fbOnValue,
  off as fbOff,
  type DataSnapshot,
} from "firebase/database";
import { getFirebaseRTDB, isFirebaseConfigured } from "@/lib/firebase";
import { logger } from "@/lib/logger";

type ListenerCallback = (data: unknown) => void;

class LocalSyncEngine {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<string, Set<ListenerCallback>> = new Map();
  private storageKey = "multiplayer_games_local_db";

  constructor() {
    if (typeof window !== "undefined") {
      try {
        this.channel = new BroadcastChannel("multiplayer_games_sync_channel");
        this.channel.onmessage = (event) => {
          const { path, data } = event.data || {};
          if (path) {
            this.notifyListeners(path, data);
          }
        };
      } catch {
        // Fallback for environments without BroadcastChannel
      }

      window.addEventListener("storage", (e) => {
        if (e.key === this.storageKey && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            this.listeners.forEach((_, path) => {
              const val = this.getByPath(parsed, path);
              this.notifyListeners(path, val);
            });
          } catch {
            // Ignore parse errors
          }
        }
      });
    }
  }

  private getAllData(): Record<string, unknown> {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  private saveAllData(data: Record<string, unknown>) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      logger.error("Failed to save local db", e);
    }
  }

  private getByPath(root: Record<string, unknown>, path: string): unknown {
    const parts = path.split("/").filter(Boolean);
    let current: unknown = root;
    for (const p of parts) {
      if (current && typeof current === "object") {
        current = (current as Record<string, unknown>)[p];
      } else {
        return null;
      }
    }
    return current ?? null;
  }

  private setByPath(root: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
    const parts = path.split("/").filter(Boolean);
    if (parts.length === 0) return value as Record<string, unknown>;

    const copy = { ...root };
    let current: Record<string, unknown> = copy;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part] || typeof current[part] !== "object") {
        current[part] = {};
      } else {
        current[part] = { ...(current[part] as Record<string, unknown>) };
      }
      current = current[part] as Record<string, unknown>;
    }

    const lastPart = parts[parts.length - 1];
    if (value === null || value === undefined) {
      delete current[lastPart];
    } else {
      current[lastPart] = value;
    }

    return copy;
  }

  private notifyListeners(path: string, data: unknown) {
    // Notify exact match
    const exact = this.listeners.get(path);
    if (exact) {
      exact.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(e);
        }
      });
    }

    // Also notify prefix or parent listeners
    this.listeners.forEach((cbs, lPath) => {
      if (lPath !== path && (lPath.startsWith(path + "/") || path.startsWith(lPath + "/"))) {
        const root = this.getAllData();
        const val = this.getByPath(root, lPath);
        cbs.forEach((cb) => {
          try {
            cb(val);
          } catch (e) {
            console.error(e);
          }
        });
      }
    });
  }

  public async get(path: string): Promise<unknown> {
    const root = this.getAllData();
    return this.getByPath(root, path);
  }

  public async set(path: string, value: unknown): Promise<void> {
    const root = this.getAllData();
    const updated = this.setByPath(root, path, value);
    this.saveAllData(updated);
    this.notifyListeners(path, value);
    if (this.channel) {
      this.channel.postMessage({ path, data: value });
    }
  }

  public async update(path: string, updates: Record<string, unknown>): Promise<void> {
    const root = this.getAllData();
    let updated = { ...root };

    for (const [subPath, val] of Object.entries(updates)) {
      const fullPath = path ? `${path}/${subPath}` : subPath;
      updated = this.setByPath(updated, fullPath, val);
    }

    this.saveAllData(updated);
    const newVal = this.getByPath(updated, path);
    this.notifyListeners(path, newVal);

    if (this.channel) {
      this.channel.postMessage({ path, data: newVal });
    }
  }

  public async remove(path: string): Promise<void> {
    await this.set(path, null);
  }

  public subscribe(path: string, callback: ListenerCallback): () => void {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set());
    }
    this.listeners.get(path)!.add(callback);

    // Initial trigger
    const initial = this.getByPath(this.getAllData(), path);
    callback(initial);

    return () => {
      const s = this.listeners.get(path);
      if (s) {
        s.delete(callback);
        if (s.size === 0) this.listeners.delete(path);
      }
    };
  }
}

export const localSync = new LocalSyncEngine();

export class SyncDB {
  public static isRealFirebase(): boolean {
    return isFirebaseConfigured();
  }

  public static async get(path: string): Promise<unknown> {
    if (this.isRealFirebase()) {
      try {
        const snap = await fbGet(ref(getFirebaseRTDB(), path));
        return snap.exists() ? snap.val() : null;
      } catch (err) {
        logger.warn("Firebase get failed, falling back to local sync", err);
      }
    }
    return localSync.get(path);
  }

  public static async set(path: string, value: unknown): Promise<void> {
    if (this.isRealFirebase()) {
      try {
        await fbSet(ref(getFirebaseRTDB(), path), value);
        return;
      } catch (err) {
        logger.warn("Firebase set failed, falling back to local sync", err);
      }
    }
    await localSync.set(path, value);
  }

  public static async update(path: string, updates: Record<string, unknown>): Promise<void> {
    if (this.isRealFirebase()) {
      try {
        const targetRef = path ? ref(getFirebaseRTDB(), path) : ref(getFirebaseRTDB());
        await fbUpdate(targetRef, updates);
        return;
      } catch (err) {
        logger.warn("Firebase update failed, falling back to local sync", err);
      }
    }
    await localSync.update(path, updates);
  }

  public static async remove(path: string): Promise<void> {
    if (this.isRealFirebase()) {
      try {
        await fbRemove(ref(getFirebaseRTDB(), path));
        return;
      } catch (err) {
        logger.warn("Firebase remove failed, falling back to local sync", err);
      }
    }
    await localSync.remove(path);
  }

  public static subscribe(path: string, callback: (val: unknown) => void): () => void {
    if (this.isRealFirebase()) {
      try {
        const dbRef = ref(getFirebaseRTDB(), path);
        const unsub = fbOnValue(
          dbRef,
          (snapshot: DataSnapshot) => {
            callback(snapshot.exists() ? snapshot.val() : null);
          },
          (err) => {
            logger.warn("Firebase onValue failed, using local sync", err);
            localSync.subscribe(path, callback);
          }
        );
        return () => fbOff(dbRef, "value", unsub);
      } catch (err) {
        logger.warn("Firebase subscribe failed, using local sync", err);
      }
    }
    return localSync.subscribe(path, callback);
  }
}
