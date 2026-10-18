import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  addDoc,
  query,
  limit,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import { getDatabase, ref, get, set as rtdbSet } from "firebase/database";
import type { RemoteConfig } from "@/services/remote-config";

export const firebaseConfig = {
  apiKey: "AIzaSyCZhnBVJgDGGaDxMlLjGwwaF8h6-V3xIxU",
  authDomain: "maqi-f2c36.firebaseapp.com",
  projectId: "maqi-f2c36",
  storageBucket: "maqi-f2c36.firebasestorage.app",
  databaseURL: "https://maqi-f2c36-default-rtdb.asia-southeast1.firebasedatabase.app",
  appId: "1:682920398064:android:405cca4fe3b685c43a0635",
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("https://www.googleapis.com/auth/firebase.remoteconfig");
googleProvider.addScope("https://www.googleapis.com/auth/cloud-platform");

export const ADMIN_EMAILS = [
  "jojo219884@gmail.com",
  "aabito986f@gmail.com",
  "admin@maqi.app",
  "chaiwala78@gmail.com",
  "chaiwala@gmail.com",
  "owner@maqi.app",
];

export const ADMIN_OWNER_EMAIL = "jojo219884@gmail.com";

// Master security passkeys for emergency/cross-device access
export const MASTER_ADMIN_PASSKEYS = [
  "maqi@admin78",
  "maqi2025",
  "admin78",
  "admin@123",
];

export function isUserAdmin(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return (
    ADMIN_EMAILS.some((e) => e.toLowerCase() === clean) ||
    clean.endsWith("@maqi.app") ||
    clean.startsWith("admin") ||
    clean.startsWith("chaiwala")
  );
}

export interface RegisteredAppUser {
  uid: string;
  displayName: string;
  email: string;
  photoUrl?: string;
  themeColor?: string;
  bio?: string;
  createdAt?: string;
  lastActive?: string;
  historyCount?: number;
  watchlistCount?: number;
  isOnline?: boolean;
}

/**
 * Signs in using Google via popup and preserves OAuth access token for Remote Config API.
 */
export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken;
  if (token) {
    try {
      localStorage.setItem("maqi_google_access_token", token);
      sessionStorage.setItem("maqi_google_access_token", token);
    } catch {}
  }
  return result.user;
}

/**
 * Requests or refreshes Google OAuth token specifically for Remote Config API.
 */
export async function requestRemoteConfigGoogleAuth(): Promise<string> {
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken;
  if (!token) {
    throw new Error("Could not retrieve Google OAuth access token.");
  }
  try {
    localStorage.setItem("maqi_google_access_token", token);
    sessionStorage.setItem("maqi_google_access_token", token);
  } catch {}
  return token;
}

export function getSavedGoogleAccessToken(): string | null {
  try {
    return (
      sessionStorage.getItem("maqi_google_access_token") ||
      localStorage.getItem("maqi_google_access_token")
    );
  } catch {
    return null;
  }
}

/**
 * Signs in using Email ID and Password. Works on ANY device or friend's phone without Google account.
 */
export async function loginWithEmailPassword(email: string, pass: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return result.user;
}

/**
 * Creates or registers a new admin account with Email ID and Password.
 */
export async function registerWithEmailPassword(email: string, pass: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  return result.user;
}

/**
 * Signs out from Firebase.
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Fetches all registered users from Firestore users collection.
 */
export async function fetchRegisteredUsers(): Promise<RegisteredAppUser[]> {
  try {
    const usersCol = collection(db, "users");
    const snapshot = await getDocs(query(usersCol, limit(100)));
    const users: RegisteredAppUser[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      users.push({
        uid: docSnap.id,
        displayName: data.displayName || data.name || data.username || "MaQi Streamer",
        email: data.email || "No email",
        photoUrl: data.photoUrl || data.photoURL || data.avatarUrl || "",
        themeColor: data.themeColor || data.color || "#E50914",
        bio: data.bio || data.about || "",
        createdAt: data.createdAt ? String(data.createdAt) : "",
        lastActive: data.lastActive ? String(data.lastActive) : "",
        historyCount: Array.isArray(data.watchHistory) ? data.watchHistory.length : (data.historyCount || 0),
        watchlistCount: Array.isArray(data.watchlist) ? data.watchlist.length : (data.watchlistCount || 0),
      });
    });

    return users;
  } catch (err) {
    console.warn("Failed to fetch users directly from Firestore:", err);
    return [];
  }
}

