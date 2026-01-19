import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FieldExecutive, User as DBUser } from '@/lib/types';
import { useAuth } from './useAuth';

/**
 * Hook to fetch the Field Executive profile for the currently logged-in FE user.
 * Returns null if the user is not a FIELD_EXECUTIVE role.
 * 
 * Usage:
 * const { data: feProfile, isLoading, error } = useCurrentFEProfile();
 * 
 * The FE profile is fetched by:
 * 1. Getting the current user's ID from the users table (via auth_id)
 * 2. Looking up the corresponding field_executives record by name/ID matching
 * 
 * Note: Requires a FK or matching mechanism in your database.
 * Currently assumes field_executives and users are linked by a reference in the users table.
 */
export function useCurrentFEProfile() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ['current-fe-profile', user?.id],
    queryFn: async (): Promise<FieldExecutive | null> => {
      // Only fetch if user is a Field Executive
      if (role !== 'FIELD_EXECUTIVE' || !user?.id) {
        return null;
      }

      try {
        // First, get the user's profile from users table
        const { data: userProfile, error: userError } = await supabase
          .from('users')
          .select('id, name, email')
          .eq('auth_id', user.id)
          .single();

        if (userError || !userProfile) {
          console.warn('User profile not found:', userError);
          return null;
        }

        // Now fetch the field_executives record by name matching
        // (assumes user.name and field_executives.name are synchronized)
        // Alternative: if your schema has a FK in users table, use that instead
        const { data: feProfile, error: feError } = await supabase
          .from('field_executives')
          .select('*')
          .eq('name', userProfile.name)
          .single();

        if (feError) {
          // If name-based lookup fails, you may need to add a FK in users table
          // pointing to field_executives.id and use that instead
          console.warn('Field Executive profile not found:', feError);
          return null;
        }

        return feProfile as FieldExecutive;
      } catch (err) {
        console.error('Error fetching FE profile:', err);
        return null;
      }
    },
    enabled: role === 'FIELD_EXECUTIVE' && !!user?.id,
  });
}

/**
 * Hook to check if the current logged-in user is a Field Executive.
 * Returns a boolean for convenience in conditional rendering.
 */
export function useIsFieldExecutive() {
  const { role, loading } = useAuth();
  
  if (loading) {
    return null; // Still loading
  }
  
  return role === 'FIELD_EXECUTIVE';
}
