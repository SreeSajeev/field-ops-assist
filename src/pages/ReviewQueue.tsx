import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TicketsTable } from '@/components/tickets/TicketsTable';
import { useTickets } from '@/hooks/useTickets';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function ReviewQueue() {
  // Filter: needs_review = true, status = OPEN, unassigned only
  const { data: tickets, isLoading } = useTickets({ 
    needsReview: true, 
    status: 'OPEN',
    unassignedOnly: true 
  });

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

        <Alert className="bg-amber-50 border-amber-200">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm text-amber-800">
            Only showing <strong>unassigned OPEN tickets</strong> with needs_review = true. 
            Assigned tickets are excluded from this queue.
          </AlertDescription>
        </Alert>

        <TicketsTable tickets={tickets || []} loading={isLoading} />
      </div>
    </DashboardLayout>
  );
}