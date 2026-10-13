import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDelete, Empty, Field, OrderButtons, PageHeader, Ready, Tag } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { buildUrl, move, mutate, uid, useAdmin } from "@/services/store";
import type { StreamingProvider } from "@/services/types";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/providers")({
  head: pageHead("Streaming Providers", "Manage MaQi provider names, URL templates, priority and status."),
  component: ProvidersPage,
});

function ProvidersPage() {
  const s = useAdmin();
  const [editing, setEditing] = useState<StreamingProvider | null>(null);
  return (
    <>
      <PageHeader eyebrow="Playback" title="Streaming Providers" action={<Button onClick={() => setEditing({ id: uid(), name: "", movieTemplate: "", tvTemplate: "", enabled: false })}><Plus className="h-4 w-4" /> Add</Button>}>
        List order is priority (top = first tried). Only templates are managed here — playback, ad-blocking and history in the app stay as they are.
      </PageHeader>
      <Ready>
        {s.draft?.providers.length ? (
          <ul className="space-y-2">
            {s.draft.providers.map((p, i, arr) => (
              <li key={p.id} className="flex items-start gap-3 glass rounded-2xl p-3">
                <OrderButtons index={i} length={arr.length} onMove={(d) => mutate("providers", (a) => move(a, i, d), "Changed priority", p.name)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">#{i + 1}</span><p className="truncate text-sm font-medium">{p.name}</p>{!p.tvTemplate && <Tag tone="warning">movie only</Tag>}</div>
                  <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{p.movieTemplate}</p>
                  {p.tvTemplate && <p className="break-all font-mono text-[11px] text-muted-foreground">{p.tvTemplate}</p>}
                </div>
                <Switch checked={p.enabled} aria-label="Enabled" onCheckedChange={(v) => mutate("providers", (a) => a.map((x) => (x.id === p.id ? { ...x, enabled: v } : x)), v ? "Enabled provider" : "Disabled provider", p.name)} />
                <div className="flex flex-col">
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Edit" onClick={() => setEditing(p)}><Pencil className="h-4 w-4" /></Button>
                  <ConfirmDelete what={p.name} onConfirm={() => mutate("providers", (a) => a.filter((x) => x.id !== p.id), "Removed provider", p.name)} />
                </div>
              </li>
            ))}
          </ul>
        ) : <Empty>No providers configured.</Empty>}
      </Ready>
      {editing && <ProviderEditor key={editing.id} item={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function validTemplate(t: string, needsEpisode: boolean) {
  try {
    const u = new URL(t.replaceAll(/\{\w+\}/g, "x"));
    if (u.protocol !== "https:") return "Template must use https.";
  } catch { return "Not a valid URL."; }
  if (!t.includes("{tmdbId}")) return "Must include {tmdbId}.";
  if (needsEpisode && !(t.includes("{season}") && t.includes("{episode}"))) return "TV template needs {season} and {episode}.";
  return null;
}

function ProviderEditor({ item, onClose }: { item: StreamingProvider; onClose: () => void }) {
  const list = useAdmin().draft!.providers;
  const [f, setF] = useState(item);
  const [sample, setSample] = useState({ tmdbId: "12345", season: "1", episode: "1" });
  const isNew = !list.some((x) => x.id === item.id);
  function save(): void {
    if (!f.name.trim()) { toast.error("Display name is required."); return; }
    const m = validTemplate(f.movieTemplate.trim(), false);
    if (m) { toast.error(`Movie template: ${m}`); return; }
    if (f.tvTemplate.trim()) { const t = validTemplate(f.tvTemplate.trim(), true); if (t) { toast.error(`TV template: ${t}`); return; } }
    const n = { ...f, name: f.name.trim().slice(0, 60), movieTemplate: f.movieTemplate.trim(), tvTemplate: f.tvTemplate.trim() };
    mutate("providers", (a) => (isNew ? [...a, n] : a.map((x) => (x.id === n.id ? n : x))), isNew ? "Added provider" : "Edited provider", n.name);
    toast.success("Saved to draft");
    onClose();
  }
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="mx-auto max-h-[92vh] max-w-lg overflow-y-auto rounded-t-xl">
        <SheetHeader><SheetTitle>{isNew ? "Add provider" : "Edit provider"}</SheetTitle><SheetDescription>Placeholders: {"{tmdbId}"}, {"{season}"}, {"{episode}"}</SheetDescription></SheetHeader>
        <div className="space-y-4 px-4 pb-4">
          <Field label="Display name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Movie URL template"><Input className="font-mono text-xs" value={f.movieTemplate} onChange={(e) => setF({ ...f, movieTemplate: e.target.value })} /></Field>
          <Field label="TV / episode URL template" hint="Leave empty if the provider is movie-only."><Input className="font-mono text-xs" value={f.tvTemplate} onChange={(e) => setF({ ...f, tvTemplate: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm"><Switch checked={f.enabled} onCheckedChange={(v) => setF({ ...f, enabled: v })} /> Enabled</label>
          <div className="rounded-md border border-border p-3">
            <p className="eyebrow mb-2">URL preview (not opened)</p>
            <div className="mb-2 grid grid-cols-3 gap-2">
              <Input aria-label="Sample TMDB ID" className="font-mono text-xs" value={sample.tmdbId} onChange={(e) => setSample({ ...sample, tmdbId: e.target.value })} />
              <Input aria-label="Season" className="font-mono text-xs" value={sample.season} onChange={(e) => setSample({ ...sample, season: e.target.value })} />
              <Input aria-label="Episode" className="font-mono text-xs" value={sample.episode} onChange={(e) => setSample({ ...sample, episode: e.target.value })} />
            </div>
            <p className="break-all font-mono text-[11px]"><span className="text-muted-foreground">movie </span>{f.movieTemplate ? buildUrl(f.movieTemplate, sample) : "—"}</p>
            <p className="break-all font-mono text-[11px]"><span className="text-muted-foreground">tv </span>{f.tvTemplate ? buildUrl(f.tvTemplate, sample) : "—"}</p>
          </div>
          <div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button><Button className="flex-1" onClick={save}>Save to draft</Button></div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
