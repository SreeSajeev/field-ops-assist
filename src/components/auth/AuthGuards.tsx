import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import React from "react";

/* ================= LOADING UI ================= */

function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading…</span>
      </div>
    </div>
  );
}

interface GuardProps {
  fallback?: React.ReactNode;
}

/* ================= BASE AUTH ================= */
/**
 * Authenticated users only.
 * Loading allowed ONLY while user is unresolved.
 */
export function RequireAuth({ fallback }: GuardProps) {
  const { user, loading } = useAuth();

  if (loading && !user) {
    return fallback ?? <AuthLoading />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

/* ================= STAFF ONLY ================= */
/**
 * STAFF / ADMIN only.
 * FE and CLIENT are explicitly redirected.
 */
export function RequireStaff({ fallback }: GuardProps) {
  const { user, loading, isFieldExecutive, isClient } = useAuth();

  if (loading && !user) {
    return fallback ?? <AuthLoading />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (isFieldExecutive) {
    return <Navigate to="/" replace />;
  }

  if (isClient) {
    return <Navigate to="/app/client" replace />;
  }

  return <Outlet />;
}

/* ================= CLIENT ONLY ================= */
/**
 * CLIENT only. Redirect non-CLIENT to /app.
 */
export function RequireClient({ children, fallback }: GuardProps & { children?: React.ReactNode }) {
  const { user, loading, userProfile } = useAuth();

  if (loading && !user) {
    return (fallback ?? <AuthLoading />) as React.ReactElement;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (userProfile?.role !== "CLIENT") {
    return <Navigate to="/app" replace />;
  }

  return children as React.ReactElement;
}

/* ================= FE ONLY ================= */
/**
 * FIELD_EXECUTIVE only.
 */
export function RequireFE({ fallback }: GuardProps) {
  const { user, loading, isFieldExecutive } = useAuth();

  if (loading && !user) {
    return fallback ?? <AuthLoading />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!isFieldExecutive) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

/* ================= ADMIN ONLY ================= */
/**
 * ADMIN / SUPER_ADMIN only.
 */
export function RequireAdmin({ fallback }: GuardProps) {
  const { user, loading, isAdmin } = useAuth();

  if (loading && !user) {
    return fallback ?? <AuthLoading />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

/* ================= SUPER ADMIN ONLY ================= */
/**
 * SUPER_ADMIN only. Used for SaaS super-admin dashboard.
 */
export function RequireSuperAdmin({ fallback }: GuardProps) {
  const { user, loading, userProfile } = useAuth();

  if (loading && !user) {
    return fallback ?? <AuthLoading />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (userProfile?.role !== "SUPER_ADMIN") {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
