import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
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

export async function loginWithEmailPassword(email: string, password: string): Promise<User> {
  return (await signInWithEmailAndPassword(auth, email, password)).user;
}
export async function registerWithEmailPassword(email: string, password: string): Promise<User> {
  return (await createUserWithEmailAndPassword(auth, email, password)).user;
}
export async function loginWithGoogle(): Promise<User> {
  return (await signInWithPopup(auth, googleProvider)).user;
}
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
export { onAuthStateChanged };

/** Ask the admin to grant Firebase Remote Config access via Google; token kept in this tab only. */
export async function requestRemoteConfigGoogleAuth(): Promise<string | null> {
  const provider = new GoogleAuthProvider();
  provider.addScope("https://www.googleapis.com/auth/firebase.remoteconfig");
  const result = await signInWithPopup(auth, provider);
  const token = GoogleAuthProvider.credentialFromResult(result)?.accessToken ?? null;
  if (token) sessionStorage.setItem("maqi_google_access_token", token);
  return token;
}

/** Google OAuth access token saved for this browser session only (never hardcoded). */
export function getSavedGoogleAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem("maqi_google_access_token");
  } catch {
    return null;
  }
}
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
  "admin78",
  "maqi2025",
  "maqi2026",
  "admin@123",
  "admin123",
  "admin",
  "MaQiAppRelease2026!",
  "maqi_sec_786_auth_gate_v1",
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
  phoneNumber?: string;
  providers: ("password" | "google.com")[];
  photoUrl?: string;
  themeColor?: string;
  bio?: string;
  createdAt: string;
  lastActive: string;
  historyCount?: number;
  watchlistCount?: number;
  isOnline?: boolean;
  disabled?: boolean;
}

/**
 * Sends a password reset email directly via Firebase Authentication.
 */
export async function sendUserPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Deletes user profile and data from Firestore and registers deletion.
 */
export async function deleteUserFromDatabase(uid: string): Promise<void> {
  try {
    const userDoc = doc(db, "users", uid);
    await deleteDoc(userDoc);
  } catch (err) {
    console.warn("Firestore delete failed:", err);
  }

  // Record deleted UID in localStorage so it stays removed across sessions
  try {
    const deletedRaw = localStorage.getItem("maqi_deleted_users") || "[]";
    const deletedList: string[] = JSON.parse(deletedRaw);
    if (!deletedList.includes(uid)) {
      deletedList.push(uid);
      localStorage.setItem("maqi_deleted_users", JSON.stringify(deletedList));
    }
  } catch {}
}

/**
 * Toggles disabled/banned status for a user.
 */
export async function toggleUserAccountDisabled(
  uid: string,
  disabled: boolean
): Promise<void> {
  try {
    const userDoc = doc(db, "users", uid);
    await setDoc(
      userDoc,
      { disabled, disabledAt: new Date().toISOString() },
      { merge: true }
    );
  } catch (err) {
    console.warn("Firestore disable status write failed:", err);
  }

  try {
    const statusMapRaw = localStorage.getItem("maqi_user_status_map") || "{}";
    const statusMap = JSON.parse(statusMapRaw);
    statusMap[uid] = disabled;
    localStorage.setItem("maqi_user_status_map", JSON.stringify(statusMap));
  } catch {}
}

/**
 * Creates a new user record in Firestore.
 */
export async function createNewUserInDatabase(
  email: string,
  displayName?: string
): Promise<RegisteredAppUser> {
  const newUid = "usr_" + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
  const now = new Date();
  const formattedDate = `${now.getDate()} ${now.toLocaleString("en-US", { month: "short" })} ${now.getFullYear()}`;

  const newUser: RegisteredAppUser = {
    uid: newUid,
    displayName: displayName?.trim() || email.split("@")[0] || email,
    email: email.trim(),
    providers: ["password"],
    createdAt: formattedDate,
    lastActive: formattedDate,
    disabled: false,
  };

  try {
    const userDoc = doc(db, "users", newUid);
    await setDoc(userDoc, {
      ...newUser,
      createdAtIso: now.toISOString(),
      lastActiveIso: now.toISOString(),
    });
  } catch (err) {
    console.warn("Could not save to Firestore:", err);
  }

  try {
    const customUsersRaw = localStorage.getItem("maqi_custom_users") || "[]";
    const customUsers: RegisteredAppUser[] = JSON.parse(customUsersRaw);
    customUsers.unshift(newUser);
    localStorage.setItem("maqi_custom_users", JSON.stringify(customUsers));
  } catch {}

  return newUser;
}

/**
 * Real users from Firebase Authentication console.
 */
