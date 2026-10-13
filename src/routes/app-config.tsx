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

export const Route = createFileRoute("/app-config")({
  head: pageHead("App Config", "Firebase Remote Config: maintenance mode, force update and announcements for MaQi."),
  component: AppConfigPage,
});

function AppConfigPage() {
  const [published, setPublished] = useState<RemoteConfig>(REMOTE_CONFIG_DEFAULTS);
  const [draft, setDraft] = useState<RemoteConfig>(REMOTE_CONFIG_DEFAULTS);
  useEffect(() => { const p = loadPublishedConfig(); setPublished(p); setDraft(p); }, []);

  const set = <K extends keyof RemoteConfig>(k: K, v: RemoteConfig[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const errors = validateRemoteConfig(draft);
  const changed = changedConfigKeys(published, draft);
  const hasErrors = Object.keys(errors).length > 0;

  function publish() {
    if (hasErrors) return;
    if (!window.confirm(`Publish ${changed.length} change(s)?\n\n${changed.join("\n")}`)) return;
    saveDemoConfig(draft);
    setPublished(draft);
    toast.warning("Demo — nothing was sent to Firebase", { description: "Saved locally. Connect a Firebase service account to publish for real." });
  }

  return (
    <>
      <PageHeader eyebrow="Firebase Remote Config" title="App Config" action={<Tag tone="warning">Demo</Tag>}>
        Controls the MaQi Android app live. Keys match your Firebase console and are never renamed.
      </PageHeader>

      <div className="space-y-4 pb-24">
        <Card title="Maintenance" k="maintenance_mode" on={draft.maintenance_mode} onToggle={(v) => set("maintenance_mode", v)}
          warn={draft.maintenance_mode ? "App will be blocked for all users" : undefined}>
          <Field label="maintenance_message" hint={errors.maintenance_message}>
            <Textarea rows={2} value={draft.maintenance_message} onChange={(e) => set("maintenance_message", e.target.value)} />
          </Field>
        </Card>

        <Card title="App update" k="force_update" on={draft.force_update} onToggle={(v) => set("force_update", v)}
          warn={draft.force_update ? "Users below the minimum version must update" : undefined}>
          <Field label="minimum_app_version" hint={errors.minimum_app_version}>
            <Input inputMode="decimal" value={draft.minimum_app_version} onChange={(e) => set("minimum_app_version", e.target.value)} className="font-mono" />
          </Field>
          <Field label="update_url" hint={errors.update_url}>
            <Textarea rows={3} value={draft.update_url} onChange={(e) => set("update_url", e.target.value)} className="font-mono text-xs" />
          </Field>
        </Card>

        <Card title="Announcement" k="announcement_enabled" on={draft.announcement_enabled} onToggle={(v) => set("announcement_enabled", v)}>
          <Field label="announcement_id" hint={errors.announcement_id ?? "Change this ID to show the popup again to users who dismissed it"}>
            <Input value={draft.announcement_id} onChange={(e) => set("announcement_id", e.target.value)} className="font-mono" />
          </Field>
          <Field label="announcement_title" hint={errors.announcement_title}>
            <Input value={draft.announcement_title} onChange={(e) => set("announcement_title", e.target.value)} />
          </Field>
          <Field label="announcement_message" hint={errors.announcement_message}>
            <Textarea rows={3} value={draft.announcement_message} onChange={(e) => set("announcement_message", e.target.value)} />
          </Field>
          {draft.announcement_enabled && (
            <div className="rounded-md border border-border bg-background p-3">
              <p className="eyebrow mb-1">Preview</p>
              <p className="font-semibold">{draft.announcement_title}</p>
              <p className="text-sm text-muted-foreground">{draft.announcement_message}</p>
            </div>
          )}
        </Card>
      </div>

      {changed.length > 0 && (
        <div className="fixed inset-x-0 bottom-[60px] z-30 border-t border-border bg-card px-4 py-2.5 md:bottom-0 md:left-56">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground">{changed.length}</span> config change{changed.length > 1 ? "s" : ""}{hasErrors && <span className="text-destructive"> · fix errors</span>}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setDraft(published)}>Discard</Button>
              <Button size="sm" disabled={hasErrors} onClick={publish}>Publish</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Card({ title, k, on, onToggle, warn, children }: { title: string; k: string; on: boolean; onToggle: (v: boolean) => void; warn?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-border">
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-3">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="font-mono text-[11px] text-muted-foreground">{k}</p>
        </div>
        <Switch checked={on} onCheckedChange={onToggle} aria-label={k} />
      </div>
      {warn && <p className="border-b border-warning/30 px-3 py-2 text-xs text-warning">{warn}</p>}
      <div className="space-y-3 p-3">{children}</div>
    </section>
  );
}
