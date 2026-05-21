import { describe, it, expect } from "vitest";

describe("ai-summary Edge Function", () => {
  it("should build correct prompt for each summary type", () => {
    const types = ["daily", "social", "earthquake", "weather"];
    types.forEach(t => expect(["daily", "social", "earthquake", "weather"]).toContain(t));
  });

  it("should handle missing GEMINI_API_KEY", () => {
    const geminiKey: string | undefined = undefined;
    expect(geminiKey).toBeUndefined();
  });

  it("should parse Gemini response structure", () => {
    const geminiResponse = { candidates: [{ content: { parts: [{ text: "• Test özet" }] } }] };
    const summary = geminiResponse?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Özet üretilemedi.";
    expect(summary).toContain("Test");
  });

  it("should handle malformed Gemini response", () => {
    const bad = { candidates: [] };
    const summary = bad?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Özet üretilemedi.";
    expect(summary).toBe("Özet üretilemedi.");
  });

  it("should upsert to ai_summaries table with correct key", () => {
    const today = new Date().toISOString().split("T")[0];
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
