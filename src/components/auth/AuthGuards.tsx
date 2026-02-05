import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import React from "react";

/* ================= LOADING ================= */

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
 * Blocks unauthenticated users.
 * NEVER decides role routing.
 */
export function RequireAuth({ fallback }: GuardProps) {
  const { user, loading } = useAuth();

  if (loading) return fallback ?? <AuthLoading />;

  if (!user) {
    // Always send to public landing
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

/* ================= STAFF ONLY ================= */
/**
 * Allows STAFF / ADMIN
 * Blocks FIELD_EXECUTIVE
 */
export function RequireStaff({ fallback }: GuardProps) {
  const { user, loading, isFieldExecutive } = useAuth();

  if (loading) return fallback ?? <AuthLoading />;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (isFieldExecutive) {
    // FE should never land here
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

/* ================= FE ONLY ================= */
/**
 * Allows only FIELD_EXECUTIVE
 */
export function RequireFE({ fallback }: GuardProps) {
  const { user, loading, isFieldExecutive } = useAuth();

  if (loading) return fallback ?? <AuthLoading />;

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
 * Allows ADMIN / SUPER_ADMIN
 */
export function RequireAdmin({ fallback }: GuardProps) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return fallback ?? <AuthLoading />;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
