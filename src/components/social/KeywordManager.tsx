import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, X, Tag, Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Keyword {
  id: string;
  keyword: string;
  category: string;
  region: string | null;
  is_active: boolean;
  created_by: string;
}

interface KeywordManagerProps {
  onKeywordsChange?: (keywords: string[]) => void;
}

const categories = [
  { value: "general",     label: "Genel",    color: "border-cyan-500/40 text-cyan-400" },
  { value: "crisis",      label: "Kriz",     color: "border-red-500/40 text-red-400" },
  { value: "tourism",     label: "Turizm",   color: "border-green-500/40 text-green-400" },
  { value: "economy",     label: "Ekonomi",  color: "border-yellow-500/40 text-yellow-400" },
  { value: "environment", label: "Çevre",    color: "border-emerald-500/40 text-emerald-400" },
];

// Default keywords used as fallback if DB is empty or unreachable
const DEFAULT_KEYWORDS = [
  { keyword: "Muğla",    category: "general",     region: null },
  { keyword: "Bodrum",   category: "general",     region: "Bodrum" },
  { keyword: "Fethiye",  category: "general",     region: "Fethiye" },
  { keyword: "Marmaris", category: "general",     region: "Marmaris" },
  { keyword: "Datça",    category: "general",     region: "Datça" },
  { keyword: "Dalaman",  category: "general",     region: "Dalaman" },
  { keyword: "Milas",    category: "general",     region: "Milas" },
  { keyword: "yangın",   category: "crisis",      region: null },
  { keyword: "deprem",   category: "crisis",      region: null },
  { keyword: "turizm",   category: "tourism",     region: null },
  { keyword: "orman",    category: "environment", region: null },
  { keyword: "ekonomi",  category: "economy",     region: null },
];

export const KeywordManager = ({ onKeywordsChange }: KeywordManagerProps) => {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchKeywords();
  }, []);

  const seedDefaultKeywords = async () => {
    setSeeding(true);
    try {
      const inserts = DEFAULT_KEYWORDS.map(k => ({
        keyword: k.keyword,
        category: k.category,
        region: k.region,
        is_active: true,
        created_by: "system",
      }));

      const { error } = await supabase
        .from("social_keywords")
        .upsert(inserts, { onConflict: "keyword", ignoreDuplicates: false });

      if (error) {
        console.error("Seed error:", error);
        // DB seed failed — use in-memory fallback so data collection still works
        const fallback: Keyword[] = DEFAULT_KEYWORDS.map((k, i) => ({
          id: `fallback-${i}`,
          keyword: k.keyword,
          category: k.category,
          region: k.region,
          is_active: true,
          created_by: "system",
        }));
        setKeywords(fallback);
        onKeywordsChange?.(fallback.map(k => k.keyword));
      } else {
        await fetchKeywords();
        toast({ title: `${DEFAULT_KEYWORDS.length} varsayılan kelime yüklendi` });
      }
    } catch (e) {
      console.error("Seed exception:", e);
    } finally {
      setSeeding(false);
    }
  };

  const fetchKeywords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("social_keywords")
        .select("*")
        .order("category", { ascending: true })
        .order("keyword",  { ascending: true });

      if (error) {
        console.error("Keywords fetch error:", error);
        // Use in-memory defaults so the page still works
        const fallback: Keyword[] = DEFAULT_KEYWORDS.map((k, i) => ({
          id: `fallback-${i}`,
          keyword: k.keyword,
          category: k.category,
          region: k.region,
          is_active: true,
          created_by: "system",
        }));
        setKeywords(fallback);
        onKeywordsChange?.(fallback.map(k => k.keyword));
      } else if (!data || data.length === 0) {
        // Table is empty — seed defaults automatically
        await seedDefaultKeywords();
      } else {
        setKeywords(data);
        const activeKws = data.filter(k => k.is_active).map(k => k.keyword);
        onKeywordsChange?.(activeKws);
      }
    } finally {
      setLoading(false);
    }
  };

  const addKeyword = async () => {
    if (!newKeyword.trim()) return;
    setAdding(true);
    const { error } = await supabase.from("social_keywords").insert({
      keyword:    newKeyword.trim(),
      category:   newCategory,
      created_by: "user",
      is_active:  true,
    });
    if (error) {
      toast({ title: error.code === "23505" ? "Bu keyword zaten mevcut" : "Hata: " + error.message, variant: "destructive" });
    } else {
      toast({ title: `"${newKeyword.trim()}" eklendi` });
      setNewKeyword("");
      await fetchKeywords();
    }
    setAdding(false);
  };

  const toggleKeyword = async (id: string, currentState: boolean) => {
    if (id.startsWith("fallback-")) return; // in-memory, can't update
    await supabase.from("social_keywords").update({ is_active: !currentState }).eq("id", id);
    await fetchKeywords();
  };

  const deleteKeyword = async (id: string, keyword: string) => {
    if (id.startsWith("fallback-")) return;
    await supabase.from("social_keywords").delete().eq("id", id);
    toast({ title: `"${keyword}" silindi` });
    await fetchKeywords();
  };

  const activeCount = keywords.filter(k => k.is_active).length;

  if (loading || seeding) {
    return (
      <div className="flex items-center justify-center gap-2 py-4">
        <Loader2 size={14} className="animate-spin text-muted-foreground" />
        <span className="text-[10px] font-mono text-muted-foreground">
          {seeding ? "Varsayılan kelimeler yükleniyor..." : "Kelimeler yükleniyor..."}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Add keyword input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addKeyword()}
          placeholder="Yeni anahtar kelime..."
          className="flex-1 text-[11px] font-mono px-3 py-1.5 rounded-lg bg-muted/30 border border-border/50 focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground/40"
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="text-[10px] font-mono px-2 py-1.5 rounded-lg bg-muted/30 border border-border/50 text-foreground"
        >
          {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <button
          onClick={addKeyword}
          disabled={adding || !newKeyword.trim()}
          className="text-[10px] font-mono px-3 py-1.5 rounded-lg bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 disabled:opacity-40 flex items-center gap-1"
        >
          {adding ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
          Ekle
        </button>
      </div>

      {/* Stats + reset button */}
      <div className="flex items-center justify-between">
        <div className="text-[9px] font-mono text-muted-foreground">
          {activeCount} aktif / {keywords.length} toplam keyword
        </div>
        {keywords.length === 0 && (
          <button
            onClick={seedDefaultKeywords}
            disabled={seeding}
            className="text-[9px] font-mono text-primary hover:underline flex items-center gap-1"
          >
            <RefreshCw size={8} />
            Varsayılanları yükle
          </button>
        )}
      </div>

      {/* Keyword tags grouped by category */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {categories.map(cat => {
          const catKeywords = keywords.filter(k => k.category === cat.value);
          if (catKeywords.length === 0) return null;
          return (
            <div key={cat.value}>
              <span className="text-[8px] font-mono text-muted-foreground/60 uppercase">{cat.label}</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {catKeywords.map(kw => (
                  <div
                    key={kw.id}
                    className={`inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded border transition-all ${
                      kw.is_active ? cat.color : "border-border/20 text-muted-foreground/40 line-through"
                    }`}
                  >
                    <button onClick={() => toggleKeyword(kw.id, kw.is_active)} className="hover:opacity-70" title={kw.is_active ? "Devre dışı bırak" : "Aktif et"}>
                      {kw.keyword}
                    </button>
                    {kw.created_by === "user" && (
                      <button onClick={() => deleteKeyword(kw.id, kw.keyword)} className="hover:text-destructive ml-0.5">
                        <X size={8} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
