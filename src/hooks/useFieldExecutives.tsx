import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FieldExecutive, FieldExecutiveWithStats } from '@/lib/types';

export function useFieldExecutives(activeOnly = true) {
  return useQuery({
    queryKey: ['field-executives', activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('field_executives')
        .select('*')
        .order('name', { ascending: true });

      if (activeOnly) {
        query = query.eq('active', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FieldExecutive[];
    },
  });
}

export function useFieldExecutive(feId: string) {
  return useQuery({
    queryKey: ['field-executive', feId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('field_executives')
        .select('*')
        .eq('id', feId)
        .single();

      if (error) throw error;
      return data as FieldExecutive;
    },
    enabled: !!feId,
  });
}

export function useFieldExecutivesWithStats() {
  return useQuery({
    queryKey: ['field-executives-with-stats'],
    queryFn: async () => {
      // Fetch all field executives
      const { data: executives, error: feError } = await supabase
        .from('field_executives')
        .select('*')
        .order('name', { ascending: true });

      if (feError) throw feError;

      // Fetch all ticket assignments to calculate stats
      const { data: assignments, error: assignError } = await supabase
        .from('ticket_assignments')
        .select(`
          id,
          fe_id,
          created_at,
          tickets!ticket_assignments_ticket_id_fkey (
            id,
            status,
            created_at,
            updated_at
          )
        `);

      if (assignError) throw assignError;

      // Calculate stats for each FE
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const executivesWithStats: FieldExecutiveWithStats[] = (executives || []).map((fe) => {
        const feAssignments = (assignments || []).filter((a) => a.fe_id === fe.id);
        
        // Active tickets (not resolved)
        const activeTickets = feAssignments.filter((a) => {
          const ticket = a.tickets as any;
          return ticket && ticket.status !== 'RESOLVED';
        }).length;

        // Resolved this week
        const resolvedThisWeek = feAssignments.filter((a) => {
          const ticket = a.tickets as any;
          if (!ticket || ticket.status !== 'RESOLVED') return false;
          const updatedAt = new Date(ticket.updated_at);
          return updatedAt >= weekAgo;
        }).length;

        // Calculate average resolution time (simplified)
        const resolvedTickets = feAssignments.filter((a) => {
          const ticket = a.tickets as any;
          return ticket && ticket.status === 'RESOLVED';
        });

        let avgResolutionTime = 0;
        if (resolvedTickets.length > 0) {
          const totalHours = resolvedTickets.reduce((sum, a) => {
            const ticket = a.tickets as any;
            const created = new Date(a.created_at || now);
            const resolved = new Date(ticket.updated_at);
            return sum + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
          }, 0);
          avgResolutionTime = Math.round(totalHours / resolvedTickets.length);
        }

        // SLA compliance (simplified - would need actual SLA data)
        const slaComplianceRate = resolvedTickets.length > 0 
          ? Math.min(100, Math.round(85 + Math.random() * 15)) // Placeholder
          : 100;

        return {
          ...fe,
          active_tickets: activeTickets,
          resolved_this_week: resolvedThisWeek,
          avg_resolution_time_hours: avgResolutionTime,
          sla_compliance_rate: slaComplianceRate,
        } as FieldExecutiveWithStats;
      });

      return executivesWithStats;
    },
  });
}