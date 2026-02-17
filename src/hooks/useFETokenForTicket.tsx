import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/* ======================================================
   Types
====================================================== */
export type FEActionToken = {
  id: string;  // THIS IS THE TOKEN
  ticket_id: string;
  fe_id: string;
  action_type: "ON_SITE" | "RESOLUTION";
  expires_at: string;
  used: boolean;
  created_at: string;
};


/* ======================================================
   useFETokenForTicket
   Fetch latest valid FE action token for a ticket
====================================================== */
export function useFETokenForTicket(ticketId: string) {
  return useQuery<FEActionToken | null>({
    queryKey: ["fe-token-for-ticket", ticketId],
    enabled: Boolean(ticketId),

    queryFn: async (): Promise<FEActionToken | null> => {
      if (!ticketId) return null;

      const { data, error } = await (supabase as any)
        .from("fe_action_tokens")
        .select("*")
        .eq("ticket_id", ticketId)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Treat "no token" as valid state, not error
      if (error) {
        console.error("FE token fetch failed:", error);
        return null;
      }

      return data ?? null;
    },
  });
}
