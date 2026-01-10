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
import { AlertTriangle, ExternalLink, MapPin, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TicketsTableProps {
  tickets: Ticket[];
  loading?: boolean;
  compact?: boolean;
}

export function TicketsTable({ tickets, loading, compact = false }: TicketsTableProps) {
  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading tickets...</p>
        </div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center text-center p-8">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <span className="text-2xl">📭</span>
        </div>
        <h3 className="text-base font-semibold">No tickets found</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Tickets will appear here when support emails are received and processed.
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="divide-y divide-border">
        {tickets.map((ticket) => (
          <Link 
            key={ticket.id}
            to={`/tickets/${ticket.id}`}
            className="flex items-center justify-between py-3 px-1 hover:bg-muted/50 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {ticket.ticket_number}
                  </span>
                  {ticket.needs_review && (
                    <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground truncate">
                  {ticket.issue_type || ticket.category || 'Unclassified'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={ticket.status} />
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-[140px] font-semibold">Ticket #</TableHead>
            <TableHead className="w-[130px] font-semibold">Status</TableHead>
            <TableHead className="w-[100px] font-semibold">Confidence</TableHead>
            <TableHead className="font-semibold">Vehicle</TableHead>
            <TableHead className="font-semibold">Issue Type</TableHead>
            <TableHead className="font-semibold">Location</TableHead>
            <TableHead className="w-[150px] font-semibold">Opened</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket, idx) => (
            <TableRow 
              key={ticket.id} 
              className={cn(
                "data-table-row",
                idx % 2 === 0 ? "bg-background" : "bg-muted/20"
              )}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <Link 
                    to={`/tickets/${ticket.id}`}
                    className="font-mono text-sm font-semibold text-primary hover:underline"
                  >
                    {ticket.ticket_number}
                  </Link>
                  {ticket.needs_review && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-warning/15">
                      <AlertTriangle className="h-3 w-3 text-warning" />
                    </span>
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
                  <Badge variant="outline" className="font-mono text-xs">
                    {ticket.vehicle_number}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm font-medium">
                  {ticket.issue_type || <span className="text-muted-foreground">—</span>}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {ticket.location || '—'}
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(ticket.opened_at), 'MMM d, HH:mm')}
                </span>
              </TableCell>
              <TableCell>
                <Link 
                  to={`/tickets/${ticket.id}`}
                  className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
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
