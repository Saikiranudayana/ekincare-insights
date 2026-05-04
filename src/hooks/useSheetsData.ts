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
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
}
