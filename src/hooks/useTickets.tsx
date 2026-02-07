/*
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Ticket, TicketFilters, TicketStatus } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { 
  TicketUpdateSchema, 
  CommentSchema, 
  AssignmentSchema, 
  UUIDSchema,
  formatZodError 
} from "@/lib/validation";
import { z } from "zod";


import { generateFEActionToken } from "@/lib/feToken";

//ticket list with filters
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

      const { data, error } = await query;
      if (error) throw error;

      return data as Ticket[];
    },
  });
}

//single ticket details
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

//ticket details with enhanced error handling and validation
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

//ticket assignments
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

//update ticket details
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
      const validatedId = UUIDSchema.parse(ticketId);
      const validatedUpdates = TicketUpdateSchema.parse(updates);
      
      const { data, error } = await supabase
        .from("tickets")
        .update({
          ...validatedUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", validatedId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket", data.id] });
      queryClient.invalidateQueries({ queryKey: ["ticket-comments", data.id] });

      toast({ title: "Status updated" });
    },

    onError: (error) => {
      if (error instanceof z.ZodError) {
        toast({ title: "Validation Error", description: formatZodError(error), variant: "destructive" });
      }
    },
  });
}

//update ticket status
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
      const validatedId = UUIDSchema.parse(ticketId);
      const validatedStatus = z.enum([
        'OPEN', 'NEEDS_REVIEW', 'ASSIGNED', 'EN_ROUTE', 'ON_SITE', 
        'RESOLVED_PENDING_VERIFICATION', 'RESOLVED', 'REOPENED'
      ]).parse(status);
      
      const { data, error } = await supabase
        .from("tickets")
        .update({
          status: validatedStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", validatedId)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        entity_type: "ticket",
        entity_id: validatedId,
        action: `status_changed_to_${validatedStatus}`,
        metadata: { new_status: validatedStatus },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast({ title: "Status updated" });
    },
    onError: (error) => {
      if (error instanceof z.ZodError) {
        toast({ title: "Validation Error", description: formatZodError(error), variant: "destructive" });
      }
    },
  });
}

//assign ticket to FE
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
      const validated = AssignmentSchema.parse({ 
        ticketId, 
        feId, 
        overrideReason: overrideReason?.trim() || null 
      });
      
      const { data: assignment, error } = await supabase
        .from("ticket_assignments")
        .insert({
          ticket_id: validated.ticketId,
          fe_id: validated.feId,
          override_reason: validated.overrideReason ?? null,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from("tickets")
        .update({
          status: "ASSIGNED",
          current_assignment_id: assignment.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", validated.ticketId);

      await supabase.from("audit_logs").insert({
        entity_type: "ticket",
        entity_id: validated.ticketId,
        action: "assigned",
        metadata: {
          fe_id: validated.feId,
          assignment_id: assignment.id,
        },
      });

      //generate FE action token for ON_SITE action
      await generateFEActionToken({
        ticketId: validated.ticketId,
        feId: validated.feId,
        actionType: "ON_SITE",
      });
    

      return assignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket-assignments"] });
      toast({ title: "Ticket assigned" });
    },
    onError: (error) => {
      if (error instanceof z.ZodError) {
        toast({ title: "Validation Error", description: formatZodError(error), variant: "destructive" });
      }
    },
  });
}

//add comment to ticket
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
      const validated = CommentSchema.parse({ 
        ticketId, 
        body: body.trim(), 
        source, 
        attachments 
      });
      
      const { data, error } = await supabase
        .from("ticket_comments")
        .insert({
          ticket_id: validated.ticketId,
          body: validated.body,
          source: validated.source,
          attachments: validated.attachments,
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
    onError: (error) => {
      if (error instanceof z.ZodError) {
        toast({ title: "Validation Error", description: formatZodError(error), variant: "destructive" });
      }
    },
  });
}

*/
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Ticket, TicketFilters, TicketStatus } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { 
  TicketUpdateSchema, 
  CommentSchema, 
  AssignmentSchema, 
  UUIDSchema,
  formatZodError 
} from "@/lib/validation";
import { z } from "zod";

/* =====================================================
   Tickets list
===================================================== */
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
      const validatedId = UUIDSchema.parse(ticketId);
      const validatedUpdates = TicketUpdateSchema.parse(updates);
      
      const { data, error } = await supabase
        .from("tickets")
        .update({
          ...validatedUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", validatedId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket", data.id] });
      queryClient.invalidateQueries({ queryKey: ["ticket-comments", data.id] });

      toast({ title: "Status updated" });
    },

    onError: (error) => {
      if (error instanceof z.ZodError) {
        toast({ 
          title: "Validation Error", 
          description: formatZodError(error), 
          variant: "destructive" 
        });
      }
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
      const validatedId = UUIDSchema.parse(ticketId);
      const validatedStatus = z.enum([
        'OPEN', 'NEEDS_REVIEW', 'ASSIGNED', 'EN_ROUTE', 'ON_SITE', 
        'RESOLVED_PENDING_VERIFICATION', 'RESOLVED', 'REOPENED'
      ]).parse(status);
      
      const { data, error } = await supabase
        .from("tickets")
        .update({
          status: validatedStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", validatedId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast({ title: "Status updated" });
    },
    onError: (error) => {
      if (error instanceof z.ZodError) {
        toast({ 
          title: "Validation Error", 
          description: formatZodError(error), 
          variant: "destructive" 
        });
      }
    },
  });
}

/* =====================================================
   Assign ticket (BACKEND-DRIVEN)
===================================================== */
export function useAssignTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketId,
      feId,
    }: {
      ticketId: string;
      feId: string;
    }) => {
      const validated = AssignmentSchema.parse({ ticketId, feId });

      const res = await fetch(
        `${import.meta.env.VITE_CRM_API_URL}/tickets/${validated.ticketId}/assign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feId: validated.feId }),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket-assignments"] });
      toast({ title: "Ticket assigned & on-site link sent to FE" });
    },
    onError: (error: any) => {
      toast({
        title: "Assignment failed",
        description: error?.message,
        variant: "destructive",
      });
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
      const validated = CommentSchema.parse({ 
        ticketId, 
        body: body.trim(), 
        source, 
        attachments 
      });
      
      const { data, error } = await supabase
        .from("ticket_comments")
        .insert({
          ticket_id: validated.ticketId,
          body: validated.body,
          source: validated.source,
          attachments: validated.attachments,
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
    onError: (error) => {
      if (error instanceof z.ZodError) {
        toast({ 
          title: "Validation Error", 
          description: formatZodError(error), 
          variant: "destructive" 
        });
      }
    },
  });
}
