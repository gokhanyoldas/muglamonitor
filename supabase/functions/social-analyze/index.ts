import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { keywords, platform } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const keywordList = Array.isArray(keywords) ? keywords.join(", ") : keywords;
    const platformText = platform === "all" ? "tüm sosyal medya platformları" : platform;

    const systemPrompt = `Sen Muğla bölgesi için bir sosyal medya istihbarat analistisin. 
Kullanıcının takip ettiği anahtar kelimelerle ilgili ${platformText} üzerindeki güncel durumu analiz et.
Yanıtını MUTLAKA aşağıdaki JSON formatında ver, başka hiçbir metin ekleme:
{
  "analyses": [
    {
      "platform": "twitter|instagram|facebook|youtube",
      "content": "İçerik özeti (max 200 karakter)",
      "sentiment": "positive|negative|neutral",
      "sentiment_score": 0.0-1.0,
      "summary": "Kısa analiz notu",
      "source_author": "Kaynak adı",
      "engagement_count": 0
    }
  ],
  "trend_summary": {
    "mention_count": 0,
    "positive_ratio": 0.0-1.0,
    "negative_ratio": 0.0-1.0,
    "neutral_ratio": 0.0-1.0,
    "top_topics": ["konu1", "konu2", "konu3"],
    "overall_sentiment": "positive|negative|neutral",
    "key_insights": "Genel değerlendirme paragrafı"
  }
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Anahtar kelimeler: ${keywordList}\nPlatform: ${platformText}\nBölge: Muğla, Türkiye\nLütfen bu kelimelerle ilgili güncel sosyal medya istihbaratını analiz et.` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit aşıldı, lütfen biraz bekleyin." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Kredi yetersiz." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analiz hatası" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Parse hatası" };
    } catch {
      parsed = { raw: content, error: "JSON parse hatası" };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("social-analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
