import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TicketsTable } from '@/components/tickets/TicketsTable';
import { useTickets } from '@/hooks/useTickets';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function ReviewQueue() {
  const { data: tickets, isLoading } = useTickets({ status: 'NEEDS_REVIEW' });
  // Display only tickets whose current status is NEEDS_REVIEW (single source of truth)
  const displayTickets = (tickets || []).filter((t) => t.status === 'NEEDS_REVIEW');

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
              Tickets awaiting additional details or staff approval
            </p>
          </div>
        </div>

        <Alert className="bg-amber-50 border-amber-200">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm text-amber-800">
            Showing tickets with status <strong>NEEDS_REVIEW</strong>. Approve to move to OPEN or wait for client reply with missing details.
          </AlertDescription>
        </Alert>

        <TicketsTable tickets={displayTickets} loading={isLoading} />
      </div>
    </DashboardLayout>
  );
}