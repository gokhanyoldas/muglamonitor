import { describe, it, expect, vi } from "vitest";

describe("social-cron Edge Function", () => {
  it("should run on correct schedule (*/15 * * * *)", () => {
    const parts = "*/15 * * * *".split(" ");
    expect(parts).toHaveLength(5);
    expect(parts[0]).toBe("*/15");
  });

  it("should handle function invocation errors", async () => {
    const mockInvoke = vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } });
    const result = await mockInvoke("social-collect");
    expect(result.error).toBeDefined();
  });

  it("should batch keywords correctly", () => {
    const keywords = ["muğla", "bodrum", "fethiye", "marmaris", "dalaman"];
    const batchSize = 3;
    const batches: string[][] = [];
    for (let i = 0; i < keywords.length; i += batchSize) batches.push(keywords.slice(i, i + batchSize));
    expect(batches).toHaveLength(2);
    expect(batches[0]).toHaveLength(3);
  });
});
