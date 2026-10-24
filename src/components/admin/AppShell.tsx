import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  GalleryHorizontal,
  LayoutGrid,
  LayoutList,
  MoreHorizontal,
  Radio,
  Settings,
  Users,
  SlidersHorizontal,
  Bell,
  LogOut,
  ShieldCheck,
  Server,
} from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { changedKeys, discardDraft, loadAdmin, publishDraft, useAdmin } from "@/services/store";
import { adminService } from "@/services/admin-service";
import type { DataKey } from "@/services/types";
import { cn } from "@/lib/utils";
import { auth, logoutUser, isUserAdmin } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { AdminGatekeeper } from "./AdminGatekeeper";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutGrid },
  { to: "/notifications", label: "Push Alerts", icon: Bell },
  { to: "/app-config", label: "App Config", icon: SlidersHorizontal },
  { to: "/sections", label: "Sections", icon: LayoutList },
  { to: "/banners", label: "Banners", icon: GalleryHorizontal },
  { to: "/providers", label: "Providers", icon: Radio },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/users", label: "Users & Team", icon: Users },
  { to: "/settings", label: "Cloud & Systems", icon: Server },
] as const;

const KEY_LABEL: Record<DataKey, string> = {
  catalog: "Catalog",
  curated: "Curated collections",
  banners: "Hero banners",
  sections: "Home sections",
  providers: "Streaming providers",
  admins: "Admins",
};

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [more, setMore] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    // 1. Verify persisted active admin session
    let sessionValid = false;
    try {
      const savedSession = sessionStorage.getItem("maqi_admin_session") || localStorage.getItem("maqi_admin_session");
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed.authenticated) {
          setIsUnlocked(true);
          sessionValid = true;
        }
      }
    } catch {}

    // 2. Load admin and listen for Firebase auth
    void loadAdmin();
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
      if (u && isUserAdmin(u.email)) {
        setIsUnlocked(true);
      }
      setAuthChecking(false);
    });

    // Fallback timer: stop checking after 300ms if already determined
    const timer = setTimeout(() => {
      setAuthChecking(false);
    }, 300);

    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, []);

  async function handleLogout() {
    try {
      sessionStorage.removeItem("maqi_admin_session");
      sessionStorage.removeItem("maqi_admin_verified");
      localStorage.removeItem("maqi_admin_session");
      await logoutUser();
    } catch {}
    setIsUnlocked(false);
    setCurrentUser(null);
    toast.success("Logged out successfully. Security gate locked.");
  }

  // COMPULSORY LOGIN SHIELD: If not unlocked, render ONLY AdminGatekeeper
  if (authChecking) {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center text-foreground select-none">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <ShieldCheck className="h-7 w-7 text-primary absolute" />
        </div>
        <p className="mt-4 font-mono text-xs tracking-widest uppercase text-muted-foreground animate-pulse">
          Verifying Security Clearance...
        </p>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <AdminGatekeeper
        onAuthenticated={() => {
          setIsUnlocked(true);
        }}
      />
    );
  }

  const isActive = (to: string) => (to === "/" ? path === "/" : path.startsWith(to));

  const current = NAV.find((n) => isActive(n.to)) ?? NAV[0];

  return (
    <div className="min-h-screen md:pl-60 bg-background">
      {/* App header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex items-center gap-3 px-4 py-3 md:px-8">
          <span className="bg-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-lg font-bold text-primary-foreground shadow-sm md:hidden">
            M
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl leading-tight">{current.label}</h1>
            <p className="truncate font-mono text-[10px] uppercase tracking-widest text-warning">
              {adminService.mode === "demo" ? "Demo — not live" : "Live"}
            </p>
          </div>
          <Link
            to="/settings"
            aria-label="Settings"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Settings className="h-5 w-5" />
          </Link>
          <button
            onClick={handleLogout}
            aria-label={`Log out ${currentUser?.email ?? ""}`}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-destructive"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Desktop / tablet rail */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col justify-between border-r border-border bg-sidebar md:flex">
        <div>
          <div className="flex items-center gap-3 px-5 py-5">
            <span className="bg-brand flex h-9 w-9 items-center justify-center rounded-xl font-display font-bold text-primary-foreground">
              M
            </span>
            <span className="font-display text-lg font-bold">MaQi</span>
            <span className="eyebrow">Admin</span>
          </div>
          <nav className="flex flex-col gap-1 px-3">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                  isActive(n.to) && "bg-brand text-primary-foreground hover:bg-brand hover:text-primary-foreground"
                )}
              >
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-t border-border p-3">
          <p className="truncate px-3 pb-2 text-xs text-muted-foreground">{currentUser?.email || "admin"}</p>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <main className="mx-auto max-w-5xl px-4 pb-44 pt-5 md:px-8 md:pb-24 md:pt-8">{children}</main>

      <PublishBar />

      {/* Mobile bottom dock */}
      <nav className="bg-dock fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 gap-1 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:hidden">
        {NAV.slice(0, 4).map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium",
              isActive(n.to) && "bg-brand text-primary-foreground"
            )}
          >
            <n.icon className="h-5 w-5" />
            <span className="max-w-full truncate px-1">{n.label}</span>
          </Link>
        ))}
        <button
          onClick={() => setMore(true)}
          className={cn(
            "flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium",
            NAV.slice(4).some((n) => isActive(n.to)) && "bg-brand text-primary-foreground"
          )}
        >
          <MoreHorizontal className="h-5 w-5" /> More
        </button>
      </nav>

      {/* Mobile More Sheet */}
      <Sheet open={more} onOpenChange={setMore}>
        <SheetContent side="bottom" className="glass rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Admin Navigation</SheetTitle>
            <SheetDescription className="sr-only">Other admin sections</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4 pb-6 pt-2">
            {NAV.slice(4).map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setMore(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-3 text-sm",
                  isActive(n.to) ? "bg-secondary" : "text-muted-foreground"
                )}
              >
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            ))}
            <div className="pt-2 mt-2 border-t border-border/40">
              <button
                onClick={() => {
                  setMore(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 rounded-md px-3 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors font-medium cursor-pointer"
              >
                <LogOut className="h-4 w-4" /> Sign Out &amp; Lock Studio
              </button>
            </div>
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
      else if (res.status === "demo")
        toast.warning("Demo — nothing was sent to production", {
          description: "Draft saved locally as the new demo baseline.",
        });
      else toast.error("Publish failed", { description: res.message });
      if (res.status !== "error") setOpen(false);
    } catch {
      toast.error("Publish failed", { description: "No response from backend. Nothing was changed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="glass fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 rounded-full border-primary/30 py-1.5 pl-4 pr-1.5 shadow-lg md:inset-x-auto md:bottom-4 md:left-[calc(14rem+1rem)] md:right-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <p className="min-w-0 truncate text-xs text-muted-foreground">
            <span className="text-foreground">{keys.length}</span> unpublished
            <span className="hidden sm:inline"> area{keys.length > 1 ? "s" : ""}</span>
          </p>
          <div className="flex shrink-0 gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full"
              onClick={() => {
                discardDraft();
                toast("Draft discarded");
              }}
            >
              Discard
            </Button>
            <Button size="sm" className="rounded-full" onClick={() => setOpen(true)}>
              Review & Publish
            </Button>
          </div>
        </div>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="glass mx-auto max-w-lg rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Review Changes</SheetTitle>
            <SheetDescription>The following areas have unsaved draft modifications:</SheetDescription>
          </SheetHeader>
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
              <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
                Continue Editing
              </Button>
              <Button className="flex-1" disabled={busy} onClick={confirm}>
                {busy ? "Publishing..." : "Confirm & Publish"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