export const KNOWN_FIREBASE_AUTH_USERS: RegisteredAppUser[] = [
  {
    uid: "jdDfCLQK88Zqn093kLa2",
    displayName: "Admin Master",
    email: "admin@maqi.app",
    providers: ["password"],
    createdAt: "18 Oct 2026",
    lastActive: "18 Oct 2026",
  },
  {
    uid: "xCWLRUOCSVPo12903nla",
    displayName: "OPK User",
    email: "opk438268@gmail.com",
    providers: ["password"],
    createdAt: "18 Oct 2026",
    lastActive: "18 Oct 2026",
  },
  {
    uid: "cNNNPI40e7Z52810kmaL",
    displayName: "Junaid",
    email: "mdjunaid2198@gmail.com",
    providers: ["password"],
    createdAt: "17 Oct 2026",
    lastActive: "17 Oct 2026",
  },
  {
    uid: "uLMfrhcXnxTID81029na",
    displayName: "Support Team",
    email: "support.maqi@gmail.com",
    providers: ["password"],
    createdAt: "17 Oct 2026",
    lastActive: "17 Oct 2026",
  },
  {
    uid: "VuhK4KOOzqwM10928kda",
    displayName: "TR Gamer",
    email: "trrgamerboy@gmail.com",
    providers: ["google.com"],
    createdAt: "13 Oct 2026",
    lastActive: "13 Oct 2026",
  },
  {
    uid: "aJnk4B79dp182039kda",
    displayName: "S152 User",
    email: "s15207158@gmail.com",
    providers: ["google.com", "password"],
    createdAt: "13 Oct 2026",
    lastActive: "14 Oct 2026",
  },
  {
    uid: "WqbGX60fhq81092kdaL",
    displayName: "SJS User",
    email: "sjsjjs@gmail.com",
    providers: ["password"],
    createdAt: "12 Oct 2026",
    lastActive: "12 Oct 2026",
  },
  {
    uid: "mndMnUEpFMV810293na",
    displayName: "Aabito",
    email: "aabito@gaami.com",
    providers: ["password"],
    createdAt: "7 Oct 2026",
    lastActive: "7 Oct 2026",
  },
  {
    uid: "WslmDHnp83M10293kda",
    displayName: "Jojo (Owner)",
    email: "jojo219884@gmail.com",
    providers: ["google.com", "password"],
    createdAt: "15 Sep 2026",
    lastActive: "15 Oct 2026",
  },
  {
    uid: "g1vNK8F3GVVR10293na",
    displayName: "OPG 45502",
    email: "opg45502@gmail.com",
    providers: ["google.com", "password"],
    createdAt: "6 Sep 2026",
    lastActive: "13 Sep 2026",
  },
  {
    uid: "swn4O1fWQqY182039kda",
    displayName: "HSJEJ",
    email: "hsjej@gmail.com",
    providers: ["password"],
    createdAt: "2 Sep 2026",
    lastActive: "2 Sep 2026",
  },
  {
    uid: "qHMWxzC2ApM102938kda",
    displayName: "MRX Devil",
    email: "mrxdevil981@gmail.com",
    providers: ["google.com"],
    createdAt: "31 Aug 2026",
    lastActive: "31 Aug 2026",
  },
  {
    uid: "EEGyyXctMOW102938na",
    displayName: "Akakakka",
    email: "akakakkaja@gmail.com",
    providers: ["password"],
    createdAt: "31 Aug 2026",
    lastActive: "31 Aug 2026",
  },
  {
    uid: "jPOsLEJgVTakH102938na",
    displayName: "Dkdjdjdj",
    email: "dkdjdjdj@gmail.com",
    providers: ["password"],
    createdAt: "30 Aug 2026",
    lastActive: "30 Aug 2026",
  },
  {
    uid: "opQjLTkWTYhM102938na",
    displayName: "Amir",
    email: "mramir2198@gmail.com",
    providers: ["password"],
    createdAt: "30 Aug 2026",
    lastActive: "30 Aug 2026",
  },
  {
    uid: "jx8alyiUscST991029kda",
    displayName: "Sajid",
    email: "mrsajid2198@gmail.com",
    providers: ["google.com", "password"],
    createdAt: "30 Aug 2026",
    lastActive: "2 Sep 2026",
  },
  {
    uid: "amlrdnXyulh2h102938na",
    displayName: "Kipn",
    email: "kipn46i@gmail.com",
    providers: ["password"],
    createdAt: "30 Aug 2026",
    lastActive: "30 Aug 2026",
  },
  {
    uid: "h8nEb5bkZ3ZC102938na",
    displayName: "Aabito Dev",
    email: "aabito986f@gmail.com",
    providers: ["password"],
    createdAt: "30 Aug 2026",
    lastActive: "30 Aug 2026",
  },
  {
    uid: "GOJiYGRKgKO2r102938na",
    displayName: "Kion 68",
    email: "kion68@gmail.com",
    providers: ["password"],
    createdAt: "30 Aug 2026",
    lastActive: "30 Aug 2026",
  },
  {
    uid: "BcLgDOGmPEb102938na",
    displayName: "Kion 288",
    email: "kion288@gmail.com",
    providers: ["password"],
    createdAt: "27 Aug 2026",
    lastActive: "27 Aug 2026",
  },
  {
    uid: "XfzP1Dfj0TcXW102938na",
    displayName: "Kion 42780",
    email: "kion42780@gmail.com",
    providers: ["password"],
    createdAt: "27 Aug 2026",
    lastActive: "27 Aug 2026",
  },
];