/**
 * Generates the exact Firebase Remote Config JSON template matching Firebase Console schema.
 */
export function generateFirebaseRemoteConfigTemplate(config: RemoteConfig) {
  return {
    parameters: {
      maintenance_mode: {
        defaultValue: {
          value: config.maintenance_mode ? "true" : "false",
        },
        description: "why you are gay?🥀",
        valueType: "BOOLEAN",
      },
      force_update: {
        defaultValue: {
          value: config.force_update ? "true" : "false",
        },
        valueType: "BOOLEAN",
      },
      announcement_title: {
        defaultValue: {
          value: config.announcement_title || "Welcome to MaQi!",
        },
        valueType: "STRING",
      },
      announcement_message: {
        defaultValue: {
          value:
            config.announcement_message ||
            "Enjoy high-speed anime and movie streaming with updated features.",
        },
        valueType: "STRING",
      },
      maintenance_message: {
        defaultValue: {
          value:
            config.maintenance_message ||
            "FATAL ERROR 403: AndroidRuntime: FATAL EXCEPTION: java.lang.IllegalStateException: Application state validation failed  at android.app.ActivityThread.performLaunchActivity(ActivityThread.java) at android.app.ActivityThread.handleLaunchActivity(ActivityThread.java)  Caused by: java.lang.SecurityException: Application integrity verification failed.  E/AndroidRuntime: FATAL EXCEPTION E/PackageManager: Package validation failed E/System: Unauthorized Modification Detected. App integrity verification failed. Access restricted due to a security policy violation.",
        },
        valueType: "STRING",
      },
      announcement_id: {
        defaultValue: {
          value: config.announcement_id || "v1_welcome",
        },
        valueType: "STRING",
      },
      minimum_app_version: {
        defaultValue: {
          value: config.minimum_app_version || "1.0",
        },
        valueType: "STRING",
      },
      update_url: {
        defaultValue: {
          value:
            config.update_url ||
            "https://github.com/mramir21988-blip/Loda-lehsun-/releases/download/Loda/app-debug.-.2026-08-29T021633.668.apk",
        },
        valueType: "STRING",
      },
      announcement_enabled: {
        defaultValue: {
          value: config.announcement_enabled ? "true" : "false",
        },
        valueType: "BOOLEAN",
      },
    },
  };
}

/**
 * Publishes configuration directly to the official Firebase Remote Config REST API.
 */
export async function publishToFirebaseRemoteConfigAPI(
  config: RemoteConfig,
  customToken?: string
): Promise<{ success: boolean; versionNumber?: string; error?: string }> {
  const token = customToken || getSavedGoogleAccessToken();
  if (!token) {
    return {
      success: false,
      error: "No Google OAuth token found. Click 'Connect Google Account' to authenticate with Firebase Remote Config.",
    };
  }

  try {
    const payload = generateFirebaseRemoteConfigTemplate(config);
    const endpoint = `https://firebaseremoteconfig.googleapis.com/v1/projects/${firebaseConfig.projectId}/remoteConfig`;

    // 1. Fetch current ETag first
    let etag = "*";
    try {
      const getRes = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (getRes.ok) {
        const receivedEtag = getRes.headers.get("ETag");
        if (receivedEtag) etag = receivedEtag;
      }
    } catch (e) {
      console.warn("ETag fetch error:", e);
    }

    // 2. PUT updated config with ETag
    const putRes = await fetch(endpoint, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; UTF-8",
        "If-Match": etag,
      },
      body: JSON.stringify(payload),
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      return { success: false, error: `Google API Error ${putRes.status}: ${errText}` };
    }

    const data = await putRes.json();
    const versionNumber = data.version?.versionNumber;
    return { success: true, versionNumber };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to reach Google Remote Config API." };
  }
}

/**
 * Reads directly from the official Firebase Remote Config REST API.
 */
export async function fetchFirebaseRemoteConfigAPI(
  customToken?: string
): Promise<Partial<RemoteConfig> | null> {
  const token = customToken || getSavedGoogleAccessToken();
  if (!token) return null;

  try {
    const endpoint = `https://firebaseremoteconfig.googleapis.com/v1/projects/${firebaseConfig.projectId}/remoteConfig`;
    const res = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    const params = data.parameters || {};

    return {
      maintenance_mode: params.maintenance_mode?.defaultValue?.value === "true",
      maintenance_message: params.maintenance_message?.defaultValue?.value || "",
      force_update: params.force_update?.defaultValue?.value === "true",
      minimum_app_version: params.minimum_app_version?.defaultValue?.value || "1.0",
      update_url: params.update_url?.defaultValue?.value || "",
      announcement_enabled: params.announcement_enabled?.defaultValue?.value === "true",
      announcement_id: params.announcement_id?.defaultValue?.value || "v1",
      announcement_title: params.announcement_title?.defaultValue?.value || "",
      announcement_message: params.announcement_message?.defaultValue?.value || "",
    };
  } catch (err) {
    console.warn("Failed to fetch from Firebase Remote Config API:", err);
    return null;
  }
}

export interface PublishResult {
  remoteConfigApiUpdated: boolean;
  versionNumber?: string;
  firestoreUpdated: boolean;
  rtdbUpdated: boolean;
  workerUpdated: boolean;
  apiError?: string;
}

/**
 * Multi-channel publish: Writes to Firebase Remote Config REST, Firestore, RTDB, and Cloudflare Worker.
 */
export async function publishLiveRemoteConfig(config: RemoteConfig): Promise<PublishResult> {
  let remoteConfigApiUpdated = false;
  let versionNumber: string | undefined;
  let apiError: string | undefined;
  let firestoreUpdated = false;
  let rtdbUpdated = false;
  let workerUpdated = false;

  // 1. Direct Firebase Remote Config REST API
  const token = getSavedGoogleAccessToken();
  if (token) {
    const rcRes = await publishToFirebaseRemoteConfigAPI(config, token);
    if (rcRes.success) {
      remoteConfigApiUpdated = true;
      versionNumber = rcRes.versionNumber;
    } else {
      apiError = rcRes.error;
    }
  }

  // 2. Firestore app_config/global document
  try {
    const configDoc = doc(db, "app_config", "global");
    await setDoc(
      configDoc,
      {
        ...config,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.email || "admin",
      },
      { merge: true }
    );
    firestoreUpdated = true;
  } catch (err) {
    console.warn("Failed to write to Firestore app_config:", err);
  }

  // 3. Firebase Realtime Database
  try {
    const configRef = ref(rtdb, "app_config");
    await rtdbSet(configRef, config);
    rtdbUpdated = true;
  } catch (err) {
    console.warn("Failed to write to Firebase RTDB:", err);
  }

  // 4. Cloudflare Worker Edge Config
  try {
    const payload = {
      app_notice: {
        enabled: config.announcement_enabled,
        id: config.announcement_id,
        title: config.announcement_title,
        message: config.announcement_message,
        is_cancellable: true,
      },
      app_config: {
        maintenance_mode: String(config.maintenance_mode),
        maintenance_message: config.maintenance_message,
        force_update: String(config.force_update),
        minimum_app_version: config.minimum_app_version,
        update_url: config.update_url,
      },
    };

    const res = await fetch("https://modi.aabito986f.workers.dev/api/admin/config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Maqi-App-Token": "maqi_sec_786_auth_gate_v1",
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) workerUpdated = true;
  } catch (cfErr) {
    console.warn("Failed to sync with Cloudflare Worker:", cfErr);
  }

  return {
    remoteConfigApiUpdated,
    versionNumber,
    firestoreUpdated,
    rtdbUpdated,
    workerUpdated,
    apiError,
  };
}

/**
 * Reads live remote config from Firebase Remote Config, Firestore, RTDB, or Cloudflare Worker.
 */
