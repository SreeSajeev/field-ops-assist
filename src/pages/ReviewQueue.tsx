import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TicketsTable } from '@/components/tickets/TicketsTable';
import { useTickets } from '@/hooks/useTickets';
import { AlertTriangle } from 'lucide-react';

export default function ReviewQueue() {
  const { data: tickets, isLoading } = useTickets({ needsReview: true });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20">
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Review Queue</h1>
            <p className="text-muted-foreground">
              Tickets with low confidence scores requiring manual review
            </p>
          </div>
        </div>

        <TicketsTable tickets={tickets || []} loading={isLoading} />
      </div>
    </DashboardLayout>
  );
}
