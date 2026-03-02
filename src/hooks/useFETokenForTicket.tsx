import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/* ======================================================
   Types
====================================================== */
export type FEActionToken = {
  id: string; // THIS IS THE TOKEN
  ticket_id: string;
  fe_id: string;
  action_type: "ON_SITE" | "RESOLUTION";
  expires_at: string;
  used: boolean;
  created_at: string;
};

/* ======================================================
   useFETokenForTicket
   Fetch latest VALID FE action token for a ticket
====================================================== */
export function useFETokenForTicket(ticketId: string) {
  return useQuery<FEActionToken | null>({
    queryKey: ["fe-token-for-ticket", ticketId],
    enabled: Boolean(ticketId),
    retry: false,
    refetchOnWindowFocus: false,

    queryFn: async () => {
      if (!ticketId) return null;

      try {
        const { data, error } = await (supabase as any)
          .from("fe_action_tokens")
          .select("*")
          .eq("ticket_id", ticketId)
          .eq("used", false)
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .maybeSingle();

        if (error) {
          console.error("FE token fetch failed:", error);
          return null;
        }

        if (!data) return null;

        return data as FEActionToken;
      } catch (err) {
        console.error("FE token unexpected failure:", err);
        return null;
      }
    },
  });
}
