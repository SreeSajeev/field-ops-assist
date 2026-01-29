import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type FETwitter = {
  id: string;
  ticket_number: string;
  status: string;
  location?: string | null;
  issue_type?: string | null;
  opened_at?: string | null;
};

export function useFEMyTickets() {
  const { session } = useAuth();
  const [tickets, setTickets] = useState<FETwitter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchTickets = async () => {
      setLoading(true);
      setError(null);

      try {
        /* --------------------------------------------------
           STEP 1: Fetch FE ID (BREAK SUPABASE GENERICS HERE)
        -------------------------------------------------- */
        const profileRes = await (supabase as any)
          .from("profiles")
          .select("fe_id")
          .eq("id", session.user.id)
          .single();

        if (profileRes.error) {
          throw profileRes.error;
        }

        const feId = profileRes.data?.fe_id as string | undefined;

        if (!feId) {
          throw new Error("FE profile not linked");
        }

        /* --------------------------------------------------
           STEP 2: Fetch tickets via ticket_assignments
        -------------------------------------------------- */
        const assignmentsRes = await (supabase as any)
          .from("ticket_assignments")
          .select(`
            ticket:ticket_id (
              id,
              ticket_number,
              status,
              location,
              issue_type,
              opened_at
            )
          `)
          .eq("fe_id", feId)
          .order("assigned_at", { ascending: false });

        if (assignmentsRes.error) {
          throw assignmentsRes.error;
        }

        const resolvedTickets: FETwitter[] =
          assignmentsRes.data
            ?.map((row: any) => row.ticket)
            .filter(Boolean) ?? [];

        setTickets(resolvedTickets);
      } catch (err: any) {
        console.error("FE ticket fetch failed:", err);
        setError(err.message || "Failed to load tickets");
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [session?.user?.id]);

  return {
    tickets,
    loading,
    error,
  };
}
