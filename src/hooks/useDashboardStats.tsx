import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardStats } from '@/lib/types';

export function useDashboardStats(clientSlug?: string | null) {
  return useQuery({
    queryKey: ['dashboard-stats', clientSlug ?? 'all'],
    queryFn: async (): Promise<DashboardStats> => {
      let ticketsQuery = supabase
        .from('tickets')
        .select('id, status, confidence_score, created_at');

      if (clientSlug != null && clientSlug !== '') {
        ticketsQuery = ticketsQuery.eq('client_slug', clientSlug);
      }

      const { data: tickets, error: ticketsError } = await ticketsQuery;

      if (ticketsError) throw ticketsError;

      let slaQuery = supabase
        .from('sla_tracking')
        .select('ticket_id, assignment_breached, onsite_breached, resolution_breached');

      if (clientSlug != null && clientSlug !== '' && tickets?.length) {
        const ticketIds = tickets.map((t: { id: string }) => t.id);
        slaQuery = slaQuery.in('ticket_id', ticketIds);
      }

      const { data: slaData, error: slaError } = await slaQuery;

      if (slaError) throw slaError;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const totalTickets = tickets?.length || 0;
      const openTickets = tickets?.filter(t => t.status === 'OPEN').length || 0;
      const needsReviewCount = tickets?.filter(t => t.status === 'NEEDS_REVIEW').length || 0;
      const assignedTickets = tickets?.filter(t => t.status === 'ASSIGNED').length || 0;
      
      const resolvedToday = tickets?.filter(t => {
        if (t.status !== 'RESOLVED') return false;
        const createdDate = new Date(t.created_at);
        return createdDate >= today;
      }).length || 0;

      const scoresWithValues = tickets?.filter(t => t.confidence_score !== null) || [];
      const avgConfidenceScore = scoresWithValues.length > 0
        ? scoresWithValues.reduce((sum, t) => sum + (t.confidence_score || 0), 0) / scoresWithValues.length
        : 0;

      const slaBreaches = slaData?.filter((s: { assignment_breached?: boolean; onsite_breached?: boolean; resolution_breached?: boolean }) =>
        s.assignment_breached || s.onsite_breached || s.resolution_breached
      ).length || 0;

      return {
        totalTickets,
        openTickets,
        needsReviewCount,
        assignedTickets,
        resolvedToday,
        avgConfidenceScore: Math.round(avgConfidenceScore * 10) / 10,
        slaBreaches,
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
