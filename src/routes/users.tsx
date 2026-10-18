import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  RefreshCw,
  Plus,
  MoreVertical,
  Copy,
  Check,
  Mail,
  KeyRound,
  Trash2,
  Ban,
  CheckCircle2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  X,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { pageHead } from "@/lib/head";
import {
  fetchRegisteredUsers,
  deleteUserFromDatabase,
  toggleUserAccountDisabled,
  sendUserPasswordReset,
  createNewUserInDatabase,
  type RegisteredAppUser,
  ADMIN_EMAILS,
  ADMIN_OWNER_EMAIL,
} from "@/lib/firebase";

export const Route = createFileRoute("/users")({
  head: pageHead(
    "Authentication Users",
    "Firebase Authentication console: user identifiers, auth providers, created/sign-in dates, and account management."
  ),
  component: FirebaseUsersConsolePage,
});

type FilterType = "all" | "google" | "password" | "disabled" | "admin";
type SortField = "identifier" | "created" | "signedIn";

export function FirebaseUsersConsolePage() {
  const [users, setUsers] = useState<RegisteredAppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [sortField, setSortField] = useState<SortField>("created");
  const [sortAsc, setSortAsc] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  // Add User Dialog state
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [addingUser, setAddingUser] = useState(false);

  // Delete User Dialog state
  const [userToDelete, setUserToDelete] = useState<RegisteredAppUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const list = await fetchRegisteredUsers();
      setUsers(list);
    } catch {
      toast.error("Failed to load users from Firebase");
    } finally {
      setLoading(false);
    }
  }

  function handleCopyUid(uid: string) {
    navigator.clipboard.writeText(uid);
    setCopiedUid(uid);
    toast.success("User UID copied to clipboard", {
      description: uid,
    });
    setTimeout(() => setCopiedUid(null), 2000);
  }

  async function handleResetPassword(user: RegisteredAppUser) {
    try {
      await sendUserPasswordReset(user.email);
      toast.success(`Password reset email sent to ${user.email} ✉️`, {
        description: "User will receive a secure reset link in their inbox.",
      });
    } catch (err: any) {
      toast.error("Failed to send reset email: " + (err.message || "Unknown error"));
    }
  }

  async function handleToggleDisable(user: RegisteredAppUser) {
    const nextState = !user.disabled;
    try {
      await toggleUserAccountDisabled(user.uid, nextState);
      setUsers((prev) =>
        prev.map((u) => (u.uid === user.uid ? { ...u, disabled: nextState } : u))
      );
      if (nextState) {
        toast.warning(`Account disabled: ${user.email}`, {
          description: "This user is now blocked from signing into the MaQi app.",
        });
      } else {
        toast.success(`Account enabled: ${user.email}`);
      }
    } catch (err: any) {
      toast.error("Failed to update account status: " + (err.message || "Unknown error"));
    }
  }

  async function confirmDeleteUser() {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await deleteUserFromDatabase(userToDelete.uid);
      setUsers((prev) => prev.filter((u) => u.uid !== userToDelete.uid));
      toast.success(`Account deleted: ${userToDelete.email} 🗑️`);
      setUserToDelete(null);
    } catch (err: any) {
      toast.error("Failed to delete user: " + (err.message || "Unknown error"));
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newUserEmail.trim()) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setAddingUser(true);
    try {
      const created = await createNewUserInDatabase(
        newUserEmail.trim(),
        newUserName.trim() || undefined
      );
      setUsers((prev) => [created, ...prev]);
      toast.success(`User created: ${created.email} 🎉`);
      setNewUserEmail("");
      setNewUserName("");
      setNewUserPassword("");
      setAddUserOpen(false);
    } catch (err: any) {
      toast.error("Failed to add user: " + (err.message || "Unknown error"));
    } finally {
      setAddingUser(false);
    }
  }

  // Filter & Search Logic
  const filteredUsers = users
    .filter((u) => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.email.toLowerCase().includes(q) ||
        u.displayName.toLowerCase().includes(q) ||
        u.uid.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // 2. Filter Pills
      if (activeFilter === "google") {
        return u.providers.includes("google.com");
      }
      if (activeFilter === "password") {
        return u.providers.includes("password");
      }
      if (activeFilter === "disabled") {
        return u.disabled === true;
      }
      if (activeFilter === "admin") {
        return (
          ADMIN_EMAILS.some((ae) => ae.toLowerCase() === u.email.toLowerCase()) ||
          u.email.endsWith("@maqi.app")
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortField === "identifier") {
        return sortAsc
          ? a.email.localeCompare(b.email)
          : b.email.localeCompare(a.email);
      }
      // For created / signedIn, fallback to string compare
      return sortAsc
        ? a.createdAt.localeCompare(b.createdAt)
        : b.createdAt.localeCompare(a.createdAt);
    });

  // Counts for pills
  const googleCount = users.filter((u) => u.providers.includes("google.com")).length;
  const passwordCount = users.filter((u) => u.providers.includes("password")).length;
  const disabledCount = users.filter((u) => u.disabled === true).length;
  const adminCount = users.filter(
    (u) =>
      ADMIN_EMAILS.some((ae) => ae.toLowerCase() === u.email.toLowerCase()) ||
      u.email.endsWith("@maqi.app")
  ).length;

  // Pagination
  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalUsers);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  return (
    <div className="space-y-4 pb-28 text-neutral-200 selection:bg-blue-600 selection:text-white">
      {/* TOP TITLE & BREADCRUMB */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Authentication Users
            <span className="text-xs font-mono font-normal text-neutral-400 bg-neutral-900 border border-white/10 px-2 py-0.5 rounded-full">
              Project: maqi-f2c36
            </span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            View user identifiers, Google &amp; Email providers, created/sign-in dates, and execute account actions.
          </p>
        </div>

        <a
          href="https://console.firebase.google.com/project/maqi-f2c36/authentication/users"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition"
        >
          Open in Firebase Console <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* FIREBASE STYLE SEARCH & CONTROLS TOOLBAR */}
      <div className="rounded-2xl border border-white/10 bg-neutral-950/80 p-3 sm:p-4 backdrop-blur-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* SEARCH INPUT */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
            <Input
              type="text"
              placeholder="Search by email address, phone number or user UID"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 pl-10 pr-9 text-xs bg-neutral-900/90 border-white/10 text-white placeholder:text-neutral-500 focus:border-blue-500/50 font-sans rounded-xl"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3 text-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => setAddUserOpen(true)}
              className="h-10 px-4 text-xs font-semibold bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-xl shadow-lg shadow-blue-600/20 gap-1.5 cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add user
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={loadUsers}
              disabled={loading}
              title="Refresh users"
              className="h-10 w-10 border-white/10 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-xl cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-blue-400" : ""}`} />
            </Button>
          </div>
        </div>

        {/* FILTER CHIPS (ALL, GOOGLE, EMAIL, DISABLED, ADMINS) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setActiveFilter("all");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer shrink-0 ${
              activeFilter === "all"
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/40"
                : "bg-neutral-900 text-neutral-400 hover:text-white border border-white/5"
            }`}
          >
            All users ({users.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilter("google");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeFilter === "google"
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/40"
                : "bg-neutral-900 text-neutral-400 hover:text-white border border-white/5"
            }`}
          >
            <GoogleGIcon className="h-3 w-3" />
            Google ({googleCount})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilter("password");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeFilter === "password"
                ? "bg-blue-600/20 text-blue-400 border border-blue-500/40"
                : "bg-neutral-900 text-neutral-400 hover:text-white border border-white/5"
            }`}
          >
            <Mail className="h-3 w-3" />
            Password ({passwordCount})
          </button>

          {disabledCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setActiveFilter("disabled");
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                activeFilter === "disabled"
                  ? "bg-red-600/20 text-red-400 border border-red-500/40"
                  : "bg-neutral-900 text-neutral-400 hover:text-white border border-white/5"
              }`}
            >
              <Ban className="h-3 w-3" />
              Disabled ({disabledCount})
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setActiveFilter("admin");
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeFilter === "admin"
                ? "bg-amber-600/20 text-amber-400 border border-amber-500/40"
                : "bg-neutral-900 text-neutral-400 hover:text-white border border-white/5"
            }`}
          >
            <ShieldCheck className="h-3 w-3" />
            Admins ({adminCount})
          </button>
        </div>
      </div>

      {/* FIREBASE AUTHENTICATION TABLE */}
      <div className="rounded-2xl border border-white/10 bg-neutral-950/90 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-neutral-900/60 font-medium text-neutral-400 select-none">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    className="rounded border-white/20 bg-neutral-900 text-blue-600 h-3.5 w-3.5 cursor-pointer"
                  />
                </th>

                <th
                  onClick={() => {
                    if (sortField === "identifier") setSortAsc(!sortAsc);
                    else {
                      setSortField("identifier");
                      setSortAsc(true);
                    }
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-white transition font-medium"
                >
                  <div className="flex items-center gap-1">
                    <span>Identifier</span>
                    {sortField === "identifier" ? (
                      sortAsc ? (
                        <ArrowUp className="h-3.5 w-3.5 text-blue-400" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-blue-400" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-neutral-600" />
                    )}
                  </div>
                </th>

                <th className="py-3 px-4 font-medium">Providers</th>

                <th
                  onClick={() => {
                    if (sortField === "created") setSortAsc(!sortAsc);
                    else {
                      setSortField("created");
                      setSortAsc(false);
                    }
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-white transition font-medium"
                >
                  <div className="flex items-center gap-1">
                    <span>Created</span>
                    {sortField === "created" ? (
                      sortAsc ? (
                        <ArrowUp className="h-3.5 w-3.5 text-blue-400" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-blue-400" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-neutral-600" />
                    )}
                  </div>
                </th>

                <th
                  onClick={() => {
                    if (sortField === "signedIn") setSortAsc(!sortAsc);
                    else {
                      setSortField("signedIn");
                      setSortAsc(false);
                    }
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-white transition font-medium"
                >
                  <div className="flex items-center gap-1">
                    <span>Signed In</span>
                    {sortField === "signedIn" ? (
                      sortAsc ? (
                        <ArrowUp className="h-3.5 w-3.5 text-blue-400" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-blue-400" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 text-neutral-600" />
                    )}
                  </div>
                </th>

                <th className="py-3 px-4 font-medium">User UID</th>

                <th className="py-3 px-4 text-right w-16 font-medium">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5 font-sans">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((u) => {
                  const isOwner = u.email === ADMIN_OWNER_EMAIL;
                  const isAdmin =
                    ADMIN_EMAILS.some((ae) => ae.toLowerCase() === u.email.toLowerCase()) ||
                    u.email.endsWith("@maqi.app");
                  const hasGoogle = u.providers.includes("google.com");
                  const hasPassword = u.providers.includes("password");

                  return (
                    <tr
                      key={u.uid}
                      className="hover:bg-neutral-900/40 transition-colors group"
                    >
                      {/* CHECKBOX */}
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          className="rounded border-white/20 bg-neutral-900 text-blue-600 h-3.5 w-3.5 cursor-pointer"
                        />
                      </td>

                      {/* IDENTIFIER */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-800 text-neutral-300 font-semibold text-[11px] border border-white/10">
                            {u.displayName ? u.displayName[0].toUpperCase() : u.email[0].toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-white truncate max-w-[190px] sm:max-w-[280px]">
                                {u.email}
                              </span>

                              {isOwner && (
                                <span className="rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider">
                                  Owner
                                </span>
                              )}
                              {!isOwner && isAdmin && (
                                <span className="rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider">
                                  Admin
                                </span>
                              )}
                              {u.disabled && (
                                <span className="rounded bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider">
                                  Disabled
                                </span>
                              )}
                            </div>

                            {u.displayName && u.displayName !== u.email && (
                              <p className="text-[10px] text-neutral-400 truncate max-w-[200px]">
                                {u.displayName}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* PROVIDERS (GOOGLE & ENVELOPE ICONS) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {hasGoogle && (
                            <div
                              title="Google Provider"
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 border border-white/10"
                            >
                              <GoogleGIcon className="h-3.5 w-3.5" />
                            </div>
                          )}
                          {hasPassword && (
                            <div
                              title="Password / Email Provider"
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 border border-white/10 text-neutral-400"
                            >
                              <Mail className="h-3.5 w-3.5 text-neutral-300" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* CREATED */}
                      <td className="py-3 px-4 text-neutral-300 font-mono text-[11px] whitespace-nowrap">
                        {u.createdAt}
                      </td>

                      {/* SIGNED IN */}
                      <td className="py-3 px-4 text-neutral-300 font-mono text-[11px] whitespace-nowrap">
                        {u.lastActive}
                      </td>

                      {/* USER UID + COPY BUTTON */}
                      <td className="py-3 px-4 font-mono text-[11px] text-neutral-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate max-w-[130px]">{u.uid}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyUid(u.uid)}
                            title="Copy UID"
                            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
                          >
                            {copiedUid === u.uid ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* THREE-DOT ACTIONS MENU */}
                      <td className="py-3 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg cursor-pointer"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent
                            align="end"
                            className="w-48 bg-neutral-950 border border-white/10 text-neutral-200 text-xs shadow-2xl rounded-xl"
                          >
                            <DropdownMenuItem
                              onClick={() => handleResetPassword(u)}
                              className="gap-2 cursor-pointer py-2 hover:bg-neutral-900"
                            >
                              <KeyRound className="h-3.5 w-3.5 text-blue-400" />
                              Reset password
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleToggleDisable(u)}
                              className="gap-2 cursor-pointer py-2 hover:bg-neutral-900"
                            >
                              <Ban className="h-3.5 w-3.5 text-amber-400" />
                              {u.disabled ? "Enable account" : "Disable account"}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-white/10" />

                            <DropdownMenuItem
                              onClick={() => setUserToDelete(u)}
                              className="gap-2 text-red-400 cursor-pointer py-2 hover:bg-red-500/10 hover:text-red-300"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    {loading ? "Loading users..." : "No users found matching query."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* FIREBASE STYLE FOOTER PAGINATION */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-white/10 bg-neutral-900/40 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-neutral-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <span>
              {totalUsers === 0 ? "0 - 0 of 0" : `${startIndex + 1} - ${endIndex} of ${totalUsers}`}
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 w-8 text-neutral-400 hover:text-white disabled:opacity-30 rounded-lg cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 w-8 text-neutral-400 hover:text-white disabled:opacity-30 rounded-lg cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* DIALOG: ADD USER */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="glass sm:max-w-md border border-white/10 bg-neutral-950/95 p-6 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-500" />
              Add user
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">
              Create a new user in Firebase Authentication. An identifier and password are required.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddUser} className="space-y-3.5 py-2">
            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-medium text-neutral-300">
                Email address (Identifier) *
              </label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="h-9 text-xs bg-neutral-900 border-white/10 text-white font-mono"
                required
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-medium text-neutral-300">
                Display Name (Optional)
              </label>
              <Input
                type="text"
                placeholder="John Doe"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="h-9 text-xs bg-neutral-900 border-white/10 text-white"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-medium text-neutral-300">
                Password (Optional temporary password)
              </label>
              <Input
                type="password"
                placeholder="Min 6 characters"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className="h-9 text-xs bg-neutral-900 border-white/10 text-white font-mono"
              />
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAddUserOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addingUser}
                className="text-xs font-semibold bg-[#1a73e8] hover:bg-[#1557b0] text-white"
              >
                {addingUser ? "Adding..." : "Add user"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: CONFIRM DELETE USER */}
      <Dialog open={Boolean(userToDelete)} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <DialogContent className="glass sm:max-w-md border border-white/10 bg-neutral-950/95 p-6 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-400 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete user account?
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-300 pt-1">
              Are you sure you want to delete the user account for{" "}
              <strong className="text-white">{userToDelete?.email}</strong> (UID:{" "}
              <code className="text-neutral-400">{userToDelete?.uid}</code>)?
              <br />
              <br />
              This will remove the user profile, watchlist, and continue watching history. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setUserToDelete(null)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={confirmDeleteUser}
              className="text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Standard Colorful Google "G" icon matching Firebase Console.
 */
function GoogleGIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}
