import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
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

export const ADMIN_OWNER_EMAIL = "aabito986f@gmail.com";

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
 * Signs in using Google via popup.
 */
export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
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
 * Saves remote config both to Firebase Realtime Database and Cloudflare Worker.
 */
export async function publishLiveRemoteConfig(config: RemoteConfig): Promise<void> {
  try {
    // 1. Save to Firebase Realtime Database
    const configRef = ref(rtdb, "app_config");
    await rtdbSet(configRef, config);
  } catch (err) {
    console.warn("Failed to write to Firebase RTDB:", err);
  }

  // 2. Also save to Cloudflare Worker edge config so all mobile clients get it
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
        maintenance_mode: config.maintenance_mode,
        maintenance_message: config.maintenance_message,
        force_update: config.force_update,
        minimum_app_version: config.minimum_app_version,
        update_url: config.update_url,
      },
    };

    await fetch("https://modi.aabito986f.workers.dev/api/admin/config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Maqi-App-Token": "maqi_sec_786_auth_gate_v1",
      },
      body: JSON.stringify(payload),
    });
  } catch (cfErr) {
    console.warn("Failed to sync with Cloudflare Worker:", cfErr);
  }
}

/**
 * Reads live remote config from Firebase RTDB or Cloudflare Worker.
 */
export async function loadLiveRemoteConfig(): Promise<Partial<RemoteConfig> | null> {
  try {
    const configRef = ref(rtdb, "app_config");
    const snapshot = await get(configRef);
    if (snapshot.exists()) {
      return snapshot.val() as RemoteConfig;
    }
  } catch (err) {
    console.warn("Failed to read from Firebase RTDB, trying Cloudflare Worker:", err);
  }

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
          maintenance_mode: data.app_config.maintenance_mode || false,
          maintenance_message: data.app_config.maintenance_message || "",
          force_update: data.app_config.force_update || false,
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
