"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { getFirebaseAuth, getFirebaseRTDB } from "@/lib/firebase";
import { logger } from "@/lib/logger";
import type { UserProfile } from "@/types/user";

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

async function getOrCreateProfile(user: User): Promise<UserProfile> {
    const userRef = ref(getFirebaseRTDB(), `users/${user.uid}`);
  const snapshot = await get(userRef);

  if (snapshot.exists()) {
    return snapshot.val() as UserProfile;
  }

  const profile: UserProfile = {
    uid: user.uid,
    displayName: user.displayName || user.email?.split("@")[0] || "Player",
    photoURL: user.photoURL,
    totalScore: 0,
    gamesPlayed: 0,
    createdAt: Date.now(),
  };

  await set(userRef, profile);
  logger.info("New user profile created", { uid: user.uid });
  return profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const p = await getOrCreateProfile(firebaseUser);
          setProfile(p);
        } catch (err) {
          logger.error("Failed to load user profile", err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
    logger.info("User signed in", { email });
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
    await updateProfile(cred.user, { displayName });
    await getOrCreateProfile(cred.user);
    logger.info("User signed up", { email });
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(getFirebaseAuth(), provider);
    logger.info("User signed in with Google");
  };

  const signOut = async () => {
    await firebaseSignOut(getFirebaseAuth());
    logger.info("User signed out");
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await getOrCreateProfile(user);
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
