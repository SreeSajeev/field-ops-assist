/**
 * Authorization Guard Components
 * 
 * These components provide frontend route protection based on user roles.
 * They complement (but do not replace) backend RLS policies.
 * 
 * Guards:
 * - RequireAuth: Ensures user is authenticated
 * - RequireStaff: Ensures user is Service Staff or Admin
 * - RequireFE: Ensures user is a Field Executive
 */
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface GuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Loading spinner shown while auth state is being determined
 */
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

/**
 * RequireAuth - Ensures user is authenticated
 * Redirects to login if not authenticated
 */
export function RequireAuth({ children, fallback }: GuardProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return fallback || <AuthLoading />;
  }

  if (!user) {
    // Save the attempted URL for redirect after login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

/**
 * RequireStaff - Ensures user is Service Staff or Admin
 * Field Executives are redirected to their dashboard
 */
export function RequireStaff({ children, fallback }: GuardProps) {
  const { user, loading, isFieldExecutive, userProfile } = useAuth();
  const location = useLocation();

  if (loading) {
    return fallback || <AuthLoading />;
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Wait for profile to load
  if (!userProfile) {
    return fallback || <AuthLoading />;
  }

  // Redirect FEs to their dashboard
  if (isFieldExecutive) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

/**
 * RequireFE - Ensures user is a Field Executive
 * Non-FE users are redirected to the main dashboard
 */
export function RequireFE({ children, fallback }: GuardProps) {
  const { user, loading, isFieldExecutive, userProfile } = useAuth();
  const location = useLocation();

  if (loading) {
    return fallback || <AuthLoading />;
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Wait for profile to load
  if (!userProfile) {
    return fallback || <AuthLoading />;
  }

  // Redirect non-FEs to main dashboard
  if (!isFieldExecutive) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

/**
 * RequireAdmin - Ensures user is an Admin or Super Admin
 */
export function RequireAdmin({ children, fallback }: GuardProps) {
  const { user, loading, isAdmin, userProfile } = useAuth();
  const location = useLocation();

  if (loading) {
    return fallback || <AuthLoading />;
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Wait for profile to load
  if (!userProfile) {
    return fallback || <AuthLoading />;
  }

  // Redirect non-admins
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
