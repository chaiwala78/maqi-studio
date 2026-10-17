import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layers, Palette, Pencil, Plus, Settings2, Sparkles, Trash2, X } from "lucide-react";
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
  head: pageHead("Sections & Curated", "Manage dynamic home categories and curated collections for MaQi."),
  component: SectionsPage,
});

function SectionsPage() {
  const s = useAdmin();
  const [tab, setTab] = useState<"sections" | "curated">("sections");
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null);
  const [editingCollection, setEditingCollection] = useState<CuratedList | null>(null);

  const sectionsCount = s.draft?.sections?.length ?? 0;
  const curatedCount = s.draft?.curated?.length ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Home Screen Layout"
        title="Sections & Collections"
        action={
          tab === "sections" ? (
            <Button
              onClick={() =>
                setEditingSection({
                  id: `sec_${uid()}`,
                  key: "",
                  title: "",
                  enabled: true,
                  badge: "",
                  card_type: "STANDARD",
                  config: { itemLimit: 20, source: "/discover/movie?sort_by=popularity.desc" },
                })
              }
            >
              <Plus className="mr-1.5 h-4 w-4" /> Add Section
            </Button>
          ) : (
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
              <Plus className="mr-1.5 h-4 w-4" /> Add Collection
            </Button>
          )
        }
      >
        Manage both dynamic TMDB/Worker home sections and special curated movie/series spotlight collections.
      </PageHeader>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="space-y-4">
        <TabsList className="glass grid w-full grid-cols-2">
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

        {/* ================= TAB 1: HOME SECTIONS ================= */}
        <TabsContent value="sections">
          <Ready>
            {s.draft?.sections.length ? (
              <ul className="space-y-2.5">
                {s.draft.sections.map((x, i, arr) => (
                  <li key={x.id} className="glass flex items-center gap-3 rounded-2xl p-3.5">
                    <OrderButtons
                      index={i}
                      length={arr.length}
                      onMove={(d) => mutate("sections", (a) => move(a, i, d), "Reordered section", x.title)}
                    />
                    <span className="w-6 font-mono text-xs text-muted-foreground">#{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">{x.title}</p>
                        {x.badge && (
                          <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary uppercase">
                            {x.badge}
                          </span>
                        )}
                        {!x.enabled && <Tag tone="warning">Hidden</Tag>}
                      </div>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                        {x.key} · {x.config.source} · max {x.config.itemLimit} items
                      </p>
                    </div>

                    <Switch
                      checked={x.enabled}
                      aria-label="Enabled"
                      onCheckedChange={(v) =>
                        mutate(
                          "sections",
                          (a) => a.map((y) => (y.id === x.id ? { ...y, enabled: v } : y)),
                          v ? "Enabled section" : "Disabled section",
                          x.title
                        )
                      }
                    />

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Edit"
                        onClick={() => setEditingSection(x)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <ConfirmDelete
                        what={x.title}
                        onConfirm={() =>
                          mutate(
                            "sections",
                            (a) => a.filter((y) => y.id !== x.id),
                            "Deleted section",
                            x.title
                          )
                        }
                      />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>No home sections found. Tap 'Add Section' above to create one.</Empty>
            )}
          </Ready>
        </TabsContent>

        {/* ================= TAB 2: CURATED COLLECTIONS ================= */}
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
                          {col.enabled === false && <Tag tone="warning">Hidden</Tag>}
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

      {/* SECTION MODAL (ADD / EDIT) */}
      {editingSection && (
        <SectionEditorModal
          key={editingSection.id}
          item={editingSection}
          onClose={() => setEditingSection(null)}
        />
      )}

      {/* CURATED COLLECTION MODAL (ADD / EDIT) */}
      {editingCollection && (
        <CuratedCollectionModal
          key={editingCollection.id}
          item={editingCollection}
          onClose={() => setEditingCollection(null)}
        />
      )}
    </>
  );
}

function SectionEditorModal({
  item,
  onClose,
}: {
  item: HomeSection;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [key, setKey] = useState(item.key);
  const [limit, setLimit] = useState(String(item.config.itemLimit || 20));
  const [source, setSource] = useState(item.config.source || "");
  const [badge, setBadge] = useState(item.badge || "");
  const [cardType, setCardType] = useState(item.card_type || "STANDARD");

  function save(): void {
    if (!title.trim()) {
      toast.error("Section title is required.");
      return;
    }
    const cleanKey = key.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const n = Number(limit);
    if (!Number.isInteger(n) || n < 1 || n > 100) {
      toast.error("Item limit must be 1–100.");
      return;
    }
    if (!source.trim()) {
      toast.error("Backend source endpoint is required.");
      return;
    }

    const updated: HomeSection = {
      id: item.id || cleanKey,
      key: cleanKey,
      title: title.trim(),
      enabled: item.enabled !== false,
      badge: badge.trim(),
      card_type: cardType,
      config: {
        itemLimit: n,
        source: source.trim(),
      },
    };

    mutate(
      "sections",
      (a) => {
        const exists = a.some((x) => x.id === item.id);
        if (exists) {
          return a.map((x) => (x.id === item.id ? updated : x));
        }
        return [...a, updated];
      },
      item.title ? "Updated section" : "Added new section",
      updated.title
    );

    toast.success("Saved to draft");
    onClose();
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="mx-auto max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{item.title ? `Edit: ${item.title}` : "Add New Home Section"}</SheetTitle>
          <SheetDescription>Configure dynamic movies and web series shelf on the home screen.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6 pt-3">
          <Field label="Section Title">
            <Input
              placeholder="e.g. ⚡ Action Hits or South Blockbusters"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Section ID / Key" hint="Internal key for app">
              <Input
                placeholder="action_hits"
                className="font-mono text-xs"
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
            </Field>

            <Field label="Item Limit" hint="Max titles loaded (1–100)">
              <Input inputMode="numeric" value={limit} onChange={(e) => setLimit(e.target.value)} />
            </Field>
          </div>

          <Field
            label="Backend Source Endpoint"
            hint="TMDB discover route or backend proxy endpoint (e.g. /discover/movie?with_genres=28&sort_by=popularity.desc)"
          >
            <Input className="font-mono text-xs" value={source} onChange={(e) => setSource(e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Badge Label (Optional)" hint="e.g. HOT, NEW, 4K">
              <Input
                placeholder="HOT"
                className="uppercase text-xs"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
              />
            </Field>

            <Field label="Card Style">
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={cardType}
                onChange={(e) => setCardType(e.target.value)}
              >
                <option value="STANDARD">STANDARD (Vertical Poster)</option>
                <option value="SMALL">SMALL (Compact)</option>
              </select>
            </Field>
          </div>

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

function CuratedCollectionModal({
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
          <SheetTitle>{item.name ? `Edit: ${item.name}` : "Add New Curated Collection"}</SheetTitle>
          <SheetDescription>
            Curated collections appear as featured shelves and ranking lists on the mobile home screen.
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
