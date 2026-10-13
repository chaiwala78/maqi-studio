import { describe, expect, it } from "vitest";
import { REMOTE_CONFIG_DEFAULTS, validateRemoteConfig } from "@/services/remote-config";

describe("remote config", () => {
  it("keeps the Firebase key names", () => {
    expect(Object.keys(REMOTE_CONFIG_DEFAULTS).sort()).toEqual([
      "announcement_enabled", "announcement_id", "announcement_message", "announcement_title",
      "force_update", "maintenance_message", "maintenance_mode", "minimum_app_version", "update_url",
    ]);
  });
  it("rejects a bad version", () => {
    expect(validateRemoteConfig({ ...REMOTE_CONFIG_DEFAULTS, minimum_app_version: "abc" }).minimum_app_version).toBeTruthy();
  });
  it("rejects non-https update url", () => {
    expect(validateRemoteConfig({ ...REMOTE_CONFIG_DEFAULTS, update_url: "http://x.com" }).update_url).toBeTruthy();
  });
});
