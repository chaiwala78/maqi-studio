import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Empty, Field, OrderButtons, PageHeader, Ready } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { move, mutate, useAdmin } from "@/services/store";
import type { HomeSection } from "@/services/types";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/sections")({
  head: pageHead("Home Sections", "Reorder, enable and configure existing MaQi home sections."),
  component: SectionsPage,
});

function SectionsPage() {
  const s = useAdmin();
  const [editing, setEditing] = useState<HomeSection | null>(null);
  return (
    <>
      <PageHeader eyebrow="Home" title="Home Sections">Only existing sections are listed. Names and keys come from the app and aren't changed here.</PageHeader>
      <Ready>
        {s.draft?.sections.length ? (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {s.draft.sections.map((x, i, arr) => (
              <li key={x.id} className="flex items-center gap-3 px-2 py-3">
                <OrderButtons index={i} length={arr.length} onMove={(d) => mutate("sections", (a) => move(a, i, d), "Reordered section", x.title)} />
                <span className="w-5 font-mono text-xs text-muted-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{x.title}</p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">{x.key} · {x.config.source} · max {x.config.itemLimit}</p>
                </div>
                <Switch checked={x.enabled} aria-label="Enabled" onCheckedChange={(v) => mutate("sections", (a) => a.map((y) => (y.id === x.id ? { ...y, enabled: v } : y)), v ? "Enabled section" : "Disabled section", x.title)} />
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Configure" onClick={() => setEditing(x)}><Settings2 className="h-4 w-4" /></Button>
              </li>
            ))}
          </ul>
        ) : <Empty>No sections found.</Empty>}
      </Ready>
      {editing && <SectionEditor key={editing.id} item={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function SectionEditor({ item, onClose }: { item: HomeSection; onClose: () => void }) {
  const [limit, setLimit] = useState(String(item.config.itemLimit));
  const [source, setSource] = useState(item.config.source);
  function save(): void {
    const n = Number(limit);
    if (!Number.isInteger(n) || n < 1 || n > 100) { toast.error("Item limit must be 1–100."); return; }
    if (!source.trim() || source.length > 100) { toast.error("Source is required."); return; }
    mutate("sections", (a) => a.map((y) => (y.id === item.id ? { ...y, config: { itemLimit: n, source: source.trim() } } : y)), "Configured section", item.title);
    toast.success("Saved to draft");
    onClose();
  }
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-xl">
        <SheetHeader><SheetTitle>{item.title}</SheetTitle><SheetDescription className="font-mono text-xs">{item.key} (read-only)</SheetDescription></SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          <Field label="Item limit"><Input inputMode="numeric" value={limit} onChange={(e) => setLimit(e.target.value)} /></Field>
          <Field label="Source" hint="Provisional field — real config keys to be confirmed from the Worker."><Input className="font-mono" value={source} onChange={(e) => setSource(e.target.value)} /></Field>
          <div className="flex gap-2"><Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button><Button className="flex-1" onClick={save}>Save to draft</Button></div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
