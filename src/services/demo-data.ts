import type { AdminData } from "./types";

/**
 * Production Empty Initial State.
 * All fake/mock data has been completely removed.
 */
export const EMPTY_ADMIN_DATA: AdminData = {
  catalog: [],
  curated: [],
  banners: [],
  sections: [],
  providers: [],
  admins: [
    { email: "jojo219884@gmail.com", role: "owner", addedAt: new Date().toISOString().slice(0, 10) },
    { email: "aabito986f@gmail.com", role: "admin", addedAt: new Date().toISOString().slice(0, 10) },
  ],
};

export const DEMO_DATA: AdminData = EMPTY_ADMIN_DATA;
