import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layers, Palette, Pencil, Plus, Settings2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDelete, Empty, Field, OrderButtons, PageHeader, Ready, Tag } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { move, mutate, uid, useAdmin } from "@/services/store";
import type { CuratedList, HomeSection } from "@/services/types";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/sections")({
  head: pageHead("Sections & Collections", "Manage dynamic home sections and curated movie/series collections for MaQi."),
  component: SectionsAndCollectionsPage,
});

function SectionsAndCollectionsPage() {
  const s = useAdmin();
  const [activeTab, setActiveTab] = useState<"sections" | "curated">("sections");
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null);
  const [editingCollection, setEditingCollection] = useState<CuratedList | null>(null);

  const curatedCount = s.draft?.curated?.length ?? 0;
  const sectionsCount = s.draft?.sections?.length ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Home Screen Layout"
        title="Sections & Collections"
        action={
          activeTab === "curated" ? (
            <Button
              onClick={() =>
                setEditingCollection({
                  id: `col_${uid()}`,
                  name: "",
                  description: "",
                  badge: "FEATURED",
                  themeColor: "#E50914",
                  bannerImage: "",
                  enabled: true,
                  tmdbIds: [],
                })
              }
            >
              <Plus className="mr-1 h-4 w-4" /> Add Collection
            </Button>
          ) : undefined
        }
      >
        Configure how categories, genres, and special thematic curated collections appear on the MaQi mobile app.
      </PageHeader>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList className="glass">
          <TabsTrigger value="sections" className="gap-2">
            <Layers className="h-4 w-4" />
            <span>Home Sections</span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{sectionsCount}</span>
          </TabsTrigger>
          <TabsTrigger value="curated" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span>Curated Collections</span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{curatedCount}</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: HOME SECTIONS */}
        <TabsContent value="sections">
          <Ready>
            {s.draft?.sections.length ? (
              <ul className="glass divide-y divide-border overflow-hidden rounded-2xl">
                {s.draft.sections.map((x, i, arr) => (
                  <li key={x.id} className="flex items-center gap-3 px-3 py-3.5">
                    <OrderButtons
                      index={i}
                      length={arr.length}
                      onMove={(d) => mutate("sections", (a) => move(a, i, d), "Reordered section", x.title)}
                    />
                    <span className="w-6 font-mono text-xs text-muted-foreground">#{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{x.title}</p>
                      <p className="truncate font-mono text-[11px] text-muted-foreground">
                        {x.key} · {x.config.source} · max {x.config.itemLimit} items
                      </p>
                    </div>
                    <Switch
                      checked={x.enabled}
                      aria-label="Enabled"
                      onCheckedChange={(v) =>
                        mutate("sections", (a) => a.map((y) => (y.id === x.id ? { ...y, enabled: v } : y)), v ? "Enabled section" : "Disabled section", x.title)
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Configure"
                      onClick={() => setEditingSection(x)}
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>No sections found in configuration.</Empty>
            )}
          </Ready>
        </TabsContent>

        {/* TAB 2: CURATED COLLECTIONS */}
        <TabsContent value="curated">
          <Ready>
            {s.draft?.curated.length ? (
              <ul className="space-y-3">
                {s.draft.curated.map((col, i, arr) => {
                  const theme = col.themeColor || "#E50914";
                  return (
                    <li key={col.id} className="glass flex items-start gap-3 rounded-2xl p-3.5">
                      <OrderButtons
                        index={i}
                        length={arr.length}
                        onMove={(d) => mutate("curated", (a) => move(a, i, d), "Reordered collection", col.name)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">#{i + 1}</span>
                          <span
                            className="h-3 w-3 rounded-full border border-white/20 shrink-0"
                            style={{ backgroundColor: theme }}
                            title={`Theme color: ${theme}`}
                          />
                          <p className="truncate text-sm font-semibold">{col.name}</p>
                          {col.badge && (
                            <span
                              className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                              style={{ backgroundColor: theme }}
                            >
                              {col.badge}
                            </span>
                          )}
                          <Tag tone="neutral">{col.tmdbIds.length} titles</Tag>
                        </div>

                        {col.description && (
                          <p className="mt-1 text-xs text-muted-foreground">{col.description}</p>
                        )}

                        <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-[11px] text-muted-foreground">
                          <span className="rounded bg-black/40 px-2 py-0.5">ID: {col.id}</span>
                          {col.tmdbIds.length > 0 && (
                            <span className="rounded bg-black/40 px-2 py-0.5">
                              TMDB: {col.tmdbIds.slice(0, 5).join(", ")}
                              {col.tmdbIds.length > 5 ? ` +${col.tmdbIds.length - 5} more` : ""}
                            </span>
                          )}
                        </div>
                      </div>

                      <Switch
                        checked={col.enabled !== false}
                        aria-label="Enabled"
                        onCheckedChange={(v) =>
                          mutate(
                            "curated",
                            (a) => a.map((c) => (c.id === col.id ? { ...c, enabled: v } : c)),
                            v ? "Enabled collection" : "Disabled collection",
                            col.name
                          )
                        }
                      />

                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Edit"
                          onClick={() => setEditingCollection(col)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <ConfirmDelete
                          what={col.name}
                          onConfirm={() =>
                            mutate(
                              "curated",
                              (a) => a.filter((c) => c.id !== col.id),
                              "Deleted collection",
                              col.name
                            )
                          }
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Empty>No curated collections found. Tap 'Add Collection' above to create one.</Empty>
            )}
          </Ready>
        </TabsContent>
      </Tabs>

      {/* SECTION EDITOR SHEET */}
      {editingSection && (
        <SectionEditor key={editingSection.id} item={editingSection} onClose={() => setEditingSection(null)} />
      )}

      {/* CURATED COLLECTION EDITOR SHEET */}
      {editingCollection && (
        <CuratedCollectionEditor
          key={editingCollection.id}
          item={editingCollection}
          onClose={() => setEditingCollection(null)}
        />
      )}
    </>
  );
}

function SectionEditor({ item, onClose }: { item: HomeSection; onClose: () => void }) {
  const [limit, setLimit] = useState(String(item.config.itemLimit));
  const [source, setSource] = useState(item.config.source);

  function save(): void {
    const n = Number(limit);
    if (!Number.isInteger(n) || n < 1 || n > 100) {
      toast.error("Item limit must be 1–100.");
      return;
    }
    if (!source.trim() || source.length > 150) {
      toast.error("Source is required.");
      return;
    }
    mutate(
      "sections",
      (a) =>
        a.map((y) =>
          y.id === item.id ? { ...y, config: { itemLimit: n, source: source.trim() } } : y
        ),
      "Configured section",
      item.title
    );
    toast.success("Saved to draft");
    onClose();
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{item.title}</SheetTitle>
          <SheetDescription className="font-mono text-xs">{item.key} (read-only)</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6 pt-2">
          <Field label="Item limit">
            <Input inputMode="numeric" value={limit} onChange={(e) => setLimit(e.target.value)} />
          </Field>
          <Field label="Endpoint Source" hint="Backend TMDB endpoint or internal route.">
            <Input className="font-mono text-xs" value={source} onChange={(e) => setSource(e.target.value)} />
          </Field>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={save}>
              Save to draft
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function CuratedCollectionEditor({
  item,
  onClose,
}: {
  item: CuratedList;
  onClose: () => void;
}) {
  const [id, setId] = useState(item.id);
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description || "");
  const [badge, setBadge] = useState(item.badge || "ACTION");
  const [themeColor, setThemeColor] = useState(item.themeColor || "#E50914");
  const [bannerImage, setBannerImage] = useState(item.bannerImage || "");
  const [idsInput, setIdsInput] = useState(item.tmdbIds.join(", "));

  function save(): void {
    if (!name.trim()) {
      toast.error("Collection title is required.");
      return;
    }
    const cleanId = id.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const parsedIds = idsInput
      .split(/[,\s]+/)
      .map((x) => x.trim())
      .filter((x) => /^\d+$/.test(x));

    const updated: CuratedList = {
      id: cleanId,
      name: name.trim(),
      description: description.trim(),
      badge: badge.trim().toUpperCase(),
      themeColor: themeColor.trim() || "#E50914",
      bannerImage: bannerImage.trim(),
      enabled: item.enabled !== false,
      tmdbIds: Array.from(new Set(parsedIds)),
    };

    mutate(
      "curated",
      (a) => {
        const exists = a.some((c) => c.id === item.id);
        if (exists) {
          return a.map((c) => (c.id === item.id ? updated : c));
        }
        return [updated, ...a];
      },
      item.name ? "Updated collection" : "Added collection",
      updated.name
    );

    toast.success("Saved to draft");
    onClose();
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="mx-auto max-w-xl max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{item.name ? `Edit: ${item.name}` : "New Curated Collection"}</SheetTitle>
          <SheetDescription>
            Curated collections appear as featured shelves on the MaQi mobile home screen.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-6 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Collection Title">
              <Input
                placeholder="e.g. Action Blockbusters"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>

            <Field label="Collection ID" hint="Unique key (e.g. action_hits)">
              <Input
                placeholder="action_blockbusters"
                value={id}
                className="font-mono text-xs"
                onChange={(e) => setId(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Subtitle / Tagline">
            <Input
              placeholder="e.g. High octane thrillers & battles"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Badge Text" hint="Small label on card (e.g. ACTION, SURVIVAL)">
              <Input
                placeholder="ACTION"
                value={badge}
                className="uppercase"
                onChange={(e) => setBadge(e.target.value)}
              />
            </Field>

            <Field label="Theme Color" hint="Hex color code">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={themeColor.startsWith("#") ? themeColor : "#E50914"}
                  onChange={(e) => setThemeColor(e.target.value)}
                  className="h-9 w-10 cursor-pointer rounded border border-border bg-transparent p-0.5"
                />
                <Input
                  placeholder="#E50914"
                  value={themeColor}
                  className="font-mono text-xs"
                  onChange={(e) => setThemeColor(e.target.value)}
                />
              </div>
            </Field>
          </div>

          <Field label="Banner Image URL (Optional)" hint="Header background image">
            <Input
              placeholder="https://image.tmdb.org/t/p/w1280/..."
              value={bannerImage}
              className="text-xs"
              onChange={(e) => setBannerImage(e.target.value)}
            />
          </Field>

          <Field
            label="TMDB Movie & Series IDs"
            hint="Enter numeric TMDB IDs separated by commas or spaces. Order determines ranking in app."
          >
            <textarea
              className="w-full min-h-[90px] rounded-md border border-input bg-transparent px-3 py-2 text-xs font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="533535, 579974, 866398, 734253, 986056, 27205"
              value={idsInput}
              onChange={(e) => setIdsInput(e.target.value)}
            />
          </Field>

          <div className="flex gap-2 pt-3">
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={save}>
              Save to draft
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
