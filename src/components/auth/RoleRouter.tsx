import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export function RoleRouter() {
  const { loading, userProfile } = useAuth();

  if (loading) {
    return <FullPageLoader />;
  }

  if (!userProfile) {
    // authenticated but no profile = invalid state
    return <Navigate to="/" replace />;
  }

  if (userProfile.role === "FIELD_EXECUTIVE") {
    return <Navigate to="/fe/dashboard" replace />;
  }

  // STAFF / ADMIN / SUPER_ADMIN
  return <Navigate to="/staff/dashboard" replace />;
}
