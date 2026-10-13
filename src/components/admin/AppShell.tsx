import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Clapperboard, GalleryHorizontal, LayoutGrid, LayoutList, MoreHorizontal, Radio, Settings, Users, Loader2, SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { changedKeys, discardDraft, loadAdmin, publishDraft, useAdmin } from "@/services/store";
import { adminService } from "@/services/admin-service";
import type { DataKey } from "@/services/types";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutGrid },
  { to: "/catalog", label: "Catalog", icon: Clapperboard },
  { to: "/banners", label: "Banners", icon: GalleryHorizontal },
  { to: "/sections", label: "Sections", icon: LayoutList },
  { to: "/app-config", label: "App Config", icon: SlidersHorizontal },
  { to: "/providers", label: "Providers", icon: Radio },
  { to: "/users", label: "Admins", icon: Users },
  { to: "/settings", label: "Settings & Log", icon: Settings },
] as const;

const KEY_LABEL: Record<DataKey, string> = {
  catalog: "Catalog", curated: "Curated anime lists", banners: "Hero banners",
  sections: "Home sections", providers: "Streaming providers", admins: "Admins",
};

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [more, setMore] = useState(false);
  useEffect(() => { void loadAdmin(); }, []);

  const isActive = (to: string) => (to === "/" ? path === "/" : path.startsWith(to));

  return (
    <div className="min-h-screen md:pl-56">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-warning/20 glass border-x-0 border-t-0 px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest text-warning">
        <span>{adminService.mode === "demo" ? "Demo data — not connected to production" : "Live"}</span>
        <span className="text-muted-foreground md:hidden">MaQi Admin</span>
      </div>

      {/* Desktop / tablet rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-border bg-sidebar md:flex">
        <div className="px-5 py-6">
          <span className="font-display text-xl font-semibold">MaQi</span>
          <span className="eyebrow ml-2">Admin</span>
        </div>
        <nav className="flex flex-col gap-0.5 px-3">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground", isActive(n.to) && "bg-sidebar-accent text-foreground")}>
              <n.icon className={cn("h-4 w-4", isActive(n.to) && "text-primary")} /> {n.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="mx-auto max-w-5xl px-4 pb-44 pt-5 md:px-8 md:pb-24 md:pt-8">{children}</main>

      <PublishBar />

      {/* Mobile bottom nav */}
      <nav className="glass fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 grid grid-cols-5 rounded-2xl shadow-lg md:hidden">
        {NAV.slice(0, 4).map((n) => (
          <Link key={n.to} to={n.to} className={cn("relative flex flex-col items-center gap-1 py-2.5 text-[10px] text-muted-foreground", isActive(n.to) && "text-foreground")}>
            {isActive(n.to) && <span className="absolute top-1 h-8 w-12 rounded-xl bg-primary/15" />}
            <n.icon className={cn("relative h-5 w-5", isActive(n.to) && "text-primary")} /> <span className="relative">{n.label}</span>
          </Link>
        ))}
        <button onClick={() => setMore(true)} className={cn("flex flex-col items-center gap-1 py-2.5 text-[10px] text-muted-foreground", NAV.slice(4).some((n) => isActive(n.to)) && "text-foreground")}>
          <MoreHorizontal className="h-5 w-5" /> More
        </button>
      </nav>
      <Sheet open={more} onOpenChange={setMore}>
        <SheetContent side="bottom" className="glass rounded-t-2xl">
          <SheetHeader><SheetTitle>More</SheetTitle><SheetDescription className="sr-only">Other sections</SheetDescription></SheetHeader>
          <div className="flex flex-col gap-1 px-4 pb-6">
            {NAV.slice(4).map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setMore(false)} className={cn("flex items-center gap-3 rounded-md px-3 py-3 text-sm", isActive(n.to) ? "bg-secondary" : "text-muted-foreground")}>
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function PublishBar() {
  const s = useAdmin();
  const keys = changedKeys(s);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!keys.length) return null;

  async function confirm() {
    setBusy(true);
    try {
      const res = await publishDraft();
      if (res.status === "confirmed") toast.success("Published — confirmed by backend");
      else if (res.status === "demo") toast.warning("Demo — nothing was sent to production", { description: "Draft saved locally as the new demo baseline." });
      else toast.error("Publish failed", { description: res.message });
      if (res.status !== "error") setOpen(false);
    } catch {
      toast.error("Publish failed", { description: "No response from backend. Nothing was changed." });
    } finally { setBusy(false); }
  }

  return (
    <>
      <div className="glass fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 rounded-full border-primary/30 py-1.5 pl-4 pr-1.5 shadow-lg md:inset-x-auto md:bottom-4 md:left-[calc(14rem+1rem)] md:right-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground"><span className="text-foreground">{keys.length}</span> area{keys.length > 1 ? "s" : ""} with unpublished changes</p>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => { discardDraft(); toast("Draft discarded"); }}>Discard</Button>
            <Button size="sm" className="rounded-full" onClick={() => setOpen(true)}>Review</Button>
          </div>
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-xl">
          <SheetHeader>
            <SheetTitle>Review & publish</SheetTitle>
            <SheetDescription>These areas differ from the last published configuration.</SheetDescription>
          </SheetHeader>
          <ul className="space-y-1 px-4">
            {keys.map((k) => (
              <li key={k} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                {KEY_LABEL[k]}
                <span className="font-mono text-[11px] text-muted-foreground">{s.published![k].length} → {s.draft![k].length} items</span>
              </li>
            ))}
          </ul>
          {adminService.mode === "demo" && (
            <p className="mx-4 rounded-md border border-warning/30 px-3 py-2 text-xs text-warning">Demo mode: publishing will not contact any Worker or KV.</p>
          )}
          <div className="flex gap-2 p-4">
            <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="flex-1" disabled={busy} onClick={confirm}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Confirm publish</Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
