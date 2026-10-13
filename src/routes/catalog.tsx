import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDelete, Empty, Field, OrderButtons, PageHeader, Poster, Ready, Tag } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { move, mutate, uid, useAdmin } from "@/services/store";
import type { CatalogItem, ContentType } from "@/services/types";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/catalog")({
  head: pageHead("Catalog", "Manage MaQi anime, movies, web series and curated anime lists."),
  component: CatalogPage,
});

const TYPES: { v: ContentType; l: string }[] = [{ v: "anime", l: "Anime" }, { v: "movie", l: "Movie" }, { v: "series", l: "Web series" }];
const blank = (): CatalogItem => ({ id: uid(), tmdbId: "", title: "", type: "movie", visibility: "visible", year: "", overview: "" });
const TMDB_RE = /^[A-Za-z0-9-]{1,32}$/;

function CatalogPage() {
  return (
    <>
      <PageHeader eyebrow="Content" title="Catalog">TMDB IDs are entered by you — the panel never guesses or looks them up.</PageHeader>
      <Ready>
        <Tabs defaultValue="titles">
          <TabsList className="mb-4"><TabsTrigger value="titles">Titles</TabsTrigger><TabsTrigger value="curated">Curated anime</TabsTrigger></TabsList>
          <TabsContent value="titles"><Titles /></TabsContent>
          <TabsContent value="curated"><Curated /></TabsContent>
        </Tabs>
      </Ready>
    </>
  );
}

