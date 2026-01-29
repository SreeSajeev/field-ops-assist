import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFETokenForTicket(ticketId: string) {
  return useQuery({
    queryKey: ["fe-token-for-ticket", ticketId || "none"],
    enabled: !!ticketId,

    queryFn: async () => {
      if (!ticketId) {
        return null;
      }

      const { data, error } = await (supabase as any)
        .from("fe_action_tokens")
        .select("*")
        .eq("ticket_id", ticketId)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data ?? null;
    },
  });
}
