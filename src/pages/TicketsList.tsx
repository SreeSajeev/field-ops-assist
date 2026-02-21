import { useState } from 'react';
import { AppLayoutNew } from '@/components/layout/AppLayoutNew';
import { PageContainer } from '@/components/layout/PageContainer';
import { TicketsTable } from '@/components/tickets/TicketsTable';
import { TicketFiltersBar } from '@/components/tickets/TicketFiltersBar';
import { CreateTicketModal } from '@/components/tickets/CreateTicketModal';
import { useTickets } from '@/hooks/useTickets';
import { TicketFilters } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

/**
 * TicketsList page with manual ticket creation capability.
 * Service staff can create tickets directly via the "Create Ticket" button.
 */
export default function TicketsList() {
  const [filters, setFilters] = useState<TicketFilters>({});
  const { data: tickets, isLoading } = useTickets(filters);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  return (
    <AppLayoutNew>
      <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">All Tickets</h1>
            <p className="text-muted-foreground">Manage and track all service tickets</p>
          </div>
          {/* Requirement 1: Manual Ticket Creation Button */}
          <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Ticket
          </Button>
        </div>

        <TicketFiltersBar filters={filters} onFiltersChange={setFilters} />

        <TicketsTable tickets={tickets || []} loading={isLoading} />
      </div>

      {/* Manual Ticket Creation Modal */}
      <CreateTicketModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </PageContainer>
    </AppLayoutNew>
  );
}