export type ContentType = "anime" | "movie" | "series";
export type Visibility = "visible" | "hidden";

export interface CatalogItem {
  id: string;
  tmdbId: string;
  title: string;
  type: ContentType;
  visibility: Visibility;
  year?: string;
  overview?: string;
  imageKey?: string;
}

export interface CuratedList {
  id: string;
  name: string;
  description: string;
  badge?: string;
  bannerImage?: string;
  themeColor?: string;
  enabled?: boolean;
  tmdbIds: string[];
}

export interface HeroBanner {
  id: string;
  tmdbId: string;
  title: string;
  type: ContentType;
  tagline: string;
  enabled: boolean;
  imageKey?: string;
}

export interface HomeSection {
  id: string;
  /** Key used by the app — read-only in the panel. */
  key: string;
  /** Title as shown in the app — never renamed automatically. */
  title: string;
  enabled: boolean;
  config: { itemLimit: number; source: string };
}

export interface StreamingProvider {
  id: string;
  name: string;
  movieTemplate: string;
  tvTemplate: string;
  enabled: boolean;
}

export interface AdminUser {
  email: string;
  role: "owner" | "editor";
  addedAt: string;
}

export interface AdminData {
  catalog: CatalogItem[];
  curated: CuratedList[];
  banners: HeroBanner[];
  sections: HomeSection[];
  providers: StreamingProvider[];
  admins: AdminUser[];
}

export type DataKey = keyof AdminData;

export interface LogEntry {
  id: string;
  at: string;
  action: string;
  target: string;
}

export type PublishResult =
  | { status: "demo" }
  | { status: "confirmed"; at: string }
  | { status: "error"; message: string };
