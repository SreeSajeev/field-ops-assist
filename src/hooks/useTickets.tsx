import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Ticket, TicketFilters, TicketStatus } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

/* =====================================================
   Tickets list (scoped by organisation_id for non–Super Admin)
===================================================== */
export function useTickets(filters?: TicketFilters) {
  const { userProfile } = useAuth();
  const organisationId = userProfile?.organisation_id ?? null;
  const isSuperAdmin = userProfile?.role === "SUPER_ADMIN";

  return useQuery({
    queryKey: ["tickets", filters, organisationId, isSuperAdmin, filters?.scopeAllOrganisations, filters?.organisationId],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (!isSuperAdmin && organisationId && !filters?.scopeAllOrganisations) {
        query = query.eq("organisation_id", organisationId);
      }
      if (isSuperAdmin && filters?.organisationId != null && filters.organisationId !== "") {
        query = query.eq("organisation_id", filters.organisationId);
      }
      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters?.confidenceRange && filters.confidenceRange !== "all") {
        switch (filters.confidenceRange) {
          case "high":
            query = query.gte("confidence_score", 95);
            break;
          case "medium":
            query = query.gte("confidence_score", 80).lt("confidence_score", 95);
            break;
          case "low":
            query = query.lt("confidence_score", 80);
            break;
        }
      }
      if (filters?.search) {
        query = query.or(
          `ticket_number.ilike.%${filters.search}%,complaint_id.ilike.%${filters.search}%,vehicle_number.ilike.%${filters.search}%`
        );
      }
      if (filters?.unassignedOnly) {
        query = query.is("current_assignment_id", null);
      }
      if (filters?.clientSlug != null && filters.clientSlug !== "") {
        query = query.eq("client_slug", filters.clientSlug);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data as Ticket[];
    },
  });
}

/* =====================================================
   Single ticket
===================================================== */
export function useTicket(ticketId: string) {
  return useQuery({
    queryKey: ["ticket", ticketId],
    enabled: Boolean(ticketId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("id", ticketId)
        .single();

      if (error) throw error;
      return data as Ticket;
    },
  });
}

/* =====================================================
   Ticket comments
===================================================== */
export function useTicketComments(ticketId: string) {
  return useQuery({
    queryKey: ["ticket-comments", ticketId],
    enabled: Boolean(ticketId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_comments")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

/* =====================================================
   Ticket assignments
===================================================== */
export function useTicketAssignments(ticketId: string) {
  return useQuery({
    queryKey: ["ticket-assignments", ticketId],
    enabled: Boolean(ticketId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_assignments")
        .select("*, field_executives (*)")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

/* =====================================================
   Update ticket (generic)
===================================================== */
export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      updates,
    }: {
      ticketId: string;
      updates: Partial<Ticket>;
    }) => {
      const { data, error } = await supabase
        .from("tickets")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ticketId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket", data.id] });
      toast({ title: "Ticket updated" });
    },
  });
}

/* =====================================================
   Update ticket status
===================================================== */
export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      status,
    }: {
      ticketId: string;
      status: TicketStatus;
    }) => {
      const { data, error } = await supabase
        .from("tickets")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ticketId)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        entity_type: "ticket",
        entity_id: ticketId,
        action: `status_changed_to_${status}`,
        metadata: { new_status: status },
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket", data.id] });
      toast({ title: "Status updated" });
    },
  });
}

/* =====================================================
   Assign ticket (via backend: creates assignment, ON_SITE token, emails, SLA)
===================================================== */
export function useAssignTicket() {
  const queryClient = useQueryClient();
  const apiBase = import.meta.env.VITE_CRM_API_URL ?? "http://localhost:3000";

  return useMutation({
    mutationFn: async ({
      ticketId,
      feId,
      overrideReason,
    }: {
      ticketId: string;
      feId: string;
      overrideReason?: string;
    }) => {
      let res: Response;
      try {
        res = await fetch(`${apiBase}/tickets/${ticketId}/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            feId,
            override_reason:
              overrideReason != null && String(overrideReason).trim() !== ""
                ? String(overrideReason).trim()
                : undefined,
          }),
        });
      } catch (err) {
        const isNetwork = err instanceof TypeError && (err.message === "Failed to fetch" || err.message?.includes("fetch"));
        throw new Error(
          isNetwork
            ? "Cannot reach backend. If this app is deployed, set VITE_CRM_API_URL to your backend URL and ensure the backend is running."
            : err instanceof Error ? err.message : "Assignment request failed"
        );
      }
      let data: { error?: string } = {};
      try {
        data = await res.json();
      } catch {
        // Non-JSON response (e.g. 502 HTML)
      }
      if (!res.ok) {
        const message = data?.error ?? (res.status === 404 ? "Ticket not found" : res.status === 502 || res.status === 504 ? "Backend unreachable. Check VITE_CRM_API_URL." : "Assignment failed");
        throw new Error(message);
      }
      return data;
    },
    onSuccess: (_data, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["ticket-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["fe-active-tokens"] });
      toast({ title: "Ticket assigned" });
    },
  });
}

/* =====================================================
   Add comment (FE + STAFF)
===================================================== */
export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      body,
      source = "STAFF",
      attachments = null,
    }: {
      ticketId: string;
      body: string;
      source?: "EMAIL" | "FE" | "STAFF" | "SYSTEM";
      attachments?: any[] | null;
    }) => {
      const { data, error } = await supabase
        .from("ticket_comments")
        .insert({
          ticket_id: ticketId,
          body,
          source,
          attachments,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["ticket-comments", vars.ticketId],
      });
      toast({ title: "Comment added" });
    },
  });
}
