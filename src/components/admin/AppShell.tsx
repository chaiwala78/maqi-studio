import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3, GalleryHorizontal, LayoutGrid, LayoutList, MoreHorizontal, Radio, Settings, Users, SlidersHorizontal, Bell,
} from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { changedKeys, discardDraft, loadAdmin, publishDraft, useAdmin } from "@/services/store";
import { adminService } from "@/services/admin-service";
import type { DataKey } from "@/services/types";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { AdminAuthModal } from "./AdminAuthModal";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutGrid },
  { to: "/notifications", label: "Push Alerts", icon: Bell },
  { to: "/app-config", label: "App Config", icon: SlidersHorizontal },
  { to: "/sections", label: "Sections", icon: LayoutList },
  { to: "/banners", label: "Banners", icon: GalleryHorizontal },
  { to: "/providers", label: "Providers", icon: Radio },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/users", label: "Users & Team", icon: Users },
  { to: "/settings", label: "Settings & Log", icon: Settings },
] as const;

const KEY_LABEL: Record<DataKey, string> = {
  catalog: "Catalog", curated: "Curated collections", banners: "Hero banners",
  sections: "Home sections", providers: "Streaming providers", admins: "Admins",
};

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [more, setMore] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    void loadAdmin();
    const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsub();
  }, []);

  const isActive = (to: string) => (to === "/" ? path === "/" : path.startsWith(to));

  return (
    <div className="min-h-screen md:pl-56">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-warning/20 glass border-x-0 border-t-0 px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest text-warning">
        <span className="truncate">{adminService.mode === "demo" ? <><span className="md:hidden">Demo — not live</span><span className="hidden md:inline">Demo data — not connected to production</span></> : "Live Cloudflare Edge"}</span>
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-1.5 text-foreground lowercase">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="hidden sm:inline font-sans text-[11px] truncate max-w-[140px]">{currentUser.email}</span>
              <AdminAuthModal currentUser={currentUser} trigger={<button className="underline text-muted-foreground hover:text-foreground text-[10px] uppercase tracking-wider cursor-pointer">Account</button>} />
            </div>
          ) : (
            <AdminAuthModal currentUser={currentUser} trigger={<button className="rounded px-2 py-0.5 bg-primary/20 text-primary hover:bg-primary/30 uppercase text-[10px] font-semibold tracking-wider flex items-center gap-1 cursor-pointer">🔑 ID Login</button>} />
          )}
        </div>
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

      {/* Mobile bottom nav - Exactly 5 items: Overview, Sections, Banners, Providers, More */}
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
          <p className="min-w-0 truncate text-xs text-muted-foreground"><span className="text-foreground">{keys.length}</span> unpublished<span className="hidden sm:inline"> area{keys.length > 1 ? "s" : ""}</span></p>
          <div className="flex shrink-0 gap-1">
            <Button size="sm" variant="ghost" className="rounded-full" onClick={() => { discardDraft(); toast("Draft discarded"); }}>Discard</Button>
            <Button size="sm" className="rounded-full" onClick={() => setOpen(true)}>Review & Publish</Button>
          </div>
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="glass mx-auto max-w-lg rounded-t-2xl">
          <SheetHeader><SheetTitle>Review Changes</SheetTitle><SheetDescription>The following areas have unsaved draft modifications:</SheetDescription></SheetHeader>
          <div className="space-y-4 px-4 pb-6 pt-3">
            <ul className="divide-y divide-border rounded-xl border border-border">
              {keys.map((k) => (
                <li key={k} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span>{KEY_LABEL[k]}</span>
                  <span className="font-mono text-xs text-primary">MODIFIED</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>Continue Editing</Button>
              <Button className="flex-1" disabled={busy} onClick={confirm}>{busy ? "Publishing..." : "Confirm & Publish"}</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
