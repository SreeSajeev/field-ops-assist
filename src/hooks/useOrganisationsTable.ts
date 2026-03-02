import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Organisation } from "@/lib/types";

/**
 * Fetches organisations from the organisations table (SaaS multi-tenant).
 * Use this for SuperAdmin: list orgs, create org, add user under org.
 */
export function useOrganisationsTable() {
  return useQuery({
    queryKey: ["organisations-table"],
    queryFn: async (): Promise<Organisation[]> => {
      const { data, error } = await supabase
        .from("organisations")
        .select("id, name, slug, created_at, status")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Organisation[];
    },
  });
}

/**
 * Create a new organisation. SuperAdmin only.
 */
export function useCreateOrganisation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; slug: string }) => {
      const { data, error } = await supabase
        .from("organisations")
        .insert({
          name: payload.name.trim(),
          slug: payload.slug.trim().toLowerCase().replace(/\s+/g, "-"),
          status: "active",
        })
        .select("id, name, slug, created_at, status")
        .single();
      if (error) throw error;
      return data as Organisation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organisations-table"] });
    },
  });
}
