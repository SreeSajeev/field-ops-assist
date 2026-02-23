import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OrganizationRow {
  slug: string;
  displayName: string;
  ticketCount: number;
}

function slugToDisplayName(slug: string): string {
  const trimmed = String(slug).trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

/**
 * Returns distinct client_slug values from tickets with ticket count per org.
 * Read-only: Supabase select only. No schema changes.
 */
export function useOrganizations() {
  return useQuery({
    queryKey: ["organizations"],
    queryFn: async (): Promise<OrganizationRow[]> => {
      const { data, error } = await supabase
        .from("tickets")
        .select("client_slug");

      if (error) throw error;

      const slugs = (data ?? [])
        .map((row: { client_slug: string | null }) => row.client_slug)
        .filter((s): s is string => s != null && String(s).trim() !== "");

      const countBySlug: Record<string, number> = {};
      for (const slug of slugs) {
        const key = String(slug).trim();
        countBySlug[key] = (countBySlug[key] ?? 0) + 1;
      }

      const unique = [...new Set(slugs.map((s) => String(s).trim()))];
      return unique
        .sort((a, b) => a.localeCompare(b))
        .map((slug) => ({
          slug,
          displayName: slugToDisplayName(slug),
          ticketCount: countBySlug[slug] ?? 0,
        }));
    },
    refetchInterval: 30000,
  });
}
