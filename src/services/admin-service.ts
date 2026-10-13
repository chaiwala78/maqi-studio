import { DEMO_DATA } from "./demo-data";
import type { AdminData, PublishResult } from "./types";

/**
 * Backend boundary. The UI only talks to this interface.
 * A future `WorkerAdminService` will call a protected server-side API
 * (never Cloudflare directly from the browser, never with tokens in frontend code).
 */
export interface AdminService {
  mode: "demo" | "live";
  load(): Promise<AdminData>;
  publish(data: AdminData): Promise<PublishResult>;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const demoAdminService: AdminService = {
  mode: "demo",
  async load() {
    await wait(250);
    return structuredClone(DEMO_DATA);
  },
  async publish() {
    await wait(500);
    // Nothing is sent anywhere. Never report this as a confirmed publish.
    return { status: "demo" };
  },
};

export const adminService: AdminService = demoAdminService;
