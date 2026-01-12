import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Ticket, TicketFilters, TicketStatus } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

export function useTickets(filters?: TicketFilters) {
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: async () => {
      let query = supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.needsReview !== undefined) {
        query = query.eq('needs_review', filters.needsReview);
      }

      if (filters?.confidenceRange && filters.confidenceRange !== 'all') {
        if (filters.confidenceRange === 'high') {
          query = query.gte('confidence_score', 95);
        } else if (filters.confidenceRange === 'medium') {
          query = query.gte('confidence_score', 80).lt('confidence_score', 95);
        } else if (filters.confidenceRange === 'low') {
          query = query.lt('confidence_score', 80);
        }
      }

      if (filters?.search) {
        query = query.or(`ticket_number.ilike.%${filters.search}%,complaint_id.ilike.%${filters.search}%,vehicle_number.ilike.%${filters.search}%`);
      }

      // Filter for unassigned tickets only (Review Queue requirement)
      if (filters?.unassignedOnly) {
        query = query.is('current_assignment_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Ticket[];
    },
  });
}

export function useTicket(ticketId: string) {
  return useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (error) throw error;
      return data as Ticket;
    },
    enabled: !!ticketId,
  });
}

export function useTicketComments(ticketId: string) {
  return useQuery({
    queryKey: ['ticket-comments', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_comments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!ticketId,
  });
}

export function useTicketAssignments(ticketId: string) {
  return useQuery({
    queryKey: ['ticket-assignments', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_assignments')
        .select(`
          *,
          field_executives (*)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!ticketId,
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, updates }: { ticketId: string; updates: Partial<Ticket> }) => {
      const { data, error } = await supabase
        .from('tickets')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket', data.id] });
      toast({
        title: 'Ticket updated',
        description: 'The ticket has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update ticket. Please try again.',
        variant: 'destructive',
      });
      console.error('Update ticket error:', error);
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: TicketStatus }) => {
      const { data, error } = await supabase
        .from('tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;

      // Add audit log
      await supabase.from('audit_logs').insert({
        entity_type: 'ticket',
        entity_id: ticketId,
        action: `status_changed_to_${status}`,
        metadata: { new_status: status }
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast({
        title: 'Status updated',
        description: 'The ticket status has been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update status. Please try again.',
        variant: 'destructive',
      });
      console.error('Update status error:', error);
    },
  });
}

export function useAssignTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      ticketId, 
      feId, 
      overrideReason 
    }: { 
      ticketId: string; 
      feId: string; 
      overrideReason?: string 
    }) => {
      // Create assignment
      const { data: assignment, error: assignmentError } = await supabase
        .from('ticket_assignments')
        .insert({
          ticket_id: ticketId,
          fe_id: feId,
          override_reason: overrideReason || null,
        })
        .select()
        .single();

      if (assignmentError) throw assignmentError;

      // Update ticket status and current assignment
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({ 
          status: 'ASSIGNED' as TicketStatus,
          current_assignment_id: assignment.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (ticketError) throw ticketError;

      // Add audit log
      await supabase.from('audit_logs').insert({
        entity_type: 'ticket',
        entity_id: ticketId,
        action: 'assigned',
        metadata: { fe_id: feId, assignment_id: assignment.id, override_reason: overrideReason }
      });

      return assignment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-assignments'] });
      toast({
        title: 'Ticket assigned',
        description: 'The ticket has been assigned to the field executive.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to assign ticket. Please try again.',
        variant: 'destructive',
      });
      console.error('Assign ticket error:', error);
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      ticketId, 
      body, 
      source = 'STAFF' 
    }: { 
      ticketId: string; 
      body: string; 
      source?: 'EMAIL' | 'FE' | 'STAFF' | 'SYSTEM' 
    }) => {
      const { data, error } = await supabase
        .from('ticket_comments')
        .insert({
          ticket_id: ticketId,
          body,
          source,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-comments', variables.ticketId] });
      toast({
        title: 'Comment added',
        description: 'Your comment has been added to the ticket.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add comment. Please try again.',
        variant: 'destructive',
      });
      console.error('Add comment error:', error);
    },
  });
}