function Titles() {
  const items = useAdmin().draft!.catalog;
  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | ContentType>("all");
  const [vis, setVis] = useState<"all" | "visible" | "hidden">("all");
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return items.filter((i) =>
      (type === "all" || i.type === type) && (vis === "all" || i.visibility === vis) &&
      (!n || i.title.toLowerCase().includes(n) || i.tmdbId.toLowerCase().includes(n)));
  }, [items, q, type, vis]);
  const filtering = q || type !== "all" || vis !== "all";

  return (
    <>
      <div className="mb-3 flex flex-col gap-2 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or TMDB ID" className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
            <SelectTrigger className="flex-1 md:w-32"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All types</SelectItem>{TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={vis} onValueChange={(v) => setVis(v as typeof vis)}>
            <SelectTrigger className="flex-1 md:w-32"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Any visibility</SelectItem><SelectItem value="visible">Visible</SelectItem><SelectItem value="hidden">Hidden</SelectItem></SelectContent>
          </Select>
          <Button onClick={() => setEditing(blank())}><Plus className="h-4 w-4" /> Add</Button>
        </div>
      </div>
      {filtering && <p className="mb-2 text-[11px] text-muted-foreground">Reordering is available when no filter is applied.</p>}
      {filtered.length ? (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {filtered.map((it) => {
            const idx = items.findIndex((x) => x.id === it.id);
            return (
              <li key={it.id} className="flex items-center gap-3 px-2 py-2.5">
                {!filtering && <OrderButtons index={idx} length={items.length} onMove={(d) => mutate("catalog", (a) => move(a, idx, d), "Reordered", it.title)} />}
                <Poster imageKey={it.imageKey} title={it.title} className="w-11" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{it.title}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">TMDB {it.tmdbId}{it.year && ` · ${it.year}`}</p>
                  <div className="mt-1 flex gap-1"><Tag>{it.type}</Tag>{it.visibility === "hidden" && <Tag tone="warning">hidden</Tag>}</div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Edit ${it.title}`} onClick={() => setEditing(it)}><Pencil className="h-4 w-4" /></Button>
                <ConfirmDelete what={it.title} onConfirm={() => mutate("catalog", (a) => a.filter((x) => x.id !== it.id), "Removed title", it.title)} />
              </li>
            );
          })}
        </ul>
      ) : <Empty>{items.length ? "No titles match your search." : "No titles yet. Add one with its TMDB ID."}</Empty>}
      {editing && <ItemEditor key={editing.id} item={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function ItemEditor({ item, onClose }: { item: CatalogItem; onClose: () => void }) {
  const items = useAdmin().draft!.catalog;
  const [cur, setF] = useState<CatalogItem>(item);
  const isNew = !items.some((x) => x.id === item.id);

  function save(): void {
    const tmdbId = cur.tmdbId.trim(), title = cur.title.trim();
    if (!TMDB_RE.test(tmdbId)) return toast.error("Enter a valid TMDB ID (letters, numbers, dashes).");
    if (!title || title.length > 200) return toast.error("Title is required (max 200 characters).");
    if (items.some((x) => x.tmdbId === tmdbId && x.type === cur.type && x.id !== cur.id)) return toast.error("This TMDB ID and type already exist in the catalog.");
    const next = { ...cur, tmdbId, title };
    mutate("catalog", (a) => (isNew ? [...a, next] : a.map((x) => (x.id === next.id ? next : x))), isNew ? "Added title" : "Edited title", title);
    toast.success(isNew ? "Added to draft" : "Saved to draft");
    onClose();
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="mx-auto max-h-[90vh] max-w-lg overflow-y-auto rounded-t-xl">
        <SheetHeader><SheetTitle>{isNew ? "Add title" : "Edit title"}</SheetTitle><SheetDescription>Changes are staged in the draft.</SheetDescription></SheetHeader>
        {(
          <div className="space-y-4 px-4 pb-4">
            <Field label="TMDB ID" hint="Copy from TMDB. Not auto-filled."><Input value={cur.tmdbId} onChange={(e) => setF({ ...cur, tmdbId: e.target.value })} className="font-mono" inputMode="numeric" /></Field>
            <Field label="Title"><Input value={cur.title} onChange={(e) => setF({ ...cur, title: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <Select value={cur.type} onValueChange={(v) => setF({ ...cur, type: v as ContentType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Visibility">
                <Select value={cur.visibility} onValueChange={(v) => setF({ ...cur, visibility: v as CatalogItem["visibility"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="visible">Visible</SelectItem><SelectItem value="hidden">Hidden</SelectItem></SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Year"><Input value={cur.year ?? ""} maxLength={4} onChange={(e) => setF({ ...cur, year: e.target.value.replace(/\D/g, "") })} /></Field>
            <Field label="Overview"><Textarea rows={3} maxLength={1000} value={cur.overview ?? ""} onChange={(e) => setF({ ...cur, overview: e.target.value })} /></Field>
            <div className="flex gap-2 pt-2"><Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button><Button className="flex-1" onClick={save}>Save to draft</Button></div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Curated() {
  const lists = useAdmin().draft!.curated;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {lists.map((l) => <CuratedCard key={l.id} id={l.id} />)}
    </div>
  );
}

function CuratedCard({ id }: { id: string }) {
  const l = useAdmin().draft!.curated.find((x) => x.id === id)!;
  const [val, setVal] = useState("");
  function add(): void {
    const v = val.trim();
    if (!TMDB_RE.test(v)) return toast.error("Enter a valid TMDB ID.");
    if (l.tmdbIds.includes(v)) return toast.error("Already in this list.");
    mutate("curated", (a) => a.map((x) => (x.id === id ? { ...x, tmdbIds: [...x.tmdbIds, v] } : x)), `Added ID ${v} to`, l.name);
    setVal("");
  }
  return (
    <section className="rounded-lg border border-border p-4">
      <h2 className="font-semibold">{l.name}</h2>
      <p className="mb-3 text-xs text-muted-foreground">{l.description} · {l.tmdbIds.length} IDs</p>
      <div className="mb-3 flex gap-2">
        <Input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="TMDB ID" className="font-mono" />
        <Button variant="secondary" onClick={add}><Plus className="h-4 w-4" /></Button>
      </div>
      {l.tmdbIds.length ? (
        <div className="flex flex-wrap gap-1.5">
          {l.tmdbIds.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded border border-border py-1 pl-2 pr-1 font-mono text-xs">
              {t}
              <RemoveId onConfirm={() => mutate("curated", (a) => a.map((x) => (x.id === id ? { ...x, tmdbIds: x.tmdbIds.filter((y) => y !== t) } : x)), `Removed ID ${t} from`, l.name)} label={`${t} from ${l.name}`} />
            </span>
          ))}
        </div>
      ) : <p className="text-xs text-muted-foreground">No IDs yet.</p>}
    </section>
  );
}

function RemoveId({ onConfirm, label }: { onConfirm: () => void; label: string }) {
  return (
    <button aria-label={`Remove ${label}`} onClick={() => { if (window.confirm(`Remove ${label}?`)) onConfirm(); }} className="rounded p-0.5 text-muted-foreground hover:text-destructive">
      <X className="h-3 w-3" />
    </button>
  );
}
