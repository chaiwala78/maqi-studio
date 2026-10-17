import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader, Field, Tag } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { pageHead } from "@/lib/head";
import {
  REMOTE_CONFIG_DEFAULTS, changedConfigKeys, loadPublishedConfig, saveDemoConfig, validateRemoteConfig,
  type RemoteConfig,
} from "@/services/remote-config";
import { loadLiveRemoteConfig, publishLiveRemoteConfig } from "@/lib/firebase";

export const Route = createFileRoute("/app-config")({
  head: pageHead("App Config", "Firebase Remote Config: maintenance mode, force update and announcements for MaQi."),
  component: AppConfigPage,
});

function AppConfigPage() {
  const [published, setPublished] = useState<RemoteConfig>(REMOTE_CONFIG_DEFAULTS);
  const [draft, setDraft] = useState<RemoteConfig>(REMOTE_CONFIG_DEFAULTS);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
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

  const set = <K extends keyof RemoteConfig>(k: K, v: RemoteConfig[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const errors = validateRemoteConfig(draft);
  const changed = changedConfigKeys(published, draft);
  const hasErrors = Object.keys(errors).length > 0;

  async function publish() {
    if (hasErrors) return;
    if (!window.confirm(`Publish ${changed.length} change(s) live to Firebase & Mobile App?\n\n${changed.join("\n")}`)) return;
    setBusy(true);
    try {
      await publishLiveRemoteConfig(draft);
      saveDemoConfig(draft);
      setPublished(draft);
      toast.success("Published live to Firebase & MaQi Mobile App! 🚀");
    } catch (err) {
      toast.error("Failed to publish config to Firebase");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Firebase Remote Config"
        title="App Remote Control"
        action={<Tag tone="primary">Live Firebase Connected</Tag>}
      >
        Controls the MaQi Android app live in real-time. Changes to maintenance mode, force update, and popup notices reflect immediately on all user devices.
      </PageHeader>

      <div className="space-y-4 pb-24">
        <Card
          title="Maintenance Mode"
          k="maintenance_mode"
          on={draft.maintenance_mode}
          onToggle={(v) => set("maintenance_mode", v)}
          warn={draft.maintenance_mode ? "⚠️ App will be blocked for ALL users with the maintenance screen" : undefined}
        >
          <Field label="Maintenance Message shown to users" hint={errors.maintenance_message}>
            <Textarea rows={2} value={draft.maintenance_message} onChange={(e) => set("maintenance_message", e.target.value)} />
          </Field>
        </Card>

        <Card
          title="Force App Update"
          k="force_update"
          on={draft.force_update}
          onToggle={(v) => set("force_update", v)}
          warn={draft.force_update ? "Users on an older version must update before watching" : undefined}
        >
          <Field label="Minimum Required Version (e.g. 1.0 or 2.1)" hint={errors.minimum_app_version}>
            <Input inputMode="decimal" value={draft.minimum_app_version} onChange={(e) => set("minimum_app_version", e.target.value)} className="font-mono" />
          </Field>
          <Field label="New APK Download Link" hint={errors.update_url}>
            <Textarea rows={3} value={draft.update_url} onChange={(e) => set("update_url", e.target.value)} className="font-mono text-xs" />
          </Field>
        </Card>

        <Card
          title="Global Popup Announcement"
          k="announcement_enabled"
          on={draft.announcement_enabled}
          onToggle={(v) => set("announcement_enabled", v)}
        >
          <Field label="Announcement ID" hint={errors.announcement_id ?? "Change ID (e.g. v2_update) to re-show the popup to users who already dismissed it"}>
            <Input value={draft.announcement_id} onChange={(e) => set("announcement_id", e.target.value)} className="font-mono" />
          </Field>
          <Field label="Notice Title" hint={errors.announcement_title}>
            <Input value={draft.announcement_title} onChange={(e) => set("announcement_title", e.target.value)} />
          </Field>
          <Field label="Notice Message" hint={errors.announcement_message}>
            <Textarea rows={3} value={draft.announcement_message} onChange={(e) => set("announcement_message", e.target.value)} />
          </Field>
          {draft.announcement_enabled && (
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-3.5">
              <p className="eyebrow mb-1 text-primary">In-App Preview</p>
              <p className="font-semibold text-foreground">{draft.announcement_title || "Notice Title"}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{draft.announcement_message || "Message content..."}</p>
            </div>
          )}
        </Card>
      </div>

      {changed.length > 0 && (
        <div className="fixed inset-x-0 bottom-[60px] z-30 border-t border-border bg-card/90 backdrop-blur px-4 py-2.5 md:bottom-0 md:left-56">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground font-semibold">{changed.length}</span> pending change{changed.length > 1 ? "s" : ""}{hasErrors && <span className="text-destructive"> · please fix errors</span>}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setDraft(published)}>Discard</Button>
              <Button size="sm" disabled={hasErrors || busy} onClick={publish}>{busy ? "Publishing..." : "Publish to App"}</Button>
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
    <section className="glass rounded-2xl p-4 md:p-5">
      <div className="flex items-center justify-between gap-3 pb-3">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="font-mono text-xs text-muted-foreground">{k}</p>
        </div>
        <Switch checked={on} aria-label={title} onCheckedChange={onToggle} />
      </div>
      {warn && <p className="mb-3 rounded-lg border border-warning/30 bg-warning/10 p-2.5 text-xs text-warning">{warn}</p>}
      <div className="space-y-3">{children}</div>
    </section>
  );
}