export async function loadLiveRemoteConfig(): Promise<Partial<RemoteConfig> | null> {
  // 1. Try Firebase Remote Config API first
  const apiConfig = await fetchFirebaseRemoteConfigAPI();
  if (apiConfig) return apiConfig;

  // 2. Try Firestore app_config/global
  try {
    const docSnap = await getDoc(doc(db, "app_config", "global"));
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        maintenance_mode: Boolean(data.maintenance_mode),
        maintenance_message: data.maintenance_message || "",
        force_update: Boolean(data.force_update),
        minimum_app_version: data.minimum_app_version || "1.0",
        update_url: data.update_url || "",
        announcement_enabled: Boolean(data.announcement_enabled),
        announcement_id: data.announcement_id || "v1",
        announcement_title: data.announcement_title || "",
        announcement_message: data.announcement_message || "",
      };
    }
  } catch (fsErr) {
    console.warn("Failed to read from Firestore app_config:", fsErr);
  }

  // 3. Try Firebase RTDB
  try {
    const configRef = ref(rtdb, "app_config");
    const snapshot = await get(configRef);
    if (snapshot.exists()) {
      return snapshot.val() as RemoteConfig;
    }
  } catch (err) {
    console.warn("Failed to read from Firebase RTDB:", err);
  }

  // 4. Try Cloudflare Worker
  try {
    const res = await fetch("https://modi.aabito986f.workers.dev/api/config", {
      headers: {
        "X-Maqi-App-Token": "maqi_sec_786_auth_gate_v1",
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.app_config) {
        return {
          maintenance_mode: data.app_config.maintenance_mode === "true" || data.app_config.maintenance_mode === true,
          maintenance_message: data.app_config.maintenance_message || "",
          force_update: data.app_config.force_update === "true" || data.app_config.force_update === true,
          minimum_app_version: data.app_config.minimum_app_version || "1.0",
          update_url: data.app_config.update_url || "",
          announcement_enabled: data.app_notice?.enabled || false,
          announcement_id: data.app_notice?.id || "v1",
          announcement_title: data.app_notice?.title || "",
          announcement_message: data.app_notice?.message || "",
        };
      }
    }
  } catch (_) {}

  return null;
}

export interface BroadcastNotification {
  id?: string;
  title: string;
  body: string;
  imageUrl?: string;
  type?: "anime" | "movie" | "tv" | "update" | "announcement" | "general";
  animeId?: string;
  url?: string;
  route?: string;
  target?: "all" | "topic_all_users" | "topic_releases" | "topic_announcements";
  timestamp: number;
  sentBy?: string;
}

/**
 * Sends a real-time broadcast notification across all connected MaQi mobile apps.
 * Writes to Firestore broadcast_notifications which triggers instant delivery on devices.
 */
export async function sendBroadcastNotification(
  notif: Omit<BroadcastNotification, "timestamp">
): Promise<string> {
  const user = auth.currentUser;
  const colRef = collection(db, "broadcast_notifications");
  const docData: any = {
    title: notif.title,
    body: notif.body,
    imageUrl: notif.imageUrl || "",
    type: notif.type || "general",
    target: notif.target || "all",
    timestamp: Date.now(),
    sentBy: user?.email || "admin@maqi.app",
  };
  if (notif.animeId) {
    docData.animeId = notif.animeId;
    docData.id = notif.animeId;
  }
  if (notif.route) docData.route = notif.route;
  if (notif.url) docData.url = notif.url;

  const docRef = await addDoc(colRef, docData);
  return docRef.id;
}

/**
 * Fetches the recent history of broadcast push notifications.
 */
export async function fetchNotificationHistory(): Promise<BroadcastNotification[]> {
  try {
    const colRef = collection(db, "broadcast_notifications");
    const q = query(colRef, orderBy("timestamp", "desc"), limit(25));
    const snapshot = await getDocs(q);
    const list: BroadcastNotification[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      list.push({
        id: d.id,
        title: data.title || "",
        body: data.body || "",
        imageUrl: data.imageUrl || "",
        type: data.type || "general",
        animeId: data.animeId || data.id || "",
        route: data.route || "",
        url: data.url || "",
        target: data.target || "all",
        timestamp: data.timestamp || 0,
        sentBy: data.sentBy || "",
      });
    });
    return list;
  } catch (err) {
    console.warn("Failed to fetch broadcast history:", err);
    return [];
  }
}

/**
 * Fetches count of active FCM registered devices.
 */
export async function fetchFcmTokensCount(): Promise<number> {
  try {
    const tokensCol = collection(db, "fcm_tokens");
    const snapshot = await getDocs(query(tokensCol, limit(500)));
    return snapshot.size;
  } catch (err) {
    return 0;
  }
}
