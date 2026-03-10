import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardStats } from '@/lib/types';
import { getStartOfDayIST, todayIST } from '@/lib/dateUtils';
import { useAuth } from '@/hooks/useAuth';

export function useDashboardStats(clientSlug?: string | null, organisationIdOverride?: string | null) {
  const { userProfile } = useAuth();
  const organisationId = userProfile?.organisation_id ?? null;
  const isSuperAdmin = userProfile?.role === 'SUPER_ADMIN';

  return useQuery({
    queryKey: ['dashboard-stats', clientSlug ?? 'all', organisationId, isSuperAdmin, organisationIdOverride],
    queryFn: async (): Promise<DashboardStats> => {
      let ticketsQuery = supabase
        .from('tickets')
        .select('id, status, confidence_score, created_at');

      if (!isSuperAdmin && organisationId) {
        ticketsQuery = ticketsQuery.eq('organisation_id', organisationId);
      }
      if (isSuperAdmin && organisationIdOverride != null && organisationIdOverride !== '') {
        ticketsQuery = ticketsQuery.eq('organisation_id', organisationIdOverride);
      }
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

      const startOfTodayIST = getStartOfDayIST(todayIST());

      const totalTickets = tickets?.length || 0;
      const openTickets = tickets?.filter(t => t.status === 'OPEN').length || 0;
      const needsReviewCount = tickets?.filter(t => t.status === 'NEEDS_REVIEW').length || 0;
      const assignedTickets = tickets?.filter(t => t.status === 'ASSIGNED').length || 0;
      const inProgressTickets = tickets?.filter(t =>
        ['EN_ROUTE', 'ON_SITE', 'RESOLVED_PENDING_VERIFICATION'].includes(t.status)
      ).length || 0;
      const resolvedTickets = tickets?.filter(t => t.status === 'RESOLVED').length || 0;

      const resolvedToday = tickets?.filter(t => {
        if (t.status !== 'RESOLVED') return false;
        const createdDate = new Date(t.created_at);
        return createdDate >= startOfTodayIST;
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
        inProgressTickets,
        resolvedTickets,
        resolvedToday,
        avgConfidenceScore: Math.round(avgConfidenceScore * 10) / 10,
        slaBreaches,
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
