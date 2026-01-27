/**
 * useFEMyTickets - Hook for Field Executive to fetch their assigned tickets
 * 
 * This hook:
 * 1. Finds the field_executive record matching the logged-in user
 * 2. Fetches tickets assigned to that FE via ticket_assignments
 * 3. Filters to show only active tickets (ASSIGNED, ON_SITE, RESOLVED_PENDING_VERIFICATION)
 * 
 * Security: The FE only sees tickets explicitly assigned to them through the
 * ticket_assignments table. No unassigned or other FEs' tickets are visible.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Ticket } from '@/lib/types';
import { useAuth } from './useAuth';

export function useFEMyTickets() {
  const { userProfile } = useAuth();

  return useQuery({
    queryKey: ['fe-my-tickets', userProfile?.name],
    enabled: !!userProfile?.name,
    queryFn: async () => {
      // Step 1: Find the field_executive record for this user by name
      // This matches the pattern established during FE account creation
      const { data: feRecord, error: feError } = await supabase
        .from('field_executives')
        .select('id, name, base_location, skills')
        .eq('name', userProfile?.name || '')
        .maybeSingle();

      if (feError) {
        console.error('Error finding FE record:', feError);
        throw feError;
      }

      // If no FE record exists for this user, return empty array
      if (!feRecord) {
        console.warn('No field_executive record found for user:', userProfile?.name);
        return [];
      }

      // Step 2: Fetch all ticket assignments for this FE
      const { data: assignments, error: assignError } = await supabase
        .from('ticket_assignments')
        .select(`
          id,
          fe_id,
          ticket_id,
          assigned_at,
          created_at,
          tickets!ticket_assignments_ticket_id_fkey (*)
        `)
        .eq('fe_id', feRecord.id);

      if (assignError) {
        console.error('Error fetching assignments:', assignError);
        throw assignError;
      }

      // Step 3: Filter to only active tickets and extract ticket data
      // Active means: ASSIGNED, ON_SITE, or RESOLVED_PENDING_VERIFICATION
      const activeStatuses = ['ASSIGNED', 'ON_SITE', 'RESOLVED_PENDING_VERIFICATION'];
      
      const assignedTickets = (assignments || [])
        .map(a => a.tickets)
        .filter((ticket): ticket is Ticket => {
          if (!ticket) return false;
          const t = ticket as Ticket;
          return activeStatuses.includes(t.status);
        })
        .sort((a, b) => {
          // Sort by creation date, newest first
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

      return assignedTickets;
    },
    // Refetch every 30 seconds to catch new assignments
    refetchInterval: 30000,
  });
}

/**
 * useFEProfile - Get the field_executive record for the logged-in FE user
 */
export function useFEProfile() {
  const { userProfile } = useAuth();

  return useQuery({
    queryKey: ['fe-profile', userProfile?.name],
    enabled: !!userProfile?.name,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('field_executives')
        .select('*')
        .eq('name', userProfile?.name || '')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

/**
 * useFETicketHistory - Get all tickets (including resolved) for the logged-in FE
 */
export function useFETicketHistory() {
  const { userProfile } = useAuth();

  return useQuery({
    queryKey: ['fe-ticket-history', userProfile?.name],
    enabled: !!userProfile?.name,
    queryFn: async () => {
      // Find FE record
      const { data: feRecord, error: feError } = await supabase
        .from('field_executives')
        .select('id')
        .eq('name', userProfile?.name || '')
        .maybeSingle();

      if (feError || !feRecord) return [];

      // Fetch all assignments including resolved tickets
      const { data: assignments, error: assignError } = await supabase
        .from('ticket_assignments')
        .select(`
          id,
          fe_id,
          ticket_id,
          assigned_at,
          created_at,
          tickets!ticket_assignments_ticket_id_fkey (*)
        `)
        .eq('fe_id', feRecord.id)
        .order('created_at', { ascending: false });

      if (assignError) throw assignError;

      return (assignments || [])
        .map(a => ({
          assignment: {
            id: a.id,
            assigned_at: a.assigned_at,
            created_at: a.created_at,
          },
          ticket: a.tickets as Ticket,
        }))
        .filter(item => item.ticket !== null);
    },
  });
}
