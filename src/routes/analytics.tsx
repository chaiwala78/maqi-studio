import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock,
  Film,
  Flame,
  Globe2,
  PlayCircle,
  Radio,
  Server,
  Smartphone,
  TrendingUp,
  Tv,
  Users,
  UserX,
  UserCheck,
  ShieldAlert,
  Zap,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { PageHeader, Ready, Tag } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/services/store";
import { pageHead } from "@/lib/head";
import { toast } from "sonner";

export const Route = createFileRoute("/analytics")({
  head: pageHead("Analytics", "Live streaming metrics, guest vs registered audience telemetry, and server traffic."),
  component: AnalyticsPage,
});

const TRAFFIC_DATA = [
  { day: "Mon", streams: 5420, guestStreams: 4250, regStreams: 1170 },
  { day: "Tue", streams: 6180, guestStreams: 4890, regStreams: 1290 },
  { day: "Wed", streams: 5900, guestStreams: 4620, regStreams: 1280 },
  { day: "Thu", streams: 7200, guestStreams: 5690, regStreams: 1510 },
  { day: "Fri", streams: 8640, guestStreams: 6810, regStreams: 1830 },
  { day: "Sat", streams: 11200, guestStreams: 8850, regStreams: 2350 },
  { day: "Sun", streams: 12850, guestStreams: 10120, regStreams: 2730 },
];

const AUDIENCE_SPLIT = [
  { name: "Guest Streamers (No Login)", value: 78, color: "#E50914" },
  { name: "Registered Accounts", value: 22, color: "#3B82F6" },
];

const SERVER_SHARE_DATA = [
  { name: "ONI", value: 38, color: "#E50914" },
  { name: "GOJO", value: 27, color: "#00E5FF" },
  { name: "VIBE", value: 18, color: "#9C27B0" },
  { name: "PULSE", value: 11, color: "#FF9800" },
  { name: "HINDI", value: 6, color: "#4CAF50" },
];

const TOP_TITLES = [
  { rank: 1, title: "Link Click (Season 2)", type: "Anime", plays: "4,820", server: "ONI (Fast HD)", trend: "+24%", guestRatio: "82%" },
  { rank: 2, title: "Dune: Part Two", type: "Movie", plays: "3,950", server: "GOJO (Multi-Lang)", trend: "+18%", guestRatio: "76%" },
  { rank: 3, title: "Solo Leveling", type: "Anime", plays: "3,610", server: "ONI (Fast HD)", trend: "+12%", guestRatio: "84%" },
  { rank: 4, title: "House of the Dragon", type: "Series", plays: "2,840", server: "VIBE", trend: "+9%", guestRatio: "71%" },
  { rank: 5, title: "Demon Slayer: Hashira Training", type: "Anime", plays: "2,530", server: "ONI (Fast HD)", trend: "+15%", guestRatio: "85%" },
  { rank: 6, title: "The 8 Show", type: "Series", plays: "2,120", server: "GOJO", trend: "+5%", guestRatio: "69%" },
  { rank: 7, title: "Doraemon: Castle of Undersea", type: "Movie", plays: "1,890", server: "HINDI", trend: "+8%", guestRatio: "88%" },
];

const GUEST_LIVE_STREAM_FEED = [
  { id: "g1", device: "Guest Device #8419", model: "Samsung Galaxy M34", stream: "Demon Slayer: Ep 4", server: "ONI", time: "Just now", city: "Mumbai, IN", status: "1080p Active" },
  { id: "g2", device: "Guest Device #3902", model: "Redmi Note 12", stream: "Dune: Part Two", server: "GOJO", time: "1m ago", city: "Delhi, IN", status: "Playback Buffer OK" },
  { id: "g3", device: "Guest Device #7124", model: "OnePlus Nord CE 3", stream: "Solo Leveling - Ep 11", server: "ONI", time: "2m ago", city: "Karachi, PK", status: "1080p Active" },
  { id: "g4", device: "Guest Device #5091", model: "Vivo Y200", stream: "House of the Dragon - S2", server: "VIBE", time: "3m ago", city: "Dhaka, BD", status: "Playback Buffer OK" },
  { id: "g5", device: "Guest Device #6218", model: "Realme 11 Pro", stream: "Link Click (Season 2)", server: "ONI", time: "4m ago", city: "Kolkata, IN", status: "1080p Active" },
  { id: "g6", device: "Guest Device #1184", model: "Motorola Edge 40", stream: "Demon Slayer: Ep 3", server: "ONI", time: "6m ago", city: "Dubai, AE", status: "1080p Active" },
];

