import { beforeEach, describe, expect, it, vi } from "vitest";

const { invoke } = vi.hoisted(() => ({
  invoke: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke },
  },
}));

import { SocialIntelService } from "@/services/social-intel-service";

describe("SocialIntelService data modes", () => {
  beforeEach(() => {
    invoke.mockReset();
  });

  it("returns unavailable instead of fabricated data when live sources fail", async () => {
    invoke.mockRejectedValue(new Error("network unavailable"));

    const result = await new SocialIntelService(false).collectData(["Muğla"]);

    expect(result.mode).toBe("unavailable");
    expect(result.items).toEqual([]);
    expect(result.issues).toContain("Haber kaynağına ulaşılamadı");
    expect(result.issues).toContain("Sosyal medya kaynağına ulaşılamadı");
  });

  it("returns deterministic, clearly labeled samples only in demo mode", async () => {
    invoke.mockRejectedValue(new Error("network unavailable"));
    const service = new SocialIntelService(true);

    const first = await service.collectData(["Bodrum"], ["news"]);
    const second = await service.collectData(["Bodrum"], ["news"]);

    expect(first.mode).toBe("demo");
    expect(first.items).toEqual(second.items);
    expect(first.items.length).toBeGreaterThan(0);
    expect(first.items.every((item) => item.description?.startsWith("DEMO VERİSİ"))).toBe(true);
    expect(first.items.every((item) => item.source_url === undefined)).toBe(true);
  });

  it("prefers live data even when demo mode is enabled", async () => {
    invoke
      .mockResolvedValueOnce({
        data: {
          data: {
            items: [
              {
                title: "Muğla için canlı haber",
                source: "Canlı Kaynak",
                link: "https://news.example.test/mugla",
              },
            ],
          },
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: { data: { posts: [] } }, error: null });

    const result = await new SocialIntelService(true).collectData(["Muğla"], ["news"]);

    expect(result.mode).toBe("live");
    expect(result.items).toEqual([
      expect.objectContaining({
        content: "Muğla için canlı haber",
        source_author: "Canlı Kaynak",
        source_url: "https://news.example.test/mugla",
      }),
    ]);
  });
});
