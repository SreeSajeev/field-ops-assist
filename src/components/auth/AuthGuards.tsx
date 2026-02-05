import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface GuardProps {
  fallback?: React.ReactNode;
}

function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading...</span>
      </div>
    </div>
  );
}

export function RequireAuth({ fallback }: GuardProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return fallback || <AuthLoading />;
  if (!user) return <Navigate to="/" state={{ from: location }} replace />;

  return <Outlet />;
}

export function RequireStaff({ fallback }: GuardProps) {
  const { user, loading, isFieldExecutive } = useAuth();
  const location = useLocation();

  if (loading) return fallback || <AuthLoading />;
  if (!user) return <Navigate to="/" state={{ from: location }} replace />;
  if (isFieldExecutive) return <Navigate to="/" replace />;

  return <Outlet />;
}

export function RequireFE({ fallback }: GuardProps) {
  const { user, loading, isFieldExecutive } = useAuth();
  const location = useLocation();

  if (loading) return fallback || <AuthLoading />;
  if (!user) return <Navigate to="/" state={{ from: location }} replace />;
  if (!isFieldExecutive) return <Navigate to="/" replace />;

  return <Outlet />;
}

export function RequireAdmin({ fallback }: GuardProps) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) return fallback || <AuthLoading />;
  if (!user) return <Navigate to="/" state={{ from: location }} replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
}
