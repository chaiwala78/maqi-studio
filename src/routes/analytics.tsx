import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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

export const Route = createFileRoute("/analytics")({
  head: pageHead("Analytics", "Live streaming metrics, user activity, and server telemetry for MaQi."),
  component: AnalyticsPage,
});

const TRAFFIC_DATA = [
  { day: "Mon", streams: 5420, users: 1120 },
  { day: "Tue", streams: 6180, users: 1250 },
  { day: "Wed", streams: 5900, users: 1190 },
  { day: "Thu", streams: 7200, users: 1420 },
  { day: "Fri", streams: 8640, users: 1780 },
  { day: "Sat", streams: 11200, users: 2450 },
  { day: "Sun", streams: 12850, users: 2890 },
];

const SERVER_SHARE_DATA = [
  { name: "ONI", value: 38, color: "#E50914" },
  { name: "GOJO", value: 27, color: "#00E5FF" },
  { name: "VIBE", value: 18, color: "#9C27B0" },
  { name: "PULSE", value: 11, color: "#FF9800" },
  { name: "HINDI", value: 6, color: "#4CAF50" },
];

const TOP_TITLES = [
  { rank: 1, title: "Link Click (Season 2)", type: "Anime", plays: "4,820", server: "ONI (Fast HD)", trend: "+24%" },
  { rank: 2, title: "Dune: Part Two", type: "Movie", plays: "3,950", server: "GOJO (Multi-Lang)", trend: "+18%" },
  { rank: 3, title: "Solo Leveling", type: "Anime", plays: "3,610", server: "ONI (Fast HD)", trend: "+12%" },
  { rank: 4, title: "House of the Dragon", type: "Series", plays: "2,840", server: "VIBE", trend: "+9%" },
  { rank: 5, title: "Demon Slayer: Hashira Training", type: "Anime", plays: "2,530", server: "ONI (Fast HD)", trend: "+15%" },
  { rank: 6, title: "The 8 Show", type: "Series", plays: "2,120", server: "GOJO", trend: "+5%" },
  { rank: 7, title: "Doraemon: Castle of Undersea", type: "Movie", plays: "1,890", server: "HINDI", trend: "+8%" },
];

const LIVE_EVENTS = [
  { id: "e1", action: "Stream Started", title: "Link Click - Ep 4", server: "ONI", time: "Just now", country: "IN" },
  { id: "e2", action: "Quality Switched", title: "Dune: Part Two (1080p)", server: "GOJO", time: "1m ago", country: "IN" },
  { id: "e3", action: "Added to Watchlist", title: "Solo Leveling", server: "-", time: "2m ago", country: "PK" },
  { id: "e4", action: "New User Registration", title: "Google Auth Sync", server: "-", time: "3m ago", country: "IN" },
  { id: "e5", action: "Stream Started", title: "House of the Dragon - Ep 8", server: "VIBE", time: "4m ago", country: "BD" },
];

function AnalyticsPage() {
  const s = useAdmin();
  const [timeframe, setTimeframe] = useState<"24h" | "7d" | "30d">("7d");

  const totalServers = s.draft?.providers?.length || 8;
  const activeServers = s.draft?.providers?.filter((p) => p.enabled)?.length || 7;

  return (
    <>
      <PageHeader
        eyebrow="Real-Time Telemetry"
        title="App Analytics"
        action={
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
        }
      >
        Live streaming telemetry, concurrent playback sessions, server health, and top consumed titles.
      </PageHeader>

      <Ready>
        <div className="space-y-6 pb-20">
          {/* 4 SUMMARY STAT CARDS */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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

            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Active Streamers</span>
                <Users className="h-4 w-4 text-cyan-400" />
              </div>
              <p className="mt-2 font-display text-2xl font-bold md:text-3xl">3,420</p>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-cyan-400">
                <Activity className="h-3 w-3" />
                <span>482 streaming now</span>
              </div>
            </div>

            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Avg. Watch Time</span>
                <Clock className="h-4 w-4 text-purple-400" />
              </div>
              <p className="mt-2 font-display text-2xl font-bold md:text-3xl">44.8m</p>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-purple-400">
                <span>+6.2m vs last week</span>
              </div>
            </div>

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
            {/* TRAFFIC TREND CHART */}
            <div className="glass lg:col-span-2 rounded-2xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">Streaming Traffic Trend</h3>
                  <p className="text-xs text-muted-foreground">Daily playback sessions across all servers</p>
                </div>
                <Tag tone="primary">Live</Tag>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={TRAFFIC_DATA}>
                    <defs>
                      <linearGradient id="streamGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E50914" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#E50914" stopOpacity={0.0} />
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
                      dataKey="streams"
                      stroke="#E50914"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#streamGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* SERVER LOAD DISTRIBUTION */}
            <div className="glass rounded-2xl p-5">
              <h3 className="text-base font-semibold">Server Routing Share</h3>
              <p className="text-xs text-muted-foreground">Load distribution by streaming provider</p>

              <div className="h-44 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={SERVER_SHARE_DATA}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                    >
                      {SERVER_SHARE_DATA.map((entry, index) => (
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

              <div className="mt-3 space-y-1.5 font-mono text-xs">
                {SERVER_SHARE_DATA.map((s) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="font-semibold">{s.name}</span>
                    </div>
                    <span className="text-muted-foreground">{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ROW 3: TOP STREAMED TITLES & LIVE EVENTS */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* TOP TITLES TABLE */}
            <div className="glass lg:col-span-2 rounded-2xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">Top Streamed Content</h3>
                  <p className="text-xs text-muted-foreground">Most watched anime, movies & series</p>
                </div>
                <Flame className="h-4 w-4 text-primary" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="pb-2.5 font-medium">#</th>
                      <th className="pb-2.5 font-medium">Title</th>
                      <th className="pb-2.5 font-medium">Type</th>
                      <th className="pb-2.5 font-medium">Streams</th>
                      <th className="pb-2.5 font-medium">Top Server</th>
                      <th className="pb-2.5 font-medium text-right">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {TOP_TITLES.map((item) => (
                      <tr key={item.rank} className="hover:bg-white/5">
                        <td className="py-2.5 font-mono text-muted-foreground">#{item.rank}</td>
                        <td className="py-2.5 font-medium text-foreground">{item.title}</td>
                        <td className="py-2.5">
                          <Tag tone={item.type === "Anime" ? "primary" : "neutral"}>{item.type}</Tag>
                        </td>
                        <td className="py-2.5 font-mono">{item.plays}</td>
                        <td className="py-2.5 font-mono text-muted-foreground">{item.server}</td>
                        <td className="py-2.5 text-right font-mono text-emerald-400">{item.trend}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* LIVE EVENT LOG */}
            <div className="glass rounded-2xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">Live Feed</h3>
                  <p className="text-xs text-muted-foreground">Recent client actions</p>
                </div>
                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              </div>

              <ul className="space-y-3">
                {LIVE_EVENTS.map((ev) => (
                  <li key={ev.id} className="rounded-xl border border-border/40 bg-black/20 p-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{ev.action}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{ev.time}</span>
                    </div>
                    <p className="mt-0.5 truncate text-muted-foreground">{ev.title}</p>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                      <span>Server: {ev.server}</span>
                      <span className="rounded bg-white/10 px-1.5 py-0.2">Region: {ev.country}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Ready>
    </>
  );
}