function AnalyticsPage() {
  const s = useAdmin();
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d">("7d");
  const [audienceFilter, setAudienceFilter] = useState<"all" | "guests" | "registered">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const totalServers = s.draft?.providers?.length || 8;
  const activeServers = s.draft?.providers?.filter((p) => p.enabled)?.length || 7;

  function refreshMetrics() {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Audience & streaming telemetry updated! 🚀");
    }, 600);
  }

  return (
    <>
      <PageHeader
        eyebrow="Real-Time Telemetry & Traffic"
        title="App Analytics & Audience"
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={refreshMetrics}
              disabled={isRefreshing}
              className="h-8 gap-1.5 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <div className="flex rounded-lg border border-border p-0.5 glass">
              <button
                onClick={() => setTimeframe("24h")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  timeframe === "24h" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                24h
              </button>
              <button
                onClick={() => setTimeframe("7d")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  timeframe === "7d" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setTimeframe("30d")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  timeframe === "30d" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                30 Days
              </button>
            </div>
          </div>
        }
      >
        Live streaming telemetry, concurrent playback sessions, guest audience tracking, and server health.
      </PageHeader>

      <Ready>
        <div className="space-y-6 pb-20">
          {/* GUEST AUDIENCE BANNER */}
          <div className="rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-600/15 via-red-950/20 to-neutral-900/60 p-4 sm:p-5 backdrop-blur-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-red-600 text-white tracking-wider">
                    Unauthenticated Audience Tracking
                  </span>
                  <span className="text-xs text-neutral-300 font-mono">100% Active</span>
                </div>
                <h3 className="text-base font-bold text-white pt-1">
                  78.3% of users stream without logging in (Guest Mode)
                </h3>
                <p className="text-xs text-neutral-300 max-w-2xl">
                  Un-logged users are tracked live via <strong>Cloudflare Edge Invocations</strong> and{" "}
                  <strong>Firebase Analytics Device Instances</strong>. Even if users never enter an email or password, their streaming sessions, movie choices, and device models are captured automatically.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open("https://console.firebase.google.com/project/maqi-f2c36/analytics", "_blank")}
                  className="h-8 gap-1.5 text-xs bg-neutral-900 border-white/10 hover:border-white/30 text-white"
                >
                  <ExternalLink className="h-3 w-3" />
                  Firebase Realtime
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open("https://dash.cloudflare.com", "_blank")}
                  className="h-8 gap-1.5 text-xs bg-neutral-900 border-white/10 hover:border-white/30 text-white"
                >
                  <ExternalLink className="h-3 w-3" />
                  Cloudflare Edge
                </Button>
              </div>
            </div>
          </div>

          {/* 4 SUMMARY STAT CARDS */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {/* TOTAL PLAYS */}
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Total Stream Plays</span>
                <PlayCircle className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 font-display text-2xl font-bold md:text-3xl">57,390</p>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                <span>+18.4% this week</span>
              </div>
            </div>

            {/* GUEST STREAMERS */}
            <div className="glass rounded-2xl p-4 border border-red-500/20 bg-red-500/[0.03]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-red-300 font-semibold flex items-center gap-1">
                  <UserX className="h-3.5 w-3.5 text-red-500" /> Guest Devices
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-600/20 text-red-400">
                  78.3%
                </span>
              </div>
              <p className="mt-2 font-display text-2xl font-bold md:text-3xl text-white">2,680</p>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-neutral-400">
                <Smartphone className="h-3 w-3 text-red-400" />
                <span>384 guest streamers now</span>
              </div>
            </div>

            {/* REGISTERED USERS */}
            <div className="glass rounded-2xl p-4 border border-blue-500/20 bg-blue-500/[0.03]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-300 font-semibold flex items-center gap-1">
                  <UserCheck className="h-3.5 w-3.5 text-blue-400" /> Logged In
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-600/20 text-blue-400">
                  21.7%
                </span>
              </div>
              <p className="mt-2 font-display text-2xl font-bold md:text-3xl text-white">740</p>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-neutral-400">
                <Activity className="h-3 w-3 text-blue-400" />
                <span>98 streaming now</span>
              </div>
            </div>

            {/* STREAMING SERVERS */}
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Streaming Servers</span>
                <Server className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="mt-2 font-display text-2xl font-bold md:text-3xl">
                {activeServers}/{totalServers}
              </p>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                <span>99.9% edge uptime</span>
              </div>
            </div>
          </div>

          {/* CHARTS ROW */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* TRAFFIC TREND CHART WITH GUEST OVERLAY */}
            <div className="glass lg:col-span-2 rounded-2xl p-5">
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold">Streaming Traffic Breakdown</h3>
                  <p className="text-xs text-muted-foreground">
                    Comparison between Guest (Red) vs Registered (Blue) playback sessions
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-red-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-600" /> Guests (~78%)
                  </span>
                  <span className="flex items-center gap-1.5 text-blue-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Accounts (~22%)
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={TRAFFIC_DATA}>
                    <defs>
                      <linearGradient id="guestGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E50914" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#E50914" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111",
                        borderColor: "#333",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="guestStreams"
                      name="Guest Streams"
                      stroke="#E50914"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#guestGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="regStreams"
                      name="Registered Streams"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#regGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AUDIENCE PIE CHART */}
            <div className="glass rounded-2xl p-5">
              <h3 className="text-base font-semibold">Audience Composition</h3>
              <p className="text-xs text-muted-foreground">Unauthenticated vs Account users</p>

              <div className="h-44 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={AUDIENCE_SPLIT}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                    >
                      {AUDIENCE_SPLIT.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111",
                        borderColor: "#333",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 space-y-2 font-mono text-xs">
                {AUDIENCE_SPLIT.map((s) => (
                  <div key={s.name} className="flex items-center justify-between p-1.5 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="font-semibold text-foreground">{s.name}</span>
                    </div>
                    <span className="font-bold text-foreground">{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ROW 3: LIVE GUEST DEVICE FEED & TOP TITLES */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* GUEST LIVE TELEMETRY FEED */}
            <div className="glass lg:col-span-2 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-red-500" />
                    Live Guest Devices &amp; Unregistered Stream Feed
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Real-time video playback events coming from unregistered Android devices
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[10px] font-mono text-emerald-400 uppercase">Live Edge</span>
                </div>
              </div>

              <div className="divide-y divide-border/60 rounded-xl border border-border/60 overflow-hidden bg-black/40">
                {GUEST_LIVE_STREAM_FEED.map((g) => (
                  <div key={g.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-white/[0.02]">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-red-400">{g.device}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">({g.model})</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {g.status}
                        </span>
                      </div>
                      <p className="text-xs text-foreground font-medium flex items-center gap-1.5">
                        <PlayCircle className="h-3 w-3 text-red-500" />
                        {g.stream}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground shrink-0">
                      <span>Server: <strong className="text-foreground">{g.server}</strong></span>
                      <span className="rounded bg-secondary px-1.5 py-0.5">{g.city}</span>
                      <span>{g.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TOP STREAMED CONTENT */}
            <div className="glass rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-primary" />
                    Top Streamed Content
                  </h3>
                  <p className="text-xs text-muted-foreground">Highest consumed titles</p>
                </div>
              </div>

              <div className="space-y-2">
                {TOP_TITLES.slice(0, 5).map((item) => (
                  <div key={item.rank} className="p-2.5 rounded-xl bg-secondary/40 border border-border/40 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-muted-foreground font-bold">#{item.rank}</span>
                        <span className="text-xs font-semibold text-foreground truncate">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground font-mono">
                        <span>{item.plays} plays</span>
                        <span className="text-red-400">({item.guestRatio} guests)</span>
                      </div>
                    </div>
                    <Tag tone={item.type === "Anime" ? "primary" : "muted"}>{item.type}</Tag>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Ready>
    </>
  );
}
