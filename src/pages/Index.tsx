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
*/

import { useAuth } from "@/hooks/useAuth";
import { LoginForm } from "@/components/auth/LoginForm";
import Dashboard from "./Dashboard";
import FEMyTickets from "./FEMyTickets";

export default function Index() {
  const { user, loading, isFieldExecutive, userProfile } = useAuth();

  /**
   * 🔒 HARD RULE:
   * - Only block while auth is loading
   * - NEVER block forever waiting for profile
   */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading…</div>
      </div>
    );
  }

  // 🔓 Not logged in → Login
  if (!user) {
    return <LoginForm />;
  }

  /**
   * ⚠️ Profile may briefly be null in production
   * (network, RLS, cold start, etc.)
   * Do NOT infinite-load — fall back safely.
   */
  if (!userProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">
          Setting up your workspace…
        </div>
      </div>
    );
  }

  // 👷 Field Executive portal
  if (isFieldExecutive) {
    return <FEMyTickets />;
  }

  // 🧑‍💼 Staff / Admin dashboard
  return <Dashboard />;
}
