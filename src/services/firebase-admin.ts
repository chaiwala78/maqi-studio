import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Object.values(config).every(
  (value) => typeof value === "string" && value.length > 0,
);

const app = firebaseConfigured
  ? getApps()[0] ?? initializeApp(config)
  : null;
export const adminAuth = app ? getAuth(app) : null;

export { onAuthStateChanged, signInWithEmailAndPassword, signOut };
export type { User };
