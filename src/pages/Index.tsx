/*
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import Dashboard from './Dashboard';
import FEMyTickets from './FEMyTickets';

const Index = () => {
  const { user, loading, isFieldExecutive, userProfile } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  // Route Field Executives to their dedicated portal
  if (isFieldExecutive) {
    return <FEMyTickets />;
  }

  return <Dashboard />;
};

export default Index;

import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/auth/LoginForm';
import Dashboard from './Dashboard';
import FEMyTickets from './FEMyTickets';

const Index = () => {
  const { user, loading, isFieldExecutive, userProfile } = useAuth();

  // 🔑 Wait for BOTH auth AND profile
  if (loading || (user && !userProfile)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  // Route Field Executives to their portal
  if (isFieldExecutive) {
    return <FEMyTickets />;
  }

  return <Dashboard />;
};

export default Index;


import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoginForm } from "@/components/auth/LoginForm";

export default function Index() {
  const { user, loading, isFieldExecutive, userProfile } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  if (!userProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">
          Setting up your workspace…
        </div>
      </div>
    );
  }

  // Redirect ONCE, not render dashboards here
  if (isFieldExecutive) {
    return <Navigate to="/fe/tickets" replace />;
  }

  return <Navigate to="/app" replace />;
}

*/
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoginForm } from "@/components/auth/LoginForm";

export default function Index() {
  const { user, loading, userProfile, signOut } = useAuth();

  /* =========================
     AUTH BOOTSTRAP
  ========================= */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Loading…
        </div>
      </div>
    );
  }

  /* =========================
     NOT AUTHENTICATED
  ========================= */

  if (!user) {
    return <LoginForm />;
  }

  /* =========================
     PROFILE NOT READY
  ========================= */

  if (!userProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">
          Setting up your workspace…
        </div>
      </div>
    );
  }

  /* =========================
     ROLE-BASED ROUTING
  ========================= */

  if (userProfile.role === "FIELD_EXECUTIVE") {
    return <Navigate to="/fe" replace />;
  }

  if (
    userProfile.role === "STAFF" ||
    userProfile.role === "ADMIN" ||
    userProfile.role === "SUPER_ADMIN"
  ) {
    return <Navigate to="/app" replace />;
  }

  /* =========================
     SAFETY FALLBACK (SHOULD NEVER HAPPEN)
  ========================= */

  console.error("Unknown role detected:", userProfile.role);
  signOut();
  return null;
}
