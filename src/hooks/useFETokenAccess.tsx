import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFETokenAccess(token: string | null) {
  return useQuery({
    queryKey: ["fe-token", token],
    enabled: !!token,
    queryFn: async () => {
      if (!token) throw new Error("No token provided");

      const { data, error } = await supabase
        .from("access_tokens")
        .select("*")
        .eq("token_hash", token.trim())
        .single();

      if (error || !data) {
        throw new Error("Invalid token");
      }

      if (data.revoked) {
        throw new Error("Token revoked");
      }

      if (new Date(data.expires_at) < new Date()) {
        throw new Error("Token expired");
      }

      return data;
    },
    retry: false,
  });
}
