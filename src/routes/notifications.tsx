import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bell,
  Send,
  Smartphone,
  Sparkles,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Film,
  Info,
  Clock,
  Trash2,
  LogIn,
  LogOut,
  ShieldAlert,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Tag, Field } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { pageHead } from "@/lib/head";
import {
  auth,
  loginWithGoogle,
  logoutUser,
  sendBroadcastNotification,
  fetchNotificationHistory,
  fetchFcmTokensCount,
  type BroadcastNotification,
} from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import { AdminAuthModal } from "@/components/admin/AdminAuthModal";

export const Route = createFileRoute("/notifications")({
  head: pageHead("Push Notifications", "Send real-time remote push notifications to MaQi Android app devices."),
  component: NotificationsPage,
});

const TEMPLATES = [
  {
    name: "New Episode Release",
    title: "Solo Leveling Season 2: Ep 06 Out Now! 🔥",
    body: "Stream the new high-octane episode in ultra-smooth 1080p right now on MaQi.",
    imageUrl: "https://image.tmdb.org/t/p/w780/geCRueV3ElhRTr0xtJuClJknQd7.jpg",
    type: "anime",
    animeId: "1414",
  },
  {
    name: "Trending Movie Added",
    title: "Deadpool & Wolverine Now Streaming! ⚔️",
    body: "The multiverse collision is finally here. Watch in full HD with multiple fast servers.",
    imageUrl: "https://image.tmdb.org/t/p/w780/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    type: "movie",
    animeId: "533535",
  },
  {
    name: "App Update Available",
    title: "MaQi v1.1 Update Available! 🚀",
    body: "Smoother playback, new anime servers, and improved status bar. Tap to update now.",
    imageUrl: "",
    type: "update",
    url: "https://maqiii.web.app/download",
  },
  {
    name: "Community Announcement",
    title: "Weekly Watch Party & Anime Polls! 🍿",
    body: "Join our official discussion community and vote for the next Hindi-dubbed releases.",
    imageUrl: "",
    type: "announcement",
    url: "https://t.me/maqi_anime",
  },
];

