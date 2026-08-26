"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile as fbUpdateProfile,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { SyncDB } from "@/lib/syncEngine";
import { logger } from "@/lib/logger";
import { getRandomAvatar } from "@/lib/avatars";
import type { UserProfile } from "@/types/user";

function translateAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code || "";
  const map: Record<string, string> = {
    "auth/user-not-found": "البريد الإلكتروني غير مسجل",
    "auth/wrong-password": "كلمة المرور غير صحيحة",
    "auth/email-already-in-use": "البريد الإلكتروني مستخدم بالفعل",
    "auth/invalid-email": "البريد الإلكتروني غير صالح",
    "auth/weak-password": "كلمة المرور ضعيفة (6 أحرف على الأقل)",
    "auth/too-many-requests": "محاولات كثيرة. حاول لاحقاً",
    "auth/popup-closed-by-user": "تم إغلاق نافذة تسجيل الدخول",
    "auth/network-request-failed": "خطأ في الاتصال بالشبكة",
  };
  return map[code] || (error instanceof Error ? error.message : "خطأ غير معروف");
}

interface AuthState {
  user: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null } | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: (name?: string, avatar?: string) => Promise<void>;
  updateAvatar: (avatar: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const GUEST_STORAGE_KEY = "multiplayer_guest_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState["user"]>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string, defaultName?: string, defaultAvatar?: string): Promise<UserProfile> => {
    const existing = (await SyncDB.get(`users/${uid}`)) as UserProfile | null;
    if (existing) {
      return existing;
    }

    const newProf: UserProfile = {
      uid,
      displayName: defaultName || "لاعب فكرة 💡",
      photoURL: defaultAvatar || getRandomAvatar(),
      totalScore: 0,
      gamesPlayed: 0,
      createdAt: Date.now(),
    };

    await SyncDB.set(`users/${uid}`, newProf);
    return newProf;
  }, []);

  useEffect(() => {
    if (isFirebaseConfigured()) {
      const auth = getFirebaseAuth();
      if (auth) {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
            });
            try {
              const p = await loadProfile(firebaseUser.uid, firebaseUser.displayName || undefined, firebaseUser.photoURL || undefined);
              setProfile(p);
            } catch (e) {
              logger.error("Failed to load profile", e);
            }
          } else {
            // Check local guest session
            const savedGuest = localStorage.getItem(GUEST_STORAGE_KEY);
            if (savedGuest) {
              try {
                const parsed = JSON.parse(savedGuest);
                setUser({ uid: parsed.uid, displayName: parsed.displayName, photoURL: parsed.photoURL });
                const p = await loadProfile(parsed.uid, parsed.displayName, parsed.photoURL);
                setProfile(p);
              } catch {
                setUser(null);
                setProfile(null);
              }
            } else {
              setUser(null);
              setProfile(null);
            }
          }
          setLoading(false);
        });
        return () => unsubscribe();
      }
    }

    // Local / Guest mode
    const savedGuest = typeof window !== "undefined" ? localStorage.getItem(GUEST_STORAGE_KEY) : null;
    if (savedGuest) {
      try {
        const parsed = JSON.parse(savedGuest);
        setUser({ uid: parsed.uid, displayName: parsed.displayName, photoURL: parsed.photoURL });
        loadProfile(parsed.uid, parsed.displayName, parsed.photoURL).then((p) => {
          setProfile(p);
          setLoading(false);
        });
        return;
      } catch {
        // Continue to create default guest
      }
    }

    // Auto create guest for instant play
    const guestUid = "guest_" + Math.random().toString(36).substring(2, 10);
    const guestAvatar = getRandomAvatar();
    const guestUser = {
      uid: guestUid,
      displayName: `لاعب_${Math.floor(Math.random() * 900 + 100)}`,
      photoURL: guestAvatar,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestUser));
    }
    setUser(guestUser);
    loadProfile(guestUid, guestUser.displayName, guestAvatar).then((p) => {
      setProfile(p);
      setLoading(false);
    });
  }, [loadProfile]);

  const signIn = async (email: string, password: string) => {
    if (isFirebaseConfigured()) {
      try {
        await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
        logger.info("User signed in", { email });
        return;
      } catch (err) {
        throw new Error(translateAuthError(err));
      }
    }
    // Local fallback sign in
    const uid = "user_" + btoa(email).replace(/=/g, "").substring(0, 10);
    const name = email.split("@")[0];
    const userObj = { uid, email, displayName: name, photoURL: getRandomAvatar() };
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(userObj));
    setUser(userObj);
    const p = await loadProfile(uid, name, userObj.photoURL);
    setProfile(p);
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    if (isFirebaseConfigured()) {
      try {
        const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
        await fbUpdateProfile(cred.user, { displayName });
        await loadProfile(cred.user.uid, displayName);
        logger.info("User signed up", { email });
        return;
      } catch (err) {
        throw new Error(translateAuthError(err));
      }
    }
    // Local fallback sign up
    const uid = "user_" + btoa(email).replace(/=/g, "").substring(0, 10);
    const userObj = { uid, email, displayName, photoURL: getRandomAvatar() };
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(userObj));
    setUser(userObj);
    const p = await loadProfile(uid, displayName, userObj.photoURL);
    setProfile(p);
  };

  const signInWithGoogle = async () => {
    if (isFirebaseConfigured()) {
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(getFirebaseAuth(), provider);
        logger.info("User signed in with Google");
        return;
      } catch (err) {
        throw new Error(translateAuthError(err));
      }
    }
    await signInAsGuest("لاعب جوجل 🌟");
  };

  const signInAsGuest = async (name?: string, avatar?: string) => {
    const guestUid = "guest_" + Math.random().toString(36).substring(2, 10);
    const chosenAvatar = avatar || getRandomAvatar();
    const chosenName = name || `لاعب_${Math.floor(Math.random() * 900 + 100)}`;
    const guestUser = {
      uid: guestUid,
      displayName: chosenName,
      photoURL: chosenAvatar,
    };
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestUser));
    setUser(guestUser);
    const p = await loadProfile(guestUid, chosenName, chosenAvatar);
    setProfile(p);
  };

  const updateAvatar = async (avatar: string) => {
    if (!user || !profile) return;
    const updated = { ...profile, photoURL: avatar };
    await SyncDB.update(`users/${user.uid}`, { photoURL: avatar });
    setProfile(updated);
    if (localStorage.getItem(GUEST_STORAGE_KEY)) {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({ ...user, photoURL: avatar }));
    }
  };

  const updateName = async (name: string) => {
    if (!user || !profile || !name.trim()) return;
    const updated = { ...profile, displayName: name.trim() };
    await SyncDB.update(`users/${user.uid}`, { displayName: name.trim() });
    setProfile(updated);
    if (localStorage.getItem(GUEST_STORAGE_KEY)) {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({ ...user, displayName: name.trim() }));
    }
  };

  const signOut = async () => {
    if (isFirebaseConfigured()) {
      try {
        await firebaseSignOut(getFirebaseAuth());
      } catch {
        // Ignore
      }
    }
    localStorage.removeItem(GUEST_STORAGE_KEY);
    // Create fresh guest
    await signInAsGuest();
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await loadProfile(user.uid, user.displayName || undefined);
      setProfile(p);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signInAsGuest,
        updateAvatar,
        updateName,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
