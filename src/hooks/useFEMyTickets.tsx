import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Ticket } from '@/lib/types';

export function useFEMyTickets() {
  const { userProfile } = useAuth();

  return useQuery({
    queryKey: ['fe-my-tickets', userProfile?.email],
    enabled: !!userProfile?.email,

    queryFn: async () => {
      // 🔴 HARD ESCAPE FROM SUPABASE TYPES
      const feRes = await (supabase as any)
        .from('field_executives')
        .select('id')
        .eq('email', userProfile!.email)
        .maybeSingle();

      if (feRes.error) {
        console.error('FE lookup failed', feRes.error);
        throw feRes.error;
      }

      if (!feRes.data) {
        console.warn('No FE record for', userProfile?.email);
        return [];
      }

      const feId = feRes.data.id;

      // Fetch assigned tickets
      const assignRes = await (supabase as any)
        .from('ticket_assignments')
        .select(
          `
          tickets (
            id,
            ticket_number,
            status,
            created_at,
            location,
            issue_type,
            category,
            vehicle_number
          )
        `
        )
        .eq('fe_id', feId);

      if (assignRes.error) {
        console.error('Assignment fetch failed', assignRes.error);
        throw assignRes.error;
      }

      const ACTIVE = [
        'ASSIGNED',
        'ON_SITE',
        'RESOLVED_PENDING_VERIFICATION',
      ];

      return (assignRes.data || [])
        .map((row: any) => row.tickets)
        .filter(
          (t: Ticket | null): t is Ticket =>
            !!t && ACTIVE.includes(t.status)
        )
        .sort(
          (a: Ticket, b: Ticket) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );
    },

    refetchInterval: 30000,
  });
}

/**
 * FE profile (demo-safe)
 */
export function useFEProfile() {
  const { userProfile } = useAuth();

  return useQuery({
    queryKey: ['fe-profile', userProfile?.email],
    enabled: !!userProfile?.email,

    queryFn: async () => {
      const res = await (supabase as any)
        .from('field_executives')
        .select('*')
        .eq('email', userProfile!.email)
        .maybeSingle();

      if (res.error) throw res.error;
      return res.data;
    },
  });
}