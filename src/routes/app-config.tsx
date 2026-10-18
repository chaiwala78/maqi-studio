import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader, Field, Tag } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Sparkles,
  Copy,
  Download,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { pageHead } from "@/lib/head";
import {
  REMOTE_CONFIG_DEFAULTS,
  changedConfigKeys,
  loadPublishedConfig,
  saveDemoConfig,
  validateRemoteConfig,
  type RemoteConfig,
} from "@/services/remote-config";
import {
  loadLiveRemoteConfig,
  publishLiveRemoteConfig,
  getSavedGoogleAccessToken,
  requestRemoteConfigGoogleAuth,
  generateFirebaseRemoteConfigTemplate,
} from "@/lib/firebase";

export const Route = createFileRoute("/app-config")({
  head: pageHead(
    "App Config",
    "Firebase Remote Config: maintenance mode, force update and announcements for MaQi."
  ),
  component: AppConfigPage,
});

function AppConfigPage() {
  const [published, setPublished] = useState<RemoteConfig>(REMOTE_CONFIG_DEFAULTS);
  const [draft, setDraft] = useState<RemoteConfig>(REMOTE_CONFIG_DEFAULTS);
  const [busy, setBusy] = useState(false);
  const [googleConnected, setGoogleConnected] = useState<boolean>(false);
  const [syncingGoogle, setSyncingGoogle] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if Google OAuth token exists
    const token = getSavedGoogleAccessToken();
    setGoogleConnected(Boolean(token));

    async function load() {
      const live = await loadLiveRemoteConfig();
      if (live) {
        const merged: RemoteConfig = { ...REMOTE_CONFIG_DEFAULTS, ...live };
        setPublished(merged);
        setDraft(merged);
      } else {
        const p = loadPublishedConfig();
        setPublished(p);
        setDraft(p);
      }
    }
    void load();
  }, []);

  const set = <K extends keyof RemoteConfig>(k: K, v: RemoteConfig[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));
  const errors = validateRemoteConfig(draft);
  const changed = changedConfigKeys(published, draft);
  const hasErrors = Object.keys(errors).length > 0;

  async function handleConnectGoogle() {
    setSyncingGoogle(true);
    try {
      await requestRemoteConfigGoogleAuth();
      setGoogleConnected(true);
      toast.success("Connected to Google Cloud & Firebase Remote Config! 🚀");
      // Try reloading live parameters directly from Google
      const live = await loadLiveRemoteConfig();
      if (live) {
        const merged: RemoteConfig = { ...REMOTE_CONFIG_DEFAULTS, ...live };
        setPublished(merged);
        setDraft(merged);
      }
    } catch (err: any) {
      toast.error("Google authentication failed: " + (err.message || "Unknown error"));
    } finally {
      setSyncingGoogle(false);
    }
  }

  async function publish() {
    if (hasErrors) return;
    if (
      !window.confirm(
        `Publish ${changed.length} change(s) live to Firebase Remote Config & Mobile App?\n\n${changed.join("\n")}`
      )
    )
      return;

    setBusy(true);
    try {
      const res = await publishLiveRemoteConfig(draft);
      saveDemoConfig(draft);
      setPublished(draft);

      if (res.remoteConfigApiUpdated) {
        toast.success(
          `Published directly to Firebase Remote Config! Version: ${res.versionNumber || "updated"} 🚀`
        );
      } else if (res.apiError) {
        toast.warning(
          "Saved to Firestore & Cloudflare KV! Note: Firebase Remote Config API returned: " +
            res.apiError +
            ". You can use the 1-Click JSON tool below to update Firebase Console in 2 seconds."
        );
      } else {
        toast.success("Saved to Firestore & Edge KV! Connect your Google Account for instant Remote Config API push.");
      }
    } catch (err: any) {
      toast.error("Failed to publish config: " + (err.message || "Unknown error"));
    } finally {
      setBusy(false);
    }
  }

  function handleCopyJson() {
    const template = generateFirebaseRemoteConfigTemplate(draft);
    const jsonStr = JSON.stringify(template, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    toast.success("Firebase Remote Config JSON copied to clipboard! 📋", {
      description: "Paste into Firebase Console ➔ Remote Config ➔ Publish a template.",
    });
    setTimeout(() => setCopied(false), 2500);
  }

  function handleDownloadJson() {
    const template = generateFirebaseRemoteConfigTemplate(draft);
    const jsonStr = JSON.stringify(template, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `remote_config_maqi_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Downloaded remote_config.json 📥");
  }

  return (
    <>
      <PageHeader
        eyebrow="Firebase Remote Config"
        title="App Remote Control"
        action={
          <div className="flex items-center gap-2">
            {googleConnected ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Remote Config API Active
              </span>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleConnectGoogle}
                disabled={syncingGoogle}
                className="h-8 gap-1.5 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {syncingGoogle ? "Connecting..." : "Connect Firebase API"}
              </Button>
            )}
          </div>
        }
      >
        Controls the MaQi Android app live in real-time. Changes to maintenance mode, force update, and popup notices reflect immediately on all user devices.
      </PageHeader>

      <div className="space-y-5 pb-28">
        {/* FIREBASE API SYNC & 1-CLICK JSON HELPER CARD */}
        <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-4 sm:p-5 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600/20 text-red-500">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Firebase Remote Config Integration</h3>
                <p className="text-[11px] text-neutral-400">
                  Project: <code className="text-red-400">maqi-f2c36</code> · Parameter Schema v24
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyJson}
                className="h-8 gap-1.5 text-xs bg-neutral-800/80 hover:bg-neutral-700 text-white border-white/10"
              >
                {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy Firebase JSON"}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadJson}
                className="h-8 gap-1.5 text-xs bg-neutral-800/80 hover:bg-neutral-700 text-white border-white/10"
              >
                <Download className="h-3.5 w-3.5" /> Download JSON
              </Button>

              <a
                href="https://console.firebase.google.com/project/maqi-f2c36/config"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-white/10 bg-neutral-800/80 px-3 text-xs font-medium text-white hover:bg-neutral-700 transition"
              >
                Firebase Console <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <div className="pt-3 text-[11px] text-neutral-400 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Jab aap <strong className="text-white">&quot;Publish to App&quot;</strong> dabate hain, ye seedha Firebase Remote Config REST API, Firestore document, aur Cloudflare Worker ko update karta hai.
            </span>
          </div>
        </div>

        {/* 1. MAINTENANCE MODE */}
        <Card
          title="Maintenance Mode"
          k="maintenance_mode"
          on={draft.maintenance_mode}
          onToggle={(v) => set("maintenance_mode", v)}
          warn={
            draft.maintenance_mode
              ? "⚠️ App will be blocked for ALL users with the maintenance screen"
              : undefined
          }
        >
          <Field label="Maintenance Message shown to users" hint={errors.maintenance_message}>
            <Textarea
              rows={3}
              value={draft.maintenance_message}
              onChange={(e) => set("maintenance_message", e.target.value)}
              className="font-mono text-xs"
            />
          </Field>
        </Card>

        {/* 2. FORCE APP UPDATE */}
        <Card
          title="Force App Update"
          k="force_update"
          on={draft.force_update}
          onToggle={(v) => set("force_update", v)}
          warn={draft.force_update ? "Users on an older version must update before watching" : undefined}
        >
          <Field label="Minimum Required Version (e.g. 1.0 or 2.1)" hint={errors.minimum_app_version}>
            <Input
              inputMode="decimal"
              value={draft.minimum_app_version}
              onChange={(e) => set("minimum_app_version", e.target.value)}
              className="font-mono"
            />
          </Field>
          <Field label="New APK Download Link" hint={errors.update_url}>
            <Textarea
              rows={2}
              value={draft.update_url}
              onChange={(e) => set("update_url", e.target.value)}
              className="font-mono text-xs"
            />
          </Field>
        </Card>

        {/* 3. GLOBAL POPUP ANNOUNCEMENT */}
        <Card
          title="Global Popup Announcement"
          k="announcement_enabled"
          on={draft.announcement_enabled}
          onToggle={(v) => set("announcement_enabled", v)}
        >
          <Field
            label="Announcement ID"
            hint={
              errors.announcement_id ??
              "Change ID (e.g. v2_update) to re-show the popup to users who already dismissed it"
            }
          >
            <Input
              value={draft.announcement_id}
              onChange={(e) => set("announcement_id", e.target.value)}
              className="font-mono"
            />
          </Field>
          <Field label="Notice Title" hint={errors.announcement_title}>
            <Input
              value={draft.announcement_title}
              onChange={(e) => set("announcement_title", e.target.value)}
            />
          </Field>
          <Field label="Notice Message" hint={errors.announcement_message}>
            <Textarea
              rows={3}
              value={draft.announcement_message}
              onChange={(e) => set("announcement_message", e.target.value)}
            />
          </Field>
          {draft.announcement_enabled && (
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-3.5">
              <p className="eyebrow mb-1 text-primary">In-App Preview</p>
              <p className="font-semibold text-foreground">{draft.announcement_title || "Notice Title"}</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {draft.announcement_message || "Message content..."}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* FLOATING ACTION BAR FOR PUBLISHING CHANGES */}
      {changed.length > 0 && (
        <div className="fixed inset-x-0 bottom-[60px] z-30 border-t border-border bg-card/95 backdrop-blur-xl px-4 py-3 md:bottom-0 md:left-56 shadow-2xl">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground font-semibold">{changed.length}</span> pending change
              {changed.length > 1 ? "s" : ""}
              {hasErrors && <span className="text-destructive"> · please fix errors</span>}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setDraft(published)}>
                Discard
              </Button>
              <Button
                size="sm"
                disabled={hasErrors || busy}
                onClick={publish}
                className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 font-semibold"
              >
                {busy ? "Publishing..." : "Publish to App & Firebase"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Card({
  title,
  k,
  on,
  onToggle,
  warn,
  children,
}: {
  title: string;
  k: string;
  on: boolean;
  onToggle: (v: boolean) => void;
  warn?: string | undefined;
  children: ReactNode;
}) {
  return (
    <section className="glass rounded-2xl p-4 md:p-5 border border-white/5 bg-neutral-950/60">
      <div className="flex items-center justify-between gap-3 pb-3">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="font-mono text-xs text-muted-foreground">{k}</p>
        </div>
        <Switch checked={on} aria-label={title} onCheckedChange={onToggle} />
      </div>
      {warn && (
        <p className="mb-3 rounded-lg border border-warning/30 bg-warning/10 p-2.5 text-xs text-warning">
          {warn}
        </p>
      )}
      <div className="space-y-3">{children}</div>
    </section>
  );
}
