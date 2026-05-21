import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
const RESEND_URL = "https://api.resend.com/emails";

async function gatherContext(supabase: ReturnType<typeof createClient>): Promise<string> {
  const since = new Date(Date.now() - 86400000).toISOString();
  const parts: string[] = [];

  const { data: social } = await supabase.from("social_posts").select("content, platform, sentiment_score").gte("collected_at", since).order("collected_at", { ascending: false }).limit(15);
  if (social?.length) parts.push("SOSYAL MEDYA:\n" + social.map(s => `[${s.platform}] ${s.content?.slice(0, 80)}`).join("\n"));

  const { data: alerts } = await supabase.from("email_alerts").select("alert_type, title, severity").gte("created_at", since).order("created_at", { ascending: false }).limit(10);
  if (alerts?.length) parts.push("UYARILAR:\n" + alerts.map(a => `[${a.severity}] ${a.title}`).join("\n"));

  return parts.join("\n\n") || "Son 24 saatte kayda değer veri bulunamadı.";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!geminiKey) return new Response(JSON.stringify({ error: "GEMINI_API_KEY eksik" }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const context = await gatherContext(supabase);

    const prompt = `Sen Muğla ili bölgesel istihbarat asistanısın.
Günlük sabah brifingini HTML email formatında hazırla.
Bölümler: 📱 Sosyal Gündem, 📰 Öne Çıkanlar, ⚠️ Uyarılar
Her bölüm max 3 madde, toplam max 150 kelime.
Eğer veri yoksa "Bugün sakin bir gün" yaz.
Stil: inline CSS, mobil uyumlu, koyu tema (bg: #1a1a2e, text: #eee).

VERİ:
${context}`;

    const gemRes = await fetch(`${GEMINI_URL}?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4, maxOutputTokens: 1024 } }),
    });

    if (!gemRes.ok) throw new Error(`Gemini error: ${gemRes.status}`);
    const gemData = await gemRes.json();
    const htmlContent = gemData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "<p>Özet üretilemedi.</p>";

    // Send email via Resend (if configured)
    let emailSent = false;
    const recipientEmail = Deno.env.get("DAILY_BRIEF_EMAIL");
    if (resendKey && recipientEmail) {
      const emailRes = await fetch(RESEND_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Muğla Monitör <brief@muglamonitor.com>",
          to: [recipientEmail],
          subject: `🌅 Muğla'da Bugün — ${new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}`,
          html: htmlContent,
        }),
      });
      emailSent = emailRes.ok;
    }

    // Store in DB
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("ai_summaries").upsert({ type: "daily_brief", summary: htmlContent, generated_at: new Date().toISOString(), date: today }, { onConflict: "type,date" });

    return new Response(JSON.stringify({ success: true, email_sent: emailSent, generated_at: new Date().toISOString(), preview: htmlContent.slice(0, 200) }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
