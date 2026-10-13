import { useSyncExternalStore } from "react";
import { adminService } from "./admin-service";
import type { AdminData, DataKey, LogEntry, PublishResult } from "./types";

interface State {
  status: "idle" | "loading" | "ready" | "error";
  error?: string;
  draft: AdminData | null;
  published: AdminData | null;
  log: LogEntry[];
}

const LS_KEY = "maqi-admin-demo-v1";
let state: State = { status: "idle", draft: null, published: null, log: [] };
const listeners = new Set<() => void>();

function set(next: Partial<State>) {
  state = { ...state, ...next };
  if (typeof window !== "undefined" && state.draft) {
    localStorage.setItem(LS_KEY, JSON.stringify({ draft: state.draft, published: state.published, log: state.log }));
  }
  listeners.forEach((l) => l());
}

export function useAdmin() {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => state,
    () => state,
  );
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export async function loadAdmin() {
  if (state.status === "loading" || state.status === "ready") return;
  set({ status: "loading" });
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved && adminService.mode === "demo") {
      const p = JSON.parse(saved);
      set({ status: "ready", draft: p.draft, published: p.published, log: p.log ?? [] });
      return;
    }
    const data = await adminService.load();
    set({ status: "ready", draft: data, published: structuredClone(data) });
  } catch (e) {
    set({ status: "error", error: e instanceof Error ? e.message : "Failed to load" });
  }
}

export function mutate<K extends DataKey>(key: K, fn: (v: AdminData[K]) => AdminData[K], action: string, target: string) {
  if (!state.draft) return;
  const draft = { ...state.draft, [key]: fn(structuredClone(state.draft[key])) };
  const entry: LogEntry = { id: uid(), at: new Date().toISOString(), action, target };
  set({ draft, log: [entry, ...state.log].slice(0, 200) });
}

export function changedKeys(s: State): DataKey[] {
  if (!s.draft || !s.published) return [];
  return (Object.keys(s.draft) as DataKey[]).filter(
    (k) => JSON.stringify(s.draft![k]) !== JSON.stringify(s.published![k]),
  );
}

export function discardDraft() {
  if (!state.published) return;
  set({ draft: structuredClone(state.published) });
}

export async function publishDraft(): Promise<PublishResult> {
  if (!state.draft) return { status: "error", message: "Nothing loaded" };
  const res = await adminService.publish(state.draft);
  if (res.status === "confirmed" || res.status === "demo") {
    const entry: LogEntry = {
      id: uid(),
      at: new Date().toISOString(),
      action: res.status === "demo" ? "Demo publish (not sent)" : "Published",
      target: "All changes",
    };
    set({ published: structuredClone(state.draft), log: [entry, ...state.log] });
  }
  return res;
}

export function resetDemo() {
  localStorage.removeItem(LS_KEY);
  state = { status: "idle", draft: null, published: null, log: [] };
  void loadAdmin();
}

export function move<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const a = [...arr];
  [a[i], a[j]] = [a[j], a[i]];
  return a;
}

export function buildUrl(tpl: string, v: { tmdbId: string; season?: string; episode?: string }) {
  return tpl
    .replaceAll("{tmdbId}", encodeURIComponent(v.tmdbId))
    .replaceAll("{season}", encodeURIComponent(v.season ?? ""))
    .replaceAll("{episode}", encodeURIComponent(v.episode ?? ""));
}