const FIRESTORE_RULES_SNIPPET = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null && (
        request.auth.token.email.lower() == 'jojo219884@gmail.com' ||
        request.auth.token.email.lower() == 'aabito986f@gmail.com' ||
        request.auth.token.email.lower() == 'admin@maqi.app' ||
        request.auth.token.email.matches('.*@maqi[.]app')
      );
    }

    match /broadcast_notifications/{notificationId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /app_config/{document} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /fcm_tokens/{token} {
      allow create, update: if true;
      allow read, delete: if isAdmin();
    }

    match /users/{userId} {
      allow read: if isAdmin() || (request.auth != null && request.auth.uid == userId);
      allow write: if request.auth != null && request.auth.uid == userId;
      match /{subcollection=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}`;

function NotificationsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [type, setType] = useState<"anime" | "movie" | "tv" | "update" | "announcement" | "general">("anime");
  const [contentId, setContentId] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [target, setTarget] = useState<"all" | "topic_all_users" | "topic_releases" | "topic_announcements">("all");

  const [activeDeviceCount, setActiveDeviceCount] = useState<number>(0);
  const [history, setHistory] = useState<BroadcastNotification[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
      void loadData();
    });
    void loadData();
    return () => unsub();
  }, []);

  async function loadData() {
    setLoadingHistory(true);
    try {
      const [count, hist] = await Promise.all([
        fetchFcmTokensCount(),
        fetchNotificationHistory(),
      ]);
      setActiveDeviceCount(count);
      setHistory(hist);
    } catch {
      // Handled gracefully
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      const u = await loginWithGoogle();
      toast.success(`Signed in as ${u.displayName || u.email}!`);
      void loadData();
    } catch (err: any) {
      toast.error("Google login failed: " + (err.message || "Unknown error"));
    }
  }

  async function handleLogout() {
    await logoutUser();
    toast("Signed out successfully");
  }

  function copyRules() {
    navigator.clipboard.writeText(FIRESTORE_RULES_SNIPPET);
    setCopiedRules(true);
    toast.success("Secure Admin Rules copied! Paste them in Firebase Console -> Firestore -> Rules.");
    setTimeout(() => setCopiedRules(false), 3000);
  }

  function applyTemplate(tpl: typeof TEMPLATES[0]) {
    setTitle(tpl.title);
    setBody(tpl.body);
    setImageUrl(tpl.imageUrl || "");
    setType(tpl.type as any);
    if (tpl.animeId) setContentId(tpl.animeId);
    if (tpl.url) setExternalUrl(tpl.url);
    toast.success(`Template applied: ${tpl.name}`);
  }

  async function handleSend() {
    if (!title.trim()) {
      toast.error("Please enter a notification title");
      return;
    }
    if (!body.trim()) {
      toast.error("Please enter a notification message");
      return;
    }

    // Prompt ID & Password login if not authenticated
    if (!auth.currentUser) {
      toast.info("Please sign in with your Admin ID & Password first.");
      setAuthModalOpen(true);
      return;
    }

    if (!window.confirm(`Broadcast push notification to all connected MaQi devices?\n\nTitle: ${title}\nTarget: ${target}`)) {
      return;
    }

    setIsSending(true);
    try {
      await sendBroadcastNotification({
        title: title.trim(),
        body: body.trim(),
        imageUrl: imageUrl.trim() || undefined,
        type,
        animeId: contentId.trim() || undefined,
        url: externalUrl.trim() || undefined,
        target,
      });

      // Also mirror to Cloudflare Worker notice so users get in-app announcement
      try {
        await fetch("https://modi.aabito986f.workers.dev/api/admin/config", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Maqi-App-Token": "maqi_sec_786_auth_gate_v1",
          },
          body: JSON.stringify({
            app_notice: {
              enabled: true,
              id: `notif_${Date.now()}`,
              title: title.trim(),
              message: body.trim(),
              is_cancellable: true,
            },
          }),
        });
      } catch (_) {}

      toast.success("Push notification dispatched to all MaQi devices! 🚀");
      // Reset form
      setTitle("");
      setBody("");
      setImageUrl("");
      setContentId("");
      setExternalUrl("");
      // Refresh history
      void loadData();
    } catch (err: any) {
      const msg = err.message || "Unknown error";
      if (msg.toLowerCase().includes("permission")) {
        toast.error("Permission Denied: Please update Firestore Rules in Firebase Console or Sign In with Google.", {
          duration: 9000,
          description: "See the 'Firebase Setup & Rules' guide below on this page.",
        });
      } else {
        toast.error("Failed to send notification: " + msg);
      }
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Firebase Cloud Messaging & Firestore"
        title="Push Notification Dispatcher"
        action={
          <div className="flex items-center gap-2">
            <AdminAuthModal
              currentUser={currentUser}
              open={authModalOpen}
              onOpenChange={setAuthModalOpen}
              onSuccess={loadData}
              trigger={
                currentUser ? (
                  <div className="flex items-center gap-1.5">
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
            <Tag tone="primary">
              <Smartphone className="inline h-3 w-3 mr-1" />
              {activeDeviceCount > 0 ? `${activeDeviceCount} Devices` : "FCM Live"}
            </Tag>
          </div>
        }
      >
        Broadcast push notifications with rich images and deep links directly to all MaQi Android users in real-time.
      </PageHeader>

      {/* PERMISSION / RULES ALERT BANNER */}
      <section className="glass mb-5 rounded-2xl border border-warning/30 bg-warning/5 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning/20 text-warning">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">
                Firebase Firestore Security Rules Deployment Required
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                If you see &ldquo;Missing or insufficient permissions&rdquo;, your Firebase project rules block writes. You must publish rules in Firebase Console.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={copyRules} className="h-7 text-xs gap-1">
              {copiedRules ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              {copiedRules ? "Copied!" : "Copy Firestore Rules"}
            </Button>
            <a
              href="https://console.firebase.google.com/project/maqi-f2c36/firestore/rules"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary underline"
            >
              Open Console <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </section>

      {/* QUICK TEMPLATES */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-2.5">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Presets</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TEMPLATES.map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() => applyTemplate(t)}
              className="glass rounded-xl p-3 text-left transition hover:border-primary/50 hover:bg-primary/5"
            >
              <p className="text-xs font-semibold text-foreground truncate">{t.name}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground truncate">{t.title}</p>
            </button>
          ))}
        </div>
      </section>

      {/* TWO COLUMN COMPOSER & PREVIEW */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 pb-12">
        {/* COMPOSER FORM (7 COLS) */}
        <div className="space-y-4 lg:col-span-7">
          <div className="glass rounded-2xl p-4 sm:p-5 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Compose Notification
            </h3>

            <Field label="Notification Title (Headline)" hint="Keep it under 50 characters for clean display">
              <Input
                placeholder="e.g. Solo Leveling Season 2 Ep 05 Out Now! 🔥"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
              />
            </Field>

            <Field label="Notification Body (Message)" hint="Shown in system tray and Android status bar">
              <Textarea
                rows={3}
                placeholder="e.g. The decisive dungeon battle begins. Stream in 1080p HD with fast multi-source servers."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={250}
              />
            </Field>

            <Field label="Poster / Banner Image URL (Optional)" hint="Loads full-width BigPicture in Android notification tray">
              <div className="relative">
                <Input
                  placeholder="https://image.tmdb.org/t/p/w780/... or https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="font-mono text-xs pr-8"
                />
                {imageUrl && (
                  <ImageIcon className="absolute right-2.5 top-2.5 h-4 w-4 text-emerald-400" />
                )}
              </div>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <Field label="Action / Destination">
                <Select value={type} onValueChange={(v) => setType(v as any)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anime">Anime Details</SelectItem>
                    <SelectItem value="movie">Movie / TV Details (TMDB)</SelectItem>
                    <SelectItem value="update">App Download Link</SelectItem>
                    <SelectItem value="announcement">Announcement Notice</SelectItem>
                    <SelectItem value="general">Open App Home</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Target Audience">
                <Select value={target} onValueChange={(v) => setTarget(v as any)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Broadcast to All Users</SelectItem>
                    <SelectItem value="topic_releases">New Releases Subscribers</SelectItem>
                    <SelectItem value="topic_announcements">Announcements Only</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {(type === "anime" || type === "movie" || type === "tv") && (
              <Field
                label={type === "anime" ? "Anime ID (e.g. 1414 for Solo Leveling)" : "TMDB ID (e.g. 533535)"}
                hint="Clicking the notification will open this title directly in the app"
              >
                <Input
                  placeholder="Enter content ID..."
                  value={contentId}
                  onChange={(e) => setContentId(e.target.value)}
                  className="font-mono text-xs"
                />
              </Field>
            )}

            {(type === "update" || type === "announcement") && (
              <Field label="External or Web Link (Optional)" hint="Opens in browser or updater when tapped">
                <Input
                  placeholder="https://maqiii.web.app/download or https://..."
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  className="font-mono text-xs"
                />
              </Field>
            )}

            <Button
              className="w-full gap-2 mt-2"
              disabled={isSending || !title.trim() || !body.trim()}
              onClick={handleSend}
            >
              <Send className="h-4 w-4" />
              {isSending ? "Broadcasting..." : "Send Broadcast Notification"}
            </Button>
          </div>
        </div>

        {/* LIVE MOBILE PREVIEW (5 COLS) */}
        <div className="space-y-4 lg:col-span-5">
          <div className="glass rounded-2xl p-4 sm:p-5">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Smartphone className="h-4 w-4 text-primary" />
              Android System Tray Preview
            </h3>

            {/* ANDROID NOTIFICATION SHADE MOCKUP */}
            <div className="rounded-2xl border border-white/10 bg-neutral-900/90 p-4 shadow-2xl backdrop-blur-xl">
              {/* STATUS BAR HEADER */}
              <div className="flex items-center justify-between pb-3 text-[11px] text-neutral-400">
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-4 rounded bg-red-600 flex items-center justify-center text-[10px] font-bold text-white">
                    M
                  </div>
                  <span className="font-semibold text-neutral-200">MaQi</span>
                  <span>•</span>
                  <span>Just now</span>
                </div>
                <span className="text-[10px] text-neutral-500 font-mono">100% 🔋</span>
              </div>

              {/* NOTIFICATION CONTENT */}
              <div className="space-y-1.5">
                <p className="text-sm font-bold text-white leading-snug">
                  {title || "New Anime Release Alert!"}
                </p>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {body || "Your notification message will appear here in the Android notification tray..."}
                </p>

                {/* EXPANDED IMAGE PREVIEW */}
                {imageUrl && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                    <img
                      src={imageUrl}
                      alt="Notification Preview"
                      className="h-36 w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              {/* ACTION PILL */}
              <div className="mt-3.5 flex items-center justify-between border-t border-white/10 pt-2.5 text-[11px]">
                <span className="text-primary font-medium flex items-center gap-1">
                  Tap to open in app
                </span>
                <span className="font-mono text-[10px] text-neutral-500">maqi_notifications</span>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border/40 bg-secondary/30 p-3 text-xs text-muted-foreground flex items-start gap-2">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p>
                MaQi Android app listens via Firebase Cloud Messaging topics (<code>all_users</code>) and a real-time Firestore sync channel, guaranteeing instant notification arrival.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT NOTIFICATIONS HISTORY */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Broadcast History</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loadingHistory}
            className="gap-1 text-xs"
          >
            <RefreshCw className={`h-3 w-3 ${loadingHistory ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {history.length > 0 ? (
          <ul className="glass divide-y divide-border overflow-hidden rounded-2xl">
            {history.map((n) => (
              <li key={n.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                <div className="flex items-start gap-3 min-w-0">
                  {n.imageUrl ? (
                    <img
                      src={n.imageUrl}
                      alt=""
                      className="h-12 w-12 rounded-lg object-cover shrink-0 border border-border"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                      <Bell className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{n.body}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground font-mono">
                      <span>{new Date(n.timestamp).toLocaleString()}</span>
                      <span>•</span>
                      <span className="uppercase text-primary">{n.type || "general"}</span>
                      {n.animeId && <span>ID: {n.animeId}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Tag tone="primary">Delivered</Tag>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="glass rounded-2xl p-8 text-center text-xs text-muted-foreground">
            {loadingHistory ? "Loading broadcast history..." : "No broadcast notifications sent yet. Create your first one above!"}
          </div>
        )}
      </section>
    </>
  );
}
