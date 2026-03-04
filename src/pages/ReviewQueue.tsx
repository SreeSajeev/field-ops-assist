import { AppLayoutNew } from '@/components/layout/AppLayoutNew';
import { PageContainer } from '@/components/layout/PageContainer';
import { TicketsTable } from '@/components/tickets/TicketsTable';
import { useTickets } from '@/hooks/useTickets';
import { AlertTriangle } from 'lucide-react';

export default function ReviewQueue() {
  const { data: tickets, isLoading } = useTickets({ status: 'NEEDS_REVIEW', scopeAllOrganisations: true });
  const displayTickets = (tickets || []).filter((t) => t.status === 'NEEDS_REVIEW');

  return (
    <AppLayoutNew>
      <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20">
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Review Queue</h1>
            <p className="text-sm text-muted-foreground">
              Tickets awaiting additional details or Service Manager approval
            </p>
          </div>
        </div>

        <TicketsTable tickets={displayTickets} loading={isLoading} />
      </div>
    </PageContainer>
    </AppLayoutNew>
  );
}