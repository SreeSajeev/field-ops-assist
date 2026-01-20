import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFETokenAccess(token: string | null) {
  // ✅ Logs must be OUTSIDE the useQuery config
  console.log("🔥 useFETokenAccess CALLED");
  console.log("🔥 raw token param =", token);

  return useQuery({
    queryKey: ["fe-token", token],
    enabled: !!token,
    retry: false,

    queryFn: async () => {
      if (!token) {
        throw new Error("No token provided");
      }

      const cleanToken = token.trim();
      console.log("🧪 cleanToken =", cleanToken);

      const { data, error } = await supabase
        .from("access_tokens")
        .select("*")
        .eq("token_hash", cleanToken)
        .maybeSingle();

      console.log("🧪 token query result =", data);
      console.log("🧪 token query error =", error);

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
  });
}
