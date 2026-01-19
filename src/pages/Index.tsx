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
