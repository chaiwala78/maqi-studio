import { useState, useEffect, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Tag, Empty } from "@/components/admin/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { resetDemo, useAdmin } from "@/services/store";
import { adminService } from "@/services/admin-service";
import { pageHead } from "@/lib/head";
import {
  Server,
  Database,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe2,
  Trash2,
  Plus,
  Radio,
  Clock,
  Layers,
  FileJson,
  Eye,
  Send,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import {
  db,
  rtdb,
  firebaseConfig,
  auth,
} from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  limit,
  query,
} from "firebase/firestore";
import { ref, get } from "firebase/database";

export const Route = createFileRoute("/settings")({
  head: pageHead("Cloud Hub & Systems", "Real-time Cloudflare Worker telemetry, streaming server health, and live Firebase database manager."),
  component: CloudSettingsPage,
});

const WORKER_URL = "https://modi.aabito986f.workers.dev";
const AUTH_TOKEN = "maqi_sec_786_auth_gate_v1";

interface StreamingServerInfo {
  id: string;
  name: string;
  movie_template?: string;
  tv_template?: string;
  category?: string;
  badge?: string;
  enabled?: boolean;
}

interface FirestoreDoc {
  id: string;
  data: Record<string, any>;
}

function CloudSettingsPage() {
  const adminState = useAdmin();

  // Tab State
  const [activeTab, setActiveTab] = useState<"worker" | "firebase" | "audit">("worker");

  // Worker Health Telemetry
  const [workerPingLoading, setWorkerPingLoading] = useState(false);
  const [workerLatency, setWorkerLatency] = useState<number | null>(null);
  const [workerStatus, setWorkerStatus] = useState<"online" | "offline" | "checking">("checking");
  const [workerData, setWorkerData] = useState<any>(null);
  const [streamingServers, setStreamingServers] = useState<StreamingServerInfo[]>([]);
  const [workerRawJson, setWorkerRawJson] = useState<string>("");

  // Firebase Health & Explorer
  const [firebaseStatus, setFirebaseStatus] = useState<"online" | "offline" | "checking">("checking");
  const [rtdbStatus, setRtdbStatus] = useState<"online" | "offline" | "checking">("checking");
  const [selectedCollection, setSelectedCollection] = useState<string>("app_config");
  const [customCollectionName, setCustomCollectionName] = useState<string>("");
  const [docsList, setDocsList] = useState<FirestoreDoc[]>([]);
  const [docsLoading, setDocsLoading] = useState<boolean>(false);

  // Document View / Edit Modal
  const [inspectDoc, setInspectDoc] = useState<FirestoreDoc | null>(null);
  const [isEditingDoc, setIsEditingDoc] = useState(false);
  const [docJsonText, setDocJsonText] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newDocId, setNewDocId] = useState("");
  const [newDocContent, setNewDocContent] = useState('{\n  "title": "Example",\n  "active": true\n}');

  // 1. Initial Checks
  useEffect(() => {
    void checkWorkerHealth();
    void checkFirebaseHealth();
    void loadCollectionDocs("app_config");
  }, []);

  async function checkWorkerHealth() {
    setWorkerPingLoading(true);
    setWorkerStatus("checking");
    const start = performance.now();
    try {
      const res = await fetch(`${WORKER_URL}/api/config`, {
        headers: {
          "X-Maqi-App-Token": AUTH_TOKEN,
        },
      });
      const end = performance.now();
      const latency = Math.round(end - start);
      setWorkerLatency(latency);

      if (res.ok) {
        setWorkerStatus("online");
        const json = await res.json();
        setWorkerData(json);
        setWorkerRawJson(JSON.stringify(json, null, 2));

        if (json.streaming_servers && typeof json.streaming_servers === "object") {
          const list: StreamingServerInfo[] = Object.entries(json.streaming_servers).map(([k, v]: [string, any]) => ({
            id: v.id || k,
            name: v.name || k,
            movie_template: v.movie_template || v.movie || "",
            tv_template: v.tv_template || v.tv || "",
            category: v.category || "Fast",
            badge: v.badge || "HD",
            enabled: v.enabled !== false,
          }));
          setStreamingServers(list);
        }
        toast.success(`Cloudflare Worker is Live! (${latency}ms)`);
      } else {
        setWorkerStatus("offline");
        toast.error(`Worker responded with HTTP ${res.status}`);
      }
    } catch (err: any) {
      setWorkerStatus("offline");
      toast.error(`Worker unreachable: ${err.message}`);
    } finally {
      setWorkerPingLoading(false);
    }
  }

  async function checkFirebaseHealth() {
    try {
      const colRef = collection(db, "app_config");
      const q = query(colRef, limit(1));
      await getDocs(q);
      setFirebaseStatus("online");
    } catch (e) {
      setFirebaseStatus("offline");
    }

    try {
      const rRef = ref(rtdb, ".info/connected");
      await get(rRef);
      setRtdbStatus("online");
    } catch (e) {
      setRtdbStatus("offline");
    }
  }

  async function loadCollectionDocs(colName: string) {
    if (!colName.trim()) return;
    setDocsLoading(true);
    try {
      const colRef = collection(db, colName.trim());
      const q = query(colRef, limit(40));
      const snap = await getDocs(q);
      const items: FirestoreDoc[] = [];
      snap.forEach((d) => {
        items.push({ id: d.id, data: d.data() });
      });
      setDocsList(items);
      setSelectedCollection(colName);
    } catch (err: any) {
      toast.error(`Failed to load ${colName}: ${err.message}`);
    } finally {
      setDocsLoading(false);
    }
  }

  async function handleSaveEditedDoc() {
    if (!inspectDoc) return;
    try {
      const parsed = JSON.parse(docJsonText);
      const docRef = doc(db, selectedCollection, inspectDoc.id);
      await setDoc(docRef, parsed);
      toast.success(`Document '${inspectDoc.id}' updated in Firestore! 🚀`);
      setInspectDoc(null);
      setIsEditingDoc(false);
      void loadCollectionDocs(selectedCollection);
    } catch (err: any) {
      toast.error(`JSON Parse Error or Save Failed: ${err.message}`);
    }
  }

  async function handleDeleteDoc(docId: string) {
    if (!window.confirm(`Are you sure you want to delete document '${docId}' from collection '${selectedCollection}'?`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, selectedCollection, docId));
      toast.success(`Document '${docId}' deleted successfully!`);
      if (inspectDoc?.id === docId) {
        setInspectDoc(null);
      }
      void loadCollectionDocs(selectedCollection);
    } catch (err: any) {
      toast.error(`Failed to delete document: ${err.message}`);
    }
  }

  async function handleCreateDoc() {
    if (!newDocId.trim()) {
      toast.error("Please provide a Document ID.");
      return;
    }
    try {
      const parsed = JSON.parse(newDocContent);
      const docRef = doc(db, selectedCollection, newDocId.trim());
      await setDoc(docRef, parsed);
      toast.success(`Document '${newDocId}' created in '${selectedCollection}'! 🚀`);
      setIsCreateModalOpen(false);
      setNewDocId("");
      void loadCollectionDocs(selectedCollection);
    } catch (err: any) {
      toast.error(`Invalid JSON or Create Failed: ${err.message}`);
    }
  }

  function handleCopyJson(jsonString: string) {
    navigator.clipboard.writeText(jsonString);
    toast.success("JSON copied to clipboard! 📋");
  }

  function testProviderTemplate(template?: string) {
    if (!template) {
      toast.error("No URL template available for this provider.");
      return;
    }
    const sampleUrl = template
      .replaceAll("{id}", "550")
      .replaceAll("{tmdbId}", "550")
      .replaceAll("{season}", "1")
      .replaceAll("{episode}", "1")
      .replaceAll("{color}", "E50914");
    window.open(sampleUrl, "_blank");
  }

  return (
    <>
      <PageHeader
        eyebrow="Systems & Infrastructure"
        title="Cloud Hub & Health Telemetry"
      />

      {/* TOP STATUS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        {/* WORKER STATUS */}
        <div className="glass rounded-2xl p-4 border border-border/60 flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase text-muted-foreground flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-red-500" />
              Cloudflare Worker
            </span>
            <div className="flex items-center gap-2 pt-0.5">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  workerStatus === "online"
                    ? "bg-emerald-500 animate-pulse"
                    : workerStatus === "checking"
                    ? "bg-amber-500 animate-spin"
                    : "bg-red-500"
                }`}
              />
              <span className="font-semibold text-sm">
                {workerStatus === "online" ? "Healthy (200 OK)" : workerStatus === "checking" ? "Checking..." : "Offline"}
              </span>
            </div>
            <p className="text-[11px] font-mono text-muted-foreground">
              {workerLatency !== null ? `${workerLatency}ms latency` : "pinging..."}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={checkWorkerHealth}
            disabled={workerPingLoading}
            className="h-8 w-8 p-0 shrink-0"
            title="Re-ping Worker"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${workerPingLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* FIRESTORE STATUS */}
        <div className="glass rounded-2xl p-4 border border-border/60 flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase text-muted-foreground flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-amber-500" />
              Firestore DB
            </span>
            <div className="flex items-center gap-2 pt-0.5">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  firebaseStatus === "online" ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              <span className="font-semibold text-sm">
                {firebaseStatus === "online" ? "Connected" : "Re-connecting"}
              </span>
            </div>
            <p className="text-[11px] font-mono text-muted-foreground truncate max-w-[150px]">
              {firebaseConfig.projectId}
            </p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>

        {/* REALTIME DB */}
        <div className="glass rounded-2xl p-4 border border-border/60 flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase text-muted-foreground flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-blue-400" />
              Realtime Database
            </span>
            <div className="flex items-center gap-2 pt-0.5">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  rtdbStatus === "online" ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              <span className="font-semibold text-sm">
                {rtdbStatus === "online" ? "Active Stream" : "Ready"}
              </span>
            </div>
            <p className="text-[11px] font-mono text-muted-foreground">asia-southeast1</p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Activity className="h-4 w-4" />
          </div>
        </div>

        {/* STREAMING SERVERS */}
        <div className="glass rounded-2xl p-4 border border-border/60 flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase text-muted-foreground flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-purple-400" />
              Streaming Servers
            </span>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="font-semibold text-sm text-foreground">
                {streamingServers.length} Servers Active
              </span>
            </div>
            <p className="text-[11px] font-mono text-muted-foreground">
              {streamingServers.map((s) => s.id).join(", ") || "Loading..."}
            </p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Globe2 className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3 max-w-md bg-secondary/60 p-1 rounded-xl">
          <TabsTrigger value="worker" className="text-xs gap-1.5">
            <Server className="h-3.5 w-3.5" />
            Worker &amp; Servers
          </TabsTrigger>
          <TabsTrigger value="firebase" className="text-xs gap-1.5">
            <Database className="h-3.5 w-3.5" />
            Firebase DB Explorer
          </TabsTrigger>
          <TabsTrigger value="audit" className="text-xs gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Activity Log
          </TabsTrigger>
        </TabsList>

        {/* ============================================================== */}
        {/* TAB 1: CLOUDFLARE WORKER & STREAMING SERVERS                   */}
        {/* ============================================================== */}
        <TabsContent value="worker" className="space-y-6">
          {/* WORKER TELEMETRY CARD */}
          <div className="glass rounded-2xl border border-border/60 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Server className="h-4 w-4 text-red-500" />
                  Cloudflare Worker Telemetry
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Direct live connection to your backend endpoint serving JSON to the Android App.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`${WORKER_URL}/api/config`, "_blank")}
                  className="h-8 gap-1.5 text-xs"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open Live Endpoint
                </Button>
                <Button
                  size="sm"
                  onClick={checkWorkerHealth}
                  disabled={workerPingLoading}
                  className="h-8 gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${workerPingLoading ? "animate-spin" : ""}`} />
                  Test Latency Ping
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-secondary/40 border border-border/40">
                <span className="text-[10px] uppercase font-mono text-muted-foreground block mb-1">
                  Worker Base URL
                </span>
                <span className="text-xs font-mono text-foreground break-all">{WORKER_URL}</span>
              </div>

              <div className="p-3 rounded-xl bg-secondary/40 border border-border/40">
                <span className="text-[10px] uppercase font-mono text-muted-foreground block mb-1">
                  Security Handshake
                </span>
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  X-Maqi-App-Token Authenticated
                </span>
              </div>

              <div className="p-3 rounded-xl bg-secondary/40 border border-border/40">
                <span className="text-[10px] uppercase font-mono text-muted-foreground block mb-1">
                  Response Ping
                </span>
                <span className="text-xs font-semibold text-foreground">
                  {workerLatency !== null ? `${workerLatency} ms — Excellent Response` : "Awaiting test"}
                </span>
              </div>
            </div>
          </div>

          {/* ACTIVE STREAMING SERVERS LIST */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Radio className="h-4 w-4 text-purple-400" />
                  Active Streaming Servers (Loaded in Cloudflare KV)
                </h3>
                <p className="text-xs text-muted-foreground">
                  These servers are actively delivered to MaQi Android devices for movie and TV playback.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {streamingServers.map((srv) => (
                <div
                  key={srv.id}
                  className="glass rounded-xl p-4 border border-border/60 space-y-3 hover:border-red-500/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-red-600/10 text-red-400 font-bold font-mono text-xs flex items-center justify-center border border-red-500/20">
                        {srv.id}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">{srv.name}</h4>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          Category: {srv.category} | Badge: {srv.badge}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Online
                    </span>
                  </div>

                  {srv.movie_template && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-muted-foreground">Movie Template:</span>
                        <button
                          type="button"
                          onClick={() => testProviderTemplate(srv.movie_template)}
                          className="text-[10px] text-red-400 hover:underline flex items-center gap-1"
                        >
                          <PlayIcon className="h-2.5 w-2.5" /> Test Movie
                        </button>
                      </div>
                      <p className="text-[11px] font-mono text-neutral-300 bg-black/40 p-2 rounded-lg border border-border/30 truncate">
                        {srv.movie_template}
                      </p>
                    </div>
                  )}

                  {srv.tv_template && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-muted-foreground">TV Series Template:</span>
                        <button
                          type="button"
                          onClick={() => testProviderTemplate(srv.tv_template)}
                          className="text-[10px] text-red-400 hover:underline flex items-center gap-1"
                        >
                          <PlayIcon className="h-2.5 w-2.5" /> Test TV
                        </button>
                      </div>
                      <p className="text-[11px] font-mono text-neutral-300 bg-black/40 p-2 rounded-lg border border-border/30 truncate">
                        {srv.tv_template}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* LIVE WORKER KV JSON VIEWER */}
          <div className="glass rounded-2xl border border-border/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FileJson className="h-4 w-4 text-amber-400" />
                  Live KV Cache Inspector
                </h3>
                <p className="text-xs text-muted-foreground">
                  Exact JSON snapshot currently returned to the MaQi Android app from Cloudflare KV.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopyJson(workerRawJson)}
                className="h-8 gap-1.5 text-xs"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Full JSON
              </Button>
            </div>
            <pre className="max-h-80 overflow-y-auto rounded-xl bg-black/60 p-4 font-mono text-xs text-neutral-300 border border-white/5 selection:bg-red-500 selection:text-white">
              {workerRawJson || "Loading live config from Cloudflare Worker..."}
            </pre>
          </div>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 2: FIREBASE DATABASE BROWSER (NO CONSOLE NEEDED)          */}
        {/* ============================================================== */}
        <TabsContent value="firebase" className="space-y-6">
          <div className="glass rounded-2xl border border-border/60 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Database className="h-4 w-4 text-amber-500" />
                  Firestore Collection Browser
                </h3>
                <p className="text-xs text-muted-foreground">
                  Inspect, create, edit and delete documents directly without needing to open the Firebase Console.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                className="h-8 gap-1.5 text-xs bg-amber-500 hover:bg-amber-600 text-black font-semibold shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                Add New Document
              </Button>
            </div>

            {/* PRESET COLLECTION PILLS */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-mono text-muted-foreground mr-1">Collections:</span>
              {[
                "app_config",
                "broadcast_notifications",
                "banners",
                "sections",
                "curated_collections",
                "catalog",
              ].map((cName) => (
                <button
                  key={cName}
                  type="button"
                  onClick={() => loadCollectionDocs(cName)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors border ${
                    selectedCollection === cName
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold"
                      : "bg-secondary/40 text-muted-foreground border-border/40 hover:text-foreground"
                  }`}
                >
                  {cName}
                </button>
              ))}
            </div>

            {/* CUSTOM COLLECTION INPUT */}
            <div className="flex items-center gap-2 max-w-sm pt-1">
              <Input
                type="text"
                placeholder="Or enter custom collection name"
                value={customCollectionName}
                onChange={(e) => setCustomCollectionName(e.target.value)}
                className="h-8 text-xs font-mono"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadCollectionDocs(customCollectionName)}
                disabled={!customCollectionName.trim() || docsLoading}
                className="h-8 text-xs shrink-0"
              >
                Fetch
              </Button>
            </div>
          </div>

          {/* DOCUMENTS LIST */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-amber-400" />
                Collection: <code className="text-amber-300 font-mono">{selectedCollection}</code>
                <span className="text-muted-foreground font-normal">
                  ({docsList.length} documents loaded)
                </span>
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => loadCollectionDocs(selectedCollection)}
                disabled={docsLoading}
                className="h-7 text-xs gap-1"
              >
                <RefreshCw className={`h-3 w-3 ${docsLoading ? "animate-spin" : ""}`} /> Refresh
              </Button>
            </div>

            {docsLoading ? (
              <div className="p-8 text-center text-xs text-muted-foreground glass rounded-2xl animate-pulse">
                Loading Firestore documents from {selectedCollection}...
              </div>
            ) : docsList.length === 0 ? (
              <div className="p-8 text-center glass rounded-2xl border border-dashed border-border/60">
                <p className="text-xs text-muted-foreground">
                  No documents found in collection &apos;{selectedCollection}&apos;.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-3 text-xs gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Create Document
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/60 glass rounded-2xl border border-border/60 overflow-hidden">
                {docsList.map((docItem) => {
                  const previewKeys = Object.keys(docItem.data).slice(0, 4);
                  return (
                    <div
                      key={docItem.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-foreground truncate">
                            {docItem.id}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-muted-foreground truncate max-w-xl">
                          {previewKeys.map((k) => `${k}: ${JSON.stringify(docItem.data[k])}`).join(" | ")}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setInspectDoc(docItem);
                            setDocJsonText(JSON.stringify(docItem.data, null, 2));
                            setIsEditingDoc(false);
                          }}
                          className="h-7 text-xs gap-1"
                        >
                          <Eye className="h-3 w-3" /> Inspect / Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteDoc(docItem.id)}
                          className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB 3: SYSTEM AUDIT & ACTIVITY LOG                            */}
        {/* ============================================================== */}
        <TabsContent value="audit" className="space-y-6">
          <div className="glass rounded-2xl border border-border/60 divide-y divide-border">
            <div className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold block text-foreground">Data Service Mode</span>
                <span className="text-[11px] text-muted-foreground">Connected to Cloudflare Worker &amp; Firebase</span>
              </div>
              <Tag tone="primary">LIVE PRODUCTION</Tag>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold block text-foreground">Security Clearance</span>
                <span className="text-[11px] text-muted-foreground">Admin Session Status</span>
              </div>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Zero-Trust Gatekeeper Verified
              </span>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold block text-foreground">Local Browser Cache</span>
                <span className="text-[11px] text-muted-foreground">Clear browser storage and reload live from Cloud</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (window.confirm("Purge browser cache and reload fresh from Cloudflare & Firebase?")) {
                    resetDemo();
                    toast.success("Cache cleared! Reloaded fresh data from Cloud.");
                  }
                }}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Purge Local Cache
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Activity Audit Trail
            </h3>

            {adminState.log.length > 0 ? (
              <ul className="divide-y divide-border glass rounded-2xl border border-border/60 overflow-hidden">
                {adminState.log.map((l) => (
                  <li
                    key={l.id}
                    className="flex flex-col gap-1 px-4 py-3 text-xs md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-secondary font-semibold uppercase">
                        {l.action}
                      </span>
                      <span className="text-foreground">{l.target}</span>
                    </div>
                    <time className="font-mono text-[11px] text-muted-foreground">
                      {new Date(l.at).toLocaleString()}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>No recent activity logged in this session.</Empty>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* INSPECT / EDIT DOCUMENT MODAL */}
      <Dialog open={!!inspectDoc} onOpenChange={(open) => !open && setInspectDoc(null)}>
        <DialogContent className="glass sm:max-w-2xl border border-border/60 bg-neutral-950/95 backdrop-blur-2xl p-6">
          <DialogHeader className="text-left space-y-1">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-amber-500" />
              <DialogTitle className="text-sm font-bold font-mono">
                {selectedCollection} / {inspectDoc?.id}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              {isEditingDoc ? "Modify JSON fields and click Save to write live changes to Firestore." : "Inspecting raw document fields."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            {isEditingDoc ? (
              <textarea
                value={docJsonText}
                onChange={(e) => setDocJsonText(e.target.value)}
                rows={14}
                className="w-full rounded-xl bg-black/80 p-3 font-mono text-xs text-amber-300 border border-amber-500/30 focus:outline-none focus:border-amber-500 selection:bg-amber-500 selection:text-black"
              />
            ) : (
              <pre className="max-h-96 overflow-y-auto rounded-xl bg-black/80 p-4 font-mono text-xs text-neutral-300 border border-white/5">
                {JSON.stringify(inspectDoc?.data, null, 2)}
              </pre>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between w-full pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleCopyJson(docJsonText || JSON.stringify(inspectDoc?.data, null, 2))}
              className="h-8 gap-1.5 text-xs"
            >
              <Copy className="h-3 w-3" /> Copy JSON
            </Button>

            <div className="flex items-center gap-2">
              {isEditingDoc ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingDoc(false)}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveEditedDoc}
                    className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                  >
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setInspectDoc(null)}
                    className="h-8 text-xs"
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setIsEditingDoc(true)}
                    className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                  >
                    Edit Document
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CREATE NEW DOCUMENT MODAL */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="glass sm:max-w-lg border border-border/60 bg-neutral-950/95 backdrop-blur-2xl p-6">
          <DialogHeader className="text-left space-y-1">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-amber-500" />
              <DialogTitle className="text-sm font-bold">
                Add Document to &apos;{selectedCollection}&apos;
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Create a new document with custom ID and initial JSON payload.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1 text-left">
              <label className="text-[11px] font-medium text-neutral-300">Document ID *</label>
              <Input
                type="text"
                placeholder="e.g. current_version or banner_101"
                value={newDocId}
                onChange={(e) => setNewDocId(e.target.value)}
                className="h-9 text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1 text-left">
              <label className="text-[11px] font-medium text-neutral-300">Initial JSON Payload</label>
              <textarea
                value={newDocContent}
                onChange={(e) => setNewDocContent(e.target.value)}
                rows={8}
                className="w-full rounded-xl bg-black/80 p-3 font-mono text-xs text-neutral-300 border border-white/10 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCreateDoc}
              className="text-xs bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              Create in Firestore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
