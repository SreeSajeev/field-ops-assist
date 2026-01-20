import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Ticket, TicketFilters, TicketStatus } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

/* =========================
   Tickets list
========================= */
export function useTickets(filters?: TicketFilters) {
  return useQuery({
    queryKey: ["tickets", filters],
    queryFn: async () => {
      let query = supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters?.needsReview !== undefined) {
        query = query.eq("needs_review", filters.needsReview);
      }

      if (filters?.confidenceRange && filters.confidenceRange !== "all") {
        if (filters.confidenceRange === "high") {
          query = query.gte("confidence_score", 95);
        } else if (filters.confidenceRange === "medium") {
          query = query.gte("confidence_score", 80).lt("confidence_score", 95);
        } else {
          query = query.lt("confidence_score", 80);
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

      const { data, error } = await query;
      if (error) throw error;

      return data as Ticket[];
    },
  });
}

/* =========================
   Single ticket
========================= */
export function useTicket(ticketId: string) {
  return useQuery({
    queryKey: ["ticket", ticketId],
    enabled: !!ticketId,
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

/* =========================
   Ticket comments
========================= */
export function useTicketComments(ticketId: string) {
  return useQuery({
    queryKey: ["ticket-comments", ticketId],
    enabled: !!ticketId,
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

/* =========================
   Ticket assignments
========================= */
export function useTicketAssignments(ticketId: string) {
  return useQuery({
    queryKey: ["ticket-assignments", ticketId],
    enabled: !!ticketId,
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

/* =========================
   Update ticket (generic)
========================= */
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
        .update({ ...updates, updated_at: new Date().toISOString() })
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

/* =========================
   Update ticket status
========================= */
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
        .update({ status, updated_at: new Date().toISOString() })
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast({ title: "Status updated" });
    },
  });
}

/* =========================
   Assign ticket
========================= */
export function useAssignTicket() {
  const queryClient = useQueryClient();

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
      const { data: assignment, error } = await supabase
        .from("ticket_assignments")
        .insert({
          ticket_id: ticketId,
          fe_id: feId,
          override_reason: overrideReason ?? null,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from("tickets").update({
        status: "ASSIGNED",
        current_assignment_id: assignment.id,
        updated_at: new Date().toISOString(),
      }).eq("id", ticketId);

      await supabase.from("audit_logs").insert({
        entity_type: "ticket",
        entity_id: ticketId,
        action: "assigned",
        metadata: { fe_id: feId, assignment_id: assignment.id },
      });

      return assignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket-assignments"] });
      toast({ title: "Ticket assigned" });
    },
  });
}

/* =========================
   Add comment (FE + STAFF)
========================= */
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
