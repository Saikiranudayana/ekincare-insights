import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SheetsPayload } from "@/lib/types";

export function useSheetsData() {
  return useQuery<SheetsPayload>({
    queryKey: ["sheets-data"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("sheets-data");
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as SheetsPayload;
    },
    refetchInterval: 30_000,   // poll every 30s to avoid Supabase rate limits
    staleTime: 25_000,
    retry: 3,                  // retry up to 3x on failure
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000), // exponential backoff
  });
}
