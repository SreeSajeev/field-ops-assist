import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/* ======================================================
   Types
====================================================== */
type FETwitter = {
  id: string;
  ticket_number: string;
  status: string;
  location?: string | null;
  issue_type?: string | null;
  opened_at?: string | null;
};

/* ======================================================
   useFEMyTickets
====================================================== */
export function useFEMyTickets() {
  const { user } = useAuth();

  const [tickets, setTickets] = useState<FETwitter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        /* 1️⃣ Resolve FE via email (BREAK TS INFERENCE INTENTIONALLY) */
        const { data: fe, error: feError } = await (supabase as any)
          .from("field_executives")
          .select("id")
          .eq("email", user.email)
          .single();

        if (feError || !fe?.id) {
          throw new Error("Field Executive not linked to auth user");
        }

        /* 2️⃣ Fetch assigned tickets */
        const { data, error } = await (supabase as any)
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
          .eq("fe_id", fe.id)
          .order("assigned_at", { ascending: false });

        if (error) throw error;

        setTickets(
          data?.map((row: any) => row.ticket).filter(Boolean) ?? []
        );
      } catch (err: any) {
        console.error("FE ticket fetch failed:", err);
        setError(err.message || "Failed to load tickets");
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.email]);

  return { tickets, loading, error };
}
