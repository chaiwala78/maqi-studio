import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { adminAuth } from "@/services/firebase-admin";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/live-config")({
  head: pageHead("Live KV Config", "Inspect and update approved MaQi Worker KV configuration."),
  component: LiveConfigPage,
});

const KEYS = [
  "worker_config",
  "streaming_servers",
  "home_sections",
  "hero_items",
  "tmdb_endpoints",
] as const;
type ConfigKey = (typeof KEYS)[number];
type ConfigMap = Partial<Record<ConfigKey, unknown>>;

const API_URL = import.meta.env.VITE_MAQI_ADMIN_API_URL?.replace(/\/$/, "");

function LiveConfigPage() {
  const [configs, setConfigs] = useState<ConfigMap>({});
  const [drafts, setDrafts] = useState<Partial<Record<ConfigKey, string>>>({});
  const [selected, setSelected] = useState<ConfigKey>("worker_config");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const request = useCallback(async (method: "GET" | "PUT", payload?: { key: ConfigKey; value: unknown }) => {
    if (!API_URL) throw new Error("Set VITE_MAQI_ADMIN_API_URL in Vercel to your active Cloudflare Worker origin.");
    const user = adminAuth?.currentUser;
    if (!user) throw new Error("Admin session expired. Sign in again.");
    const token = await user.getIdToken();
    const response = await fetch(`${API_URL}/api/admin/config`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(payload ? { "Content-Type": "application/json" } : {}),
      },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : `Worker returned HTTP ${response.status}`);
    return body;
  }, []);

  const reload = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const body = await request("GET");
      const next = (body.configs ?? {}) as ConfigMap;
      setConfigs(next);
      setDrafts(Object.fromEntries(KEYS.map((key) => [
        key,
        next[key] === null || next[key] === undefined ? "null" : JSON.stringify(next[key], null, 2),
      ])) as Partial<Record<ConfigKey, string>>);
      setLoaded(true);
      toast.success("Live KV configuration loaded");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Worker configuration");
    } finally {
      setBusy(false);
    }
  }, [request]);

  useEffect(() => { void reload(); }, [reload]);

  async function save() {
    const raw = drafts[selected] ?? "";
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      setError("Invalid JSON. Fix the JSON before saving.");
      return;
    }
    if (!window.confirm(`Replace the entire KV value for "${selected}"? This writes to the live Worker configuration.`)) return;
    setBusy(true);
    setError("");
    try {
      await request("PUT", { key: selected, value });
      toast.success(`Saved ${selected} to Cloudflare KV`);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  const currentText = drafts[selected] ?? "";
  const isChanged = loaded && currentText !== (configs[selected] === null || configs[selected] === undefined ? "null" : JSON.stringify(configs[selected], null, 2));

  return (
    <>
      <PageHeader eyebrow="Production backend" title="Live KV Config" />
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <p className="text-muted-foreground">This editor writes directly to live Cloudflare KV. It does not convert the raw data into the demo catalog models. Keep a backup and only save JSON whose schema you understand.</p>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label htmlFor="kv-key" className="text-sm text-muted-foreground">KV key</label>
        <select id="kv-key" className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm" value={selected} onChange={(e) => setSelected(e.target.value as ConfigKey)}>
          {KEYS.map((key) => <option key={key} value={key}>{key}</option>)}
        </select>
        <Button variant="outline" onClick={() => void reload()} disabled={busy}><RefreshCw className="mr-2 h-4 w-4" /> Reload</Button>
      </div>
      {error && <p role="alert" className="mb-3 rounded-lg border border-destructive/30 p-3 text-sm text-destructive">{error}</p>}
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-muted-foreground">{selected}</span>
          <span className="text-xs text-muted-foreground">{isChanged ? "Unsaved changes" : loaded ? "Loaded from Worker" : "Not loaded"}</span>
        </div>
        <Textarea
          value={currentText}
          onChange={(e) => setDrafts((old) => ({ ...old, [selected]: e.target.value }))}
          spellCheck={false}
          className="min-h-[55vh] font-mono text-xs leading-5"
          aria-label={`JSON value for ${selected}`}
        />
        <div className="mt-3 flex justify-end">
          <Button onClick={() => void save()} disabled={busy || !loaded || !isChanged}><Save className="mr-2 h-4 w-4" />{busy ? "Working…" : "Save to live KV"}</Button>
        </div>
      </div>
    </>
  );
}