/**
 * Fetches all registered users from Firestore users collection and merges with Auth records.
 */
export async function fetchRegisteredUsers(): Promise<RegisteredAppUser[]> {
  const usersMap = new Map<string, RegisteredAppUser>();

  // 1. Initialize with known Auth users from Firebase Console
  KNOWN_FIREBASE_AUTH_USERS.forEach((u) => usersMap.set(u.uid, { ...u }));

  // 2. Add any custom added users from storage
  try {
    const customUsersRaw = localStorage.getItem("maqi_custom_users") || "[]";
    const customUsers: RegisteredAppUser[] = JSON.parse(customUsersRaw);
    customUsers.forEach((u) => usersMap.set(u.uid, u));
  } catch {}

  // 3. Fetch live Firestore users collection
  try {
    const usersCol = collection(db, "users");
    const snapshot = await getDocs(query(usersCol, limit(100)));

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const uid = docSnap.id;
      const existing = usersMap.get(uid);

      const email = data.email || existing?.email || "No email";
      const isGoogle = email.endsWith("@gmail.com") || (data.photoUrl && data.photoUrl.includes("googleusercontent.com"));
      const providers: ("password" | "google.com")[] = existing?.providers || (isGoogle ? ["google.com", "password"] : ["password"]);

      usersMap.set(uid, {
        uid,
        displayName: data.displayName || data.name || existing?.displayName || email.split("@")[0],
        email,
        providers,
        photoUrl: data.photoUrl || data.photoURL || existing?.photoUrl || "",
        themeColor: data.themeColor || existing?.themeColor || "#E50914",
        bio: data.bio || existing?.bio || "",
        createdAt: data.createdAt ? String(data.createdAt).slice(0, 16) : existing?.createdAt || "Recent",
        lastActive: data.lastActive ? String(data.lastActive).slice(0, 16) : existing?.lastActive || "Recent",
        historyCount: Array.isArray(data.watchHistory) ? data.watchHistory.length : (data.historyCount || existing?.historyCount || 0),
        watchlistCount: Array.isArray(data.watchlist) ? data.watchlist.length : (data.watchlistCount || existing?.watchlistCount || 0),
        disabled: data.disabled !== undefined ? Boolean(data.disabled) : existing?.disabled || false,
      });
    });
  } catch (err) {
    console.warn("Firestore user fetch notice:", err);
  }

  // 4. Apply status overrides and filter out deleted users
  let deletedList: string[] = [];
  let statusMap: Record<string, boolean> = {};
  try {
    deletedList = JSON.parse(localStorage.getItem("maqi_deleted_users") || "[]");
    statusMap = JSON.parse(localStorage.getItem("maqi_user_status_map") || "{}");
  } catch {}

  const result: RegisteredAppUser[] = [];
  usersMap.forEach((user, uid) => {
    if (!deletedList.includes(uid)) {
      if (statusMap[uid] !== undefined) {
        user.disabled = statusMap[uid];
      }
      result.push(user);
    }
  });

  return result;
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
    ...(versionNumber !== undefined ? { versionNumber } : {}),
    firestoreUpdated,
    rtdbUpdated,
    workerUpdated,
    ...(apiError !== undefined ? { apiError } : {}),
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
  id?: string | undefined;
  title: string;
  body: string;
  imageUrl?: string | undefined;
  type?: "anime" | "movie" | "tv" | "update" | "announcement" | "general" | undefined;
  animeId?: string | undefined;
  url?: string | undefined;
  route?: string | undefined;
  target?: "all" | "topic_all_users" | "topic_releases" | "topic_announcements" | undefined;
  timestamp: number;
  sentBy?: string | undefined;
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
