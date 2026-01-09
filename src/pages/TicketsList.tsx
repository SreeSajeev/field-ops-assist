import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TicketsTable } from '@/components/tickets/TicketsTable';
import { TicketFiltersBar } from '@/components/tickets/TicketFiltersBar';
import { useTickets } from '@/hooks/useTickets';
import { TicketFilters } from '@/lib/types';

export default function TicketsList() {
  const [filters, setFilters] = useState<TicketFilters>({});
  const { data: tickets, isLoading } = useTickets(filters);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">All Tickets</h1>
          <p className="text-muted-foreground">Manage and track all service tickets</p>
        </div>

        <TicketFiltersBar filters={filters} onFiltersChange={setFilters} />

        <TicketsTable tickets={tickets || []} loading={isLoading} />
      </div>
    </DashboardLayout>
  );
}
