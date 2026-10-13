import { describe, expect, it } from "vitest";
import { buildUrl, move } from "@/services/store";

describe("provider URL preview", () => {
  it("fills tmdbId, season and episode", () => {
    expect(buildUrl("https://p.example/tv/{tmdbId}/{season}/{episode}", { tmdbId: "42", season: "2", episode: "5" }))
      .toBe("https://p.example/tv/42/2/5");
  });
});
describe("ordering", () => {
  it("moves an item down one slot", () => expect(move(["a", "b", "c"], 0, 1)).toEqual(["b", "a", "c"]));
  it("does not move past the end", () => expect(move(["a", "b"], 1, 1)).toEqual(["a", "b"]));
});
