import { DEMO_DATA } from "./demo-data";
import type { AdminData, CatalogItem, CuratedList, HeroBanner, HomeSection, PublishResult, StreamingProvider } from "./types";

const WORKER_BASE = "https://modi.aabito986f.workers.dev";
const AUTH_TOKEN = "maqi_sec_786_auth_gate_v1";

export interface AdminService {
  mode: "demo" | "live";
  load(): Promise<AdminData>;
  publish(data: AdminData): Promise<PublishResult>;
}

export const liveWorkerAdminService: AdminService = {
  mode: "live",

  async load(): Promise<AdminData> {
    try {
      const res = await fetch(`${WORKER_BASE}/api/config`, {
        headers: {
          "X-Maqi-App-Token": AUTH_TOKEN,
        },
      });

      if (!res.ok) {
        throw new Error(`Worker returned ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();

      // 1. Map streaming servers to UI providers
      const providers: StreamingProvider[] = [];
      if (json.streaming_servers && typeof json.streaming_servers === "object") {
        for (const [key, srv] of Object.entries(json.streaming_servers as Record<string, any>)) {
          providers.push({
            id: srv.id || key,
            name: srv.name || key,
            movieTemplate: (srv.movie_template || srv.movie || "").replaceAll("{id}", "{tmdbId}"),
            tvTemplate: (srv.tv_template || srv.tv || "").replaceAll("{id}", "{tmdbId}"),
            enabled: srv.enabled !== false,
          });
        }
      }

      // 2. Map home sections
      const sections: HomeSection[] = (json.home_sections || []).map((sec: any, idx: number) => ({
        id: sec.id || `sec_${idx}`,
        key: sec.id || `key_${idx}`,
        title: sec.title || `Section ${idx + 1}`,
        enabled: sec.enabled !== false,
        badge: sec.badge || "",
        card_type: sec.card_type || "STANDARD",
        config: {
          itemLimit: sec.limit || 20,
          source: sec.endpoint || "trending",
        },
      }));

      // 3. Map curated collections
      const curated: CuratedList[] = (json.curated_collections || []).map((col: any, idx: number) => ({
        id: col.id || `col_${idx}`,
        name: col.title || col.name || `Collection ${idx + 1}`,
        description: col.subtitle || "",
        badge: col.badge || "",
        bannerImage: col.banner_image || "",
        themeColor: col.theme_color || "#E50914",
        enabled: col.enabled !== false,
        tmdbIds: (col.items || []).map((item: any) => String(item.tmdb_id || item.id)),
      }));

      // 4. Map hero banners
      const banners: HeroBanner[] = (json.hero_items || []).map((item: any, idx: number) => ({
        id: `banner_${item.tmdb_id || idx}`,
        tmdbId: String(item.tmdb_id || ""),
        title: item.title || "",
        type: (item.media_type === "tv" ? "series" : "movie") as "movie" | "series",
        tagline: item.subtitle || "",
        enabled: item.is_active !== false,
      }));

      return {
        catalog: [],
        curated: curated,
        banners: banners,
        sections: sections,
        providers: providers,
        admins: [
          { email: "jojo219884@gmail.com", role: "owner", addedAt: new Date().toISOString().slice(0, 10) },
          { email: "aabito986f@gmail.com", role: "admin", addedAt: new Date().toISOString().slice(0, 10) },
        ],
      };
    } catch (err) {
      console.warn("Worker fetch error:", err);
      return structuredClone(DEMO_DATA);
    }
  },

  async publish(data: AdminData): Promise<PublishResult> {
    try {
      // 1. Transform providers back to Cloudflare KV streaming_servers format
      const streaming_servers: Record<string, any> = {};
      for (const p of data.providers) {
        if (!p.enabled) continue;
        const upper = p.id.toUpperCase();
        streaming_servers[upper] = {
          id: upper,
          name: p.name,
          movie_template: p.movieTemplate.replaceAll("{tmdbId}", "{id}"),
          tv_template: p.tvTemplate.replaceAll("{tmdbId}", "{id}"),
          category: "Fast",
          badge: "HD",
        };
      }

      // 2. Transform sections
      const home_sections = data.sections.map((s) => ({
        id: s.key || s.id,
        title: s.title,
        endpoint: s.config.source,
        badge: s.badge ? s.badge.trim() : null,
        card_type: s.card_type || "STANDARD",
        enabled: s.enabled,
      }));

      // 3. Transform curated lists
      const curated_collections = data.curated.map((c) => ({
        id: c.id,
        title: c.name,
        subtitle: c.description || "",
        badge: c.badge || "",
        banner_image: c.bannerImage || "",
        theme_color: c.themeColor || "#E50914",
        enabled: c.enabled !== false,
        items: c.tmdbIds.map((id, idx) => ({
          tmdb_id: parseInt(id.trim(), 10) || 0,
          media_type: "movie",
          type: "movie",
          custom_badge: `RANK #${idx + 1}`,
        })),
      }));

      // 4. Transform banners
      const hero_items = data.banners.map((b) => ({
        type: "tmdb",
        tmdb_id: parseInt(b.tmdbId, 10) || 0,
        title: b.title,
        subtitle: b.tagline,
        media_type: b.type === "series" ? "tv" : "movie",
        is_active: b.enabled,
      }));

      const payload = {
        streaming_servers,
        home_sections,
        curated_collections,
        hero_items,
      };

      const res = await fetch(`${WORKER_BASE}/api/admin/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Maqi-App-Token": AUTH_TOKEN,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        return { status: "error", message: `Worker error ${res.status}: ${text}` };
      }

      return { status: "confirmed", at: new Date().toISOString() };
    } catch (err) {
      return { status: "error", message: err instanceof Error ? err.message : "Publish failed" };
    }
  },
};

export const adminService: AdminService = liveWorkerAdminService;
