import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardStats } from '@/lib/types';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Get all tickets
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('status, confidence_score, created_at');

      if (ticketsError) throw ticketsError;

      // Get SLA breaches
      const { data: slaData, error: slaError } = await supabase
        .from('sla_tracking')
        .select('assignment_breached, onsite_breached, resolution_breached');

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

      const slaBreaches = slaData?.filter(s => 
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
