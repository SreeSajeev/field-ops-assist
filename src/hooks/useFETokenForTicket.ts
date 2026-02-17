import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFETokenForTicket(ticketId: string) {
  return useQuery({
    queryKey: ["fe-token-for-ticket", ticketId],
    enabled: !!ticketId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("access_tokens")
        .select("*")
        .eq("ticket_id", ticketId)
        .eq("revoked", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}
