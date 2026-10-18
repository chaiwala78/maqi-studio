import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Clock,
  Film,
  Key,
  LogIn,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users as UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDelete, Empty, PageHeader, Ready, Tag } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mutate, useAdmin } from "@/services/store";
import { pageHead } from "@/lib/head";
import {
  ADMIN_OWNER_EMAIL,
  auth,
  fetchRegisteredUsers,
  loginWithGoogle,
  logoutUser,
  type RegisteredAppUser,
} from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { AdminAuthModal } from "@/components/admin/AdminAuthModal";

export const Route = createFileRoute("/users")({
  head: pageHead("Users & Admins", "Live Firebase Authentication users and authorized MaQi administrators."),
  component: UsersAndAdminsPage,
});

function UsersAndAdminsPage() {
  const s = useAdmin();
  const [activeTab, setActiveTab] = useState<"users" | "admins">("users");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appUsers, setAppUsers] = useState<RegisteredAppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
      if (u) {
        void loadUsers();
      }
    });
    void loadUsers();
    return () => unsub();
  }, []);

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const list = await fetchRegisteredUsers();
      setAppUsers(list);
    } catch {
      toast.error("Failed to load users from Firestore");
    } finally {
      setLoadingUsers(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      const u = await loginWithGoogle();
      toast.success(`Welcome, ${u.displayName || u.email}!`);
    } catch (err: any) {
      toast.error("Login failed: " + (err.message || "Unknown error"));
    }
  }

  async function handleLogout() {
    await logoutUser();
    toast("Signed out successfully");
  }

  function addAdmin(): void {
    const e = newAdminEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      toast.error("Enter a valid email address.");
      return;
    }
    if (s.draft?.admins.some((a) => a.email === e)) {
      toast.error("Admin is already authorized.");
      return;
    }
    mutate(
      "admins",
      (a) => [...a, { email: e, role: "editor", addedAt: new Date().toISOString().slice(0, 10) }],
      "Authorized admin",
      e
    );
    setNewAdminEmail("");
    toast.success("Admin authorized in draft");
  }

  const filteredUsers = appUsers.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.displayName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.uid.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <PageHeader
        eyebrow="Firebase Authentication & Database"
        title="Users & Team"
        action={
          <AdminAuthModal
            currentUser={currentUser}
            onSuccess={loadUsers}
            trigger={
              currentUser ? (
                <div className="flex items-center gap-2">
                  <span className="hidden text-xs text-muted-foreground sm:inline font-mono">
                    {currentUser.email}
                  </span>
                  <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                    <LogOut className="h-3 w-3" /> Account
                  </Button>
                </div>
              ) : (
                <Button size="sm" className="gap-1.5 h-8 text-xs font-semibold">
                  <LogIn className="h-3 w-3" /> 🔑 Admin ID Login
                </Button>
              )
            }
          />
        }
      >
        Monitor registered app users, watch activity stats, and manage authorized administrators.
      </PageHeader>

      {/* FIREBASE AUTH STATUS BANNER */}
      <section className="glass mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Firebase Project: maqi-f2c36</p>
              <Tag tone="primary">Live</Tag>
            </div>
            <p className="text-xs text-muted-foreground">
              {currentUser
                ? `Active Session: ${currentUser.email} (${currentUser.email === ADMIN_OWNER_EMAIL ? "Owner Admin" : "Authorized Admin"})`
                : "Sign in with your Admin ID & Password to manage users from any phone."}
            </p>
          </div>
        </div>

        {!currentUser && (
          <AdminAuthModal
            currentUser={currentUser}
            onSuccess={loadUsers}
            trigger={
              <Button size="sm" variant="secondary" className="gap-1.5 text-xs font-semibold">
                <LogIn className="h-3.5 w-3.5" /> Sign In with ID &amp; Password
              </Button>
            }
          />
        )}
      </section>

      {/* DUAL TABS: APP USERS & ADMIN TEAM */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList className="glass grid w-full grid-cols-2">
          <TabsTrigger value="users" className="gap-2">
            <UsersIcon className="h-4 w-4" />
            <span>App Users</span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              {appUsers.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="admins" className="gap-2">
            <Key className="h-4 w-4" />
            <span>Admin Team</span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
              {s.draft?.admins?.length ?? 1}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: REGISTERED APP USERS */}
        <TabsContent value="users">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search user by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadUsers}
              disabled={loadingUsers}
              className="gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingUsers ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          <Ready>
            {filteredUsers.length > 0 ? (
              <ul className="space-y-3">
                {filteredUsers.map((u) => {
                  const color = u.themeColor || "#E50914";
                  return (
                    <li key={u.uid} className="glass flex items-start gap-3.5 rounded-2xl p-4">
                      {/* Avatar Circle */}
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow"
                        style={{ backgroundColor: color }}
                      >
                        {u.photoUrl ? (
                          <img
                            src={u.photoUrl}
                            alt={u.displayName}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          u.displayName.slice(0, 1).toUpperCase()
                        )}
                      </div>

                      {/* User Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold">{u.displayName}</p>
                          {u.email === ADMIN_OWNER_EMAIL && <Tag tone="primary">Owner</Tag>}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>

                        <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1 font-mono">
                            <Film className="h-3 w-3 text-primary" />
                            {u.historyCount || 0} watched
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            {u.watchlistCount || 0} in watchlist
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground/70">
                            UID: {u.uid.slice(0, 12)}...
                          </span>
                        </div>
                      </div>

                      {/* Send Push Action */}
                      <Link to="/notifications" className="shrink-0 self-center">
                        <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs hover:text-primary">
                          <Bell className="h-3.5 w-3.5 text-primary" />
                          <span className="hidden sm:inline">Push Alert</span>
                        </Button>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Empty>
                {loadingUsers
                  ? "Loading users from Firebase..."
                  : "No registered app users found yet or Firestore requires login."}
              </Empty>
            )}
          </Ready>
        </TabsContent>

        {/* TAB 2: AUTHORIZED ADMINS */}
        <TabsContent value="admins">
          <div className="mb-4 flex gap-2">
            <Input
              type="email"
              placeholder="admin@email.com"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addAdmin()}
              className="text-xs"
            />
            <Button onClick={addAdmin} className="gap-1.5 shrink-0">
              <Plus className="h-4 w-4" /> Add Admin
            </Button>
          </div>

          <Ready>
            <ul className="glass divide-y divide-border overflow-hidden rounded-2xl">
              {s.draft?.admins.map((a) => (
                <li key={a.email} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.email}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">Added on {a.addedAt}</p>
                  </div>
                  <Tag tone={a.role === "owner" ? "primary" : "muted"}>{a.role}</Tag>
                  {a.role !== "owner" && (
                    <ConfirmDelete
                      label="Revoke"
                      what={a.email}
                      onConfirm={() =>
                        mutate(
                          "admins",
                          (l) => l.filter((x) => x.email !== a.email),
                          "Revoked admin",
                          a.email
                        )
                      }
                    />
                  )}
                </li>
              ))}
            </ul>
          </Ready>
        </TabsContent>
      </Tabs>
    </>
  );
}
