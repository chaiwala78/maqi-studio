export interface User {
  email: string;
  getIdToken: () => Promise<string>;
}

type Listener = (user: User | null) => void;
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
export const firebaseConfigured = Object.values(config).every(
  (value) => typeof value === "string" && value.length > 0,
);

let idToken = "";
let refreshToken = "";
let expiresAt = 0;
let currentUser: User | null = null;
const listeners = new Set<Listener>();
function notify() { listeners.forEach((listener) => listener(currentUser)); }

async function getIdToken(): Promise<string> {
  if (idToken && Date.now() < expiresAt - 60_000) return idToken;
  if (!refreshToken) throw new Error("Session expired. Sign in again.");
  const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(config.apiKey ?? "")}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  const body = await response.json();
  if (!response.ok) { clearSession(); throw new Error("Session expired. Sign in again."); }
  idToken = body.id_token;
  refreshToken = body.refresh_token;
  expiresAt = Date.now() + Number(body.expires_in || 3600) * 1000;
  return idToken;
}

export const adminAuth = firebaseConfigured ? {
  get currentUser() { return currentUser; },
} : null;

export function onAuthStateChanged(_auth: unknown, listener: Listener) {
  listeners.add(listener);
  listener(currentUser);
  return () => listeners.delete(listener);
}

export async function signInWithEmailAndPassword(_auth: unknown, email: string, password: string) {
  if (!firebaseConfigured) throw new Error("Firebase client config missing");
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(config.apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message || "Sign in failed");
  idToken = body.idToken;
  refreshToken = body.refreshToken;
  expiresAt = Date.now() + Number(body.expiresIn || 3600) * 1000;
  currentUser = { email: body.email, getIdToken };
  notify();
  return currentUser;
}

function clearSession() {
  idToken = "";
  refreshToken = "";
  expiresAt = 0;
  currentUser = null;
  notify();
}

export async function signOut(_auth: unknown) {
  clearSession();
}
