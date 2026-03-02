import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DataType =
  | "weather" | "air_quality" | "dams" | "protocol" | "news"
  | "economy" | "real_estate" | "tourism" | "road_works" | "energy" | "all";

export function useLiveData<T = any>(type: DataType, options?: {
  refetchInterval?: number;
  enabled?: boolean;
}) {
  return useQuery<T | null>({
    queryKey: ["live-data", type],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("data-scrape", {
        body: { type },
      });
      if (error) {
        console.error(`Live data error (${type}):`, error);
        return null;
      }
      return data?.data ?? null;
    },
    refetchInterval: options?.refetchInterval ?? 10 * 60 * 1000, // 10 min default
    enabled: options?.enabled ?? true,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}
