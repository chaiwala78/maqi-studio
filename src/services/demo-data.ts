import type { AdminData } from "./types";

// DEMO DATA. Every ID below is a placeholder ("demo-…"), not a real TMDB ID.
// Provider URLs use the reserved .example domain and are not real providers.
export const DEMO_DATA: AdminData = {
  catalog: [
    { id: "c1", tmdbId: "demo-1001", title: "Ember Tide", type: "anime", visibility: "visible", year: "2024", overview: "A wandering swordswoman guards a coastal shrine.", imageKey: "poster-1" },
    { id: "c2", tmdbId: "demo-1002", title: "Night Ledger", type: "movie", visibility: "visible", year: "2023", overview: "A detective follows a paper trail through a rain-soaked city.", imageKey: "poster-2" },
    { id: "c3", tmdbId: "demo-1003", title: "The Estate", type: "series", visibility: "visible", year: "2025", overview: "Three generations, one tea estate in the hills.", imageKey: "poster-3" },
    { id: "c4", tmdbId: "demo-1004", title: "Iron Dune", type: "anime", visibility: "hidden", year: "2022", overview: "A buried machine wakes in the desert.", imageKey: "banner-1" },
  ],
  curated: [
    { id: "l1", name: "Curated anime", description: "Hand-picked anime IDs", tmdbIds: ["demo-1001", "demo-1004"] },
    { id: "l2", name: "Hindi-dubbed anime", description: "Anime with Hindi dub available", tmdbIds: ["demo-1001"] },
  ],
  banners: [
    { id: "b1", tmdbId: "demo-1004", title: "Iron Dune", type: "anime", tagline: "The machine remembers.", enabled: true, imageKey: "banner-1" },
    { id: "b2", tmdbId: "demo-1003", title: "The Estate", type: "series", tagline: "New season streaming now.", enabled: true, imageKey: "poster-3" },
    { id: "b3", tmdbId: "demo-1002", title: "Night Ledger", type: "movie", tagline: "Every debt gets paid.", enabled: false, imageKey: "poster-2" },
  ],
  sections: [
    { id: "s1", key: "demo_trending", title: "Trending (demo)", enabled: true, config: { itemLimit: 20, source: "trending" } },
    { id: "s2", key: "demo_anime", title: "Anime (demo)", enabled: true, config: { itemLimit: 20, source: "curated:l1" } },
    { id: "s3", key: "demo_hindi", title: "Hindi Dubbed (demo)", enabled: true, config: { itemLimit: 15, source: "curated:l2" } },
    { id: "s4", key: "demo_series", title: "Web Series (demo)", enabled: false, config: { itemLimit: 20, source: "type:series" } },
  ],
  providers: [
    { id: "p1", name: "Provider A (demo)", movieTemplate: "https://provider-a.example/embed/movie/{tmdbId}", tvTemplate: "https://provider-a.example/embed/tv/{tmdbId}/{season}/{episode}", enabled: true },
    { id: "p2", name: "Provider B (demo)", movieTemplate: "https://provider-b.example/m?id={tmdbId}", tvTemplate: "https://provider-b.example/tv?id={tmdbId}&s={season}&e={episode}", enabled: true },
    { id: "p3", name: "Provider C (demo)", movieTemplate: "https://provider-c.example/v/{tmdbId}", tvTemplate: "", enabled: false },
  ],
  admins: [
    { email: "owner@demo.invalid", role: "owner", addedAt: "2026-01-04" },
    { email: "editor@demo.invalid", role: "editor", addedAt: "2026-06-18" },
  ],
};
