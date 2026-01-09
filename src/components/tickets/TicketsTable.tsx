import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Ticket } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { ConfidenceScore } from './ConfidenceScore';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ExternalLink } from 'lucide-react';

interface TicketsTableProps {
  tickets: Ticket[];
  loading?: boolean;
}

export function TicketsTable({ tickets, loading }: TicketsTableProps) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading tickets...</div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center">
        <div className="mb-2 text-4xl">📭</div>
        <h3 className="text-lg font-medium">No tickets found</h3>
        <p className="text-sm text-muted-foreground">
          Tickets will appear here when emails are processed.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[140px]">Ticket #</TableHead>
            <TableHead className="w-[130px]">Status</TableHead>
            <TableHead className="w-[100px]">Confidence</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Issue Type</TableHead>
            <TableHead>Location</TableHead>
            <TableHead className="w-[160px]">Opened</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id} className="data-table-row">
              <TableCell>
                <div className="flex items-center gap-2">
                  <Link 
                    to={`/tickets/${ticket.id}`}
                    className="font-mono text-sm font-medium text-primary hover:underline"
                  >
                    {ticket.ticket_number}
                  </Link>
                  {ticket.needs_review && (
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  )}
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={ticket.status} />
              </TableCell>
              <TableCell>
                <ConfidenceScore score={ticket.confidence_score} showLabel={false} size="sm" />
              </TableCell>
              <TableCell>
                {ticket.vehicle_number ? (
                  <Badge variant="outline" className="font-mono">
                    {ticket.vehicle_number}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {ticket.issue_type || <span className="text-muted-foreground">—</span>}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {ticket.location || '—'}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(ticket.opened_at), 'MMM d, yyyy HH:mm')}
                </span>
              </TableCell>
              <TableCell>
                <Link 
                  to={`/tickets/${ticket.id}`}
                  className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
