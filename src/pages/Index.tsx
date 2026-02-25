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
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const DEACTIVATED_KEY = "auth_deactivated";

export default function Index() {
  const { user, loading, userProfile, signOut } = useAuth();
  const [deactivatedMessage, setDeactivatedMessage] = useState(false);

  useEffect(() => {
    if (typeof sessionStorage === "undefined") return;
    if (sessionStorage.getItem(DEACTIVATED_KEY) === "1") {
      sessionStorage.removeItem(DEACTIVATED_KEY);
      setDeactivatedMessage(true);
    }
  }, []);

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
    return (
      <div className="flex min-h-screen w-full flex-col">
        {deactivatedMessage && (
          <Alert variant="destructive" className="mx-4 mt-4 max-w-md flex-shrink-0">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Account deactivated. Contact administrator.
            </AlertDescription>
          </Alert>
        )}
        <div className="flex flex-1 min-h-0 items-center justify-center">
          <LoginForm />
        </div>
      </div>
    );
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

  if (userProfile.role === "CLIENT") {
    return <Navigate to="/app/client" replace />;
  }

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
