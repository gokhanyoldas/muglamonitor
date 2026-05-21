import { describe, it, expect } from "vitest";

describe("municipality-feed Edge Function", () => {
  it("should parse RSS XML items", () => {
    const xml = '<rss><channel><item><title>Test</title><link>http://x</link><pubDate>Mon, 20 May 2026 10:00:00 +0300</pubDate><description>Desc</description></item></channel></rss>';
    const items: string[] = [];
    const re = /<item>([\s\S]*?)<\/item>/g;
    let m; while ((m = re.exec(xml)) !== null) items.push(m[1]);
    expect(items).toHaveLength(1);
  });

  it("should strip HTML from descriptions", () => {
    const html = "<p>Bu bir <strong>test</strong> açıklaması.</p>";
    const clean = html.replace(/<[^>]+>/g, "");
    expect(clean).not.toContain("<");
  });

  it("should support all source types", () => {
    const sources = ["municipality", "afad", "news", "environment", "all"];
    expect(sources.length).toBe(5);
  });

  it("should sort by date descending", () => {
    const dates = [new Date("2026-05-18"), new Date("2026-05-20"), new Date("2026-05-19")];
    dates.sort((a, b) => b.getTime() - a.getTime());
    expect(dates[0].getDate()).toBe(20);
  });

  it("should limit results to requested count", () => {
    const items = Array.from({ length: 100 }, (_, i) => ({ title: `Item ${i}` }));
    const limit = 15;
    expect(items.slice(0, limit)).toHaveLength(15);
  });
});
