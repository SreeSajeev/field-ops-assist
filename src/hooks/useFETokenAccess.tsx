import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFETokenAccess(token: string | null) {
  const cleanToken = token?.trim() ?? "";

  return useQuery({
    queryKey: ["fe-token-access", cleanToken || "none"],
    enabled: !!cleanToken,
    retry: false,

    queryFn: async () => {
      if (!cleanToken) {
        return null;
      }

      const { data, error } = await (supabase as any)
        .from("access_tokens")
        .select("*")
        .eq("token_hash", cleanToken)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      if (data.revoked) {
        return null;
      }

      if (new Date(data.expires_at) < new Date()) {
        return null;
      }

      return data;
    },
  });
}
