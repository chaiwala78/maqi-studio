import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDelete, Empty, Field, OrderButtons, PageHeader, Poster, Ready, Tag } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { move, mutate, uid, useAdmin } from "@/services/store";
import type { ContentType, HeroBanner } from "@/services/types";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/banners")({
  head: pageHead("Hero Banners", "Add, order, enable and preview MaQi hero banners."),
  component: BannersPage,
});

function BannerPreview({ b }: { b: HeroBanner }) {
  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-border">
      <Poster imageKey={b.imageKey} title={b.title} className="absolute inset-0 aspect-auto h-full w-full rounded-none" />
      <div className="scrim-bottom absolute inset-0" />
      <div className="absolute bottom-0 p-4">
        <Tag>{b.type}</Tag>
        <p className="mt-1 font-display text-2xl font-semibold">{b.title || "Untitled"}</p>
        <p className="text-sm text-muted-foreground">{b.tagline}</p>
      </div>
    </div>
  );
}

function BannersPage() {
  const s = useAdmin();
  const [editing, setEditing] = useState<HeroBanner | null>(null);
  const [preview, setPreview] = useState<HeroBanner | null>(null);
  return (
    <>
      <PageHeader eyebrow="Home" title="Hero Banners" action={<Button onClick={() => setEditing({ id: uid(), tmdbId: "", title: "", type: "movie", tagline: "", enabled: false })}><Plus className="h-4 w-4" /> Add</Button>}>
        Order here is the display order in the app. New banners start disabled.
      </PageHeader>
      <Ready>
        {s.draft?.banners.length ? (
          <ul className="space-y-2">
            {s.draft.banners.map((b, i, arr) => (
              <li key={b.id} className="glass flex items-center gap-3 rounded-2xl p-2">
                <OrderButtons index={i} length={arr.length} onMove={(d) => mutate("banners", (a) => move(a, i, d), "Reordered banner", b.title)} />
                <button onClick={() => setPreview(b)} className="relative w-24 shrink-0 overflow-hidden rounded md:w-36" aria-label={`Preview ${b.title}`}>
                  <Poster imageKey={b.imageKey} title={b.title} className="aspect-video w-full" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{i + 1}. {b.title}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">TMDB {b.tmdbId} · {b.type}</p>
                </div>
                <Switch checked={b.enabled} aria-label="Enabled" onCheckedChange={(v) => mutate("banners", (a) => a.map((x) => (x.id === b.id ? { ...x, enabled: v } : x)), v ? "Enabled banner" : "Disabled banner", b.title)} />
                <div className="flex flex-col md:flex-row">
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Edit" onClick={() => setEditing(b)}><Pencil className="h-4 w-4" /></Button>
                  <ConfirmDelete what={b.title} onConfirm={() => mutate("banners", (a) => a.filter((x) => x.id !== b.id), "Removed banner", b.title)} />
                </div>
              </li>
            ))}
          </ul>
        ) : <Empty>No hero banners.</Empty>}
      </Ready>
      {editing && <BannerEditor key={editing.id} item={editing} onClose={() => setEditing(null)} />}
      <Sheet open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <SheetContent side="bottom" className="mx-auto max-w-2xl rounded-t-xl">
          <SheetHeader><SheetTitle>Banner preview</SheetTitle><SheetDescription>Approximation of the hero area. The real app layout is unchanged.</SheetDescription></SheetHeader>
          <div className="px-4 pb-6">{preview && <BannerPreview b={preview} />}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function BannerEditor({ item, onClose }: { item: HeroBanner; onClose: () => void }) {
  const list = useAdmin().draft!.banners;
  const [f, setF] = useState(item);
  const [showPreview, setShowPreview] = useState(false);
  const isNew = !list.some((x) => x.id === item.id);
  function save(): void {
    if (!/^[A-Za-z0-9-]{1,32}$/.test(f.tmdbId.trim())) { toast.error("Enter a valid TMDB ID."); return; }
    if (!f.title.trim()) { toast.error("Title is required."); return; }
    const n = { ...f, tmdbId: f.tmdbId.trim(), title: f.title.trim().slice(0, 120), tagline: f.tagline.slice(0, 160) };
    mutate("banners", (a) => (isNew ? [...a, n] : a.map((x) => (x.id === n.id ? n : x))), isNew ? "Added banner" : "Edited banner", n.title);
    toast.success("Saved to draft");
    onClose();
  }
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="mx-auto max-h-[92vh] max-w-lg overflow-y-auto rounded-t-xl">
        <SheetHeader><SheetTitle>{isNew ? "Add banner" : "Edit banner"}</SheetTitle><SheetDescription>Preview before saving to draft.</SheetDescription></SheetHeader>
        <div className="space-y-4 px-4 pb-4">
          <Field label="TMDB ID"><Input className="font-mono" value={f.tmdbId} onChange={(e) => setF({ ...f, tmdbId: e.target.value })} /></Field>
          <Field label="Title"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label="Tagline"><Input value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} /></Field>
          <div className="grid grid-cols-2 items-end gap-3">
            <Field label="Content type">
              <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v as ContentType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="anime">Anime</SelectItem><SelectItem value="movie">Movie</SelectItem><SelectItem value="series">Web series</SelectItem></SelectContent>
              </Select>
            </Field>
            <label className="flex h-9 items-center gap-2 text-sm"><Switch checked={f.enabled} onCheckedChange={(v) => setF({ ...f, enabled: v })} /> Enabled</label>
          </div>
          <Button variant="secondary" className="w-full" onClick={() => setShowPreview((v) => !v)}><Eye className="h-4 w-4" /> {showPreview ? "Hide preview" : "Preview"}</Button>
          {showPreview && <BannerPreview b={f} />}
          <div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button><Button className="flex-1" onClick={save}>Save to draft</Button></div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
