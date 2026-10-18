// Firebase Remote Config parameters for the MaQi Android app.
// Keys and default values copied from the user's Firebase console (Config v22).
// Never rename these keys — the Android app reads them by name.

export interface RemoteConfig {
  maintenance_mode: boolean;
  maintenance_message: string;
  force_update: boolean;
  minimum_app_version: string;
  update_url: string;
  announcement_enabled: boolean;
  announcement_id: string;
  announcement_title: string;
  announcement_message: string;
}

export const REMOTE_CONFIG_DEFAULTS: RemoteConfig = {
  maintenance_mode: false,
  maintenance_message:
    "FATAL ERROR 403: AndroidRuntime: FATAL EXCEPTION: java.lang.IllegalStateException: Application state validation failed  at android.app.ActivityThread.performLaunchActivity(ActivityThread.java) at android.app.ActivityThread.handleLaunchActivity(ActivityThread.java)  Caused by: java.lang.SecurityException: Application integrity verification failed.  E/AndroidRuntime: FATAL EXCEPTION E/PackageManager: Package validation failed E/System: Unauthorized Modification Detected. App integrity verification failed. Access restricted due to a security policy violation.",
  force_update: false,
  minimum_app_version: "1.0",
  update_url:
    "https://github.com/mramir21988-blip/Loda-lehsun-/releases/download/Loda/app-debug.-.2026-08-29T021633.668.apk",
  announcement_enabled: false,
  announcement_id: "v1_welcome",
  announcement_title: "Welcome to MaQi!",
  announcement_message:
    "Enjoy high-speed anime and movie streaming with updated features.",
};

export function validateRemoteConfig(c: RemoteConfig): Partial<Record<keyof RemoteConfig, string>> {
  const e: Partial<Record<keyof RemoteConfig, string>> = {};
  if (!/^\d+(\.\d+){0,3}$/.test(c.minimum_app_version.trim())) e.minimum_app_version = "Use a version like 1.0 or 1.2.3";
  try {
    const u = new URL(c.update_url);
    if (u.protocol !== "https:") e.update_url = "Must start with https://";
  } catch { e.update_url = "Enter a valid URL"; }
  if (!c.announcement_id.trim()) e.announcement_id = "Required — change it to re-show the popup";
  if (c.announcement_title.length > 100) e.announcement_title = "Max 100 characters";
  if (c.announcement_message.length > 500) e.announcement_message = "Max 500 characters";
  if (c.maintenance_message.length > 500) e.maintenance_message = "Max 500 characters";
  return e;
}

const KEY = "maqi-remote-config-demo";

export function loadPublishedConfig(): RemoteConfig {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...REMOTE_CONFIG_DEFAULTS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return REMOTE_CONFIG_DEFAULTS;
}

/** Demo only: saves locally. Real publish must go through a protected server endpoint using a Firebase service account. */
export function saveDemoConfig(c: RemoteConfig) {
  localStorage.setItem(KEY, JSON.stringify(c));
}

export function changedConfigKeys(a: RemoteConfig, b: RemoteConfig) {
  return (Object.keys(a) as (keyof RemoteConfig)[]).filter((k) => a[k] !== b[k]);
}
