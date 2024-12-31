import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const usePerformanceHistory = () => {
  return useQuery({
    queryKey: ["performance-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("performance_reports")
        .select(`
          *,
          practice_sessions (
            practice_type,
            job_type,
            industry
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as (Tables<"performance_reports"> & {
        practice_sessions: Tables<"practice_sessions">;
      })[];
    },
  });
};