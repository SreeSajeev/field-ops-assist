import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FieldExecutive } from '@/lib/types';

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
