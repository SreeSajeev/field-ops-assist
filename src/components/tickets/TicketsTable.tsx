import { Link } from 'react-router-dom';
import { formatIST } from '@/lib/dateUtils';
import { Ticket } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { ConfidenceScore } from './ConfidenceScore';
import { getDisplayConfidenceScore } from '@/lib/confidence';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, MapPin, ChevronRight, Star } from 'lucide-react';
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
            to={`/app/tickets/${ticket.id}`}
            className="flex items-center justify-between py-3 px-1 hover:bg-muted/50 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold">
                    {ticket.ticket_number}
                  </span>
                  {ticket.priority === true && (
                    <span className="inline-flex rounded-full ring-2 ring-yellow-300/60 p-0.5" aria-label="Priority">
                      <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground truncate">
                  {ticket.issue_type || ticket.category || 'Unclassified'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={ticket.status} />
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
          <TableRow>
            <TableHead className="w-10">Priority</TableHead>
            <TableHead>Ticket #</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Issue Type</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Opened</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket, idx) => (
            <TableRow
              key={ticket.id}
              className={cn(idx % 2 === 0 ? 'bg-background' : 'bg-muted/20')}
            >
              <TableCell className="text-center">
                {ticket.priority === true ? (
                  <span className="inline-flex rounded-full ring-2 ring-yellow-300/60 p-0.5" aria-label="Priority">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <Link
                  to={`/app/tickets/${ticket.id}`}
                  className="font-mono text-sm font-semibold text-primary hover:underline"
                >
                  {ticket.ticket_number}
                </Link>
              </TableCell>
              <TableCell>
                <StatusBadge status={ticket.status} />
              </TableCell>
              <TableCell>
                <ConfidenceScore score={getDisplayConfidenceScore(ticket)} size="sm" />
              </TableCell>
              <TableCell>
                {ticket.vehicle_number ? (
                  <Badge variant="outline">{ticket.vehicle_number}</Badge>
                ) : '—'}
              </TableCell>
              <TableCell>{ticket.issue_type || '—'}</TableCell>
              <TableCell>
                <MapPin className="inline h-3 w-3 mr-1" />
                {ticket.location || '—'}
              </TableCell>
              <TableCell>
                {formatIST(ticket.opened_at, 'MMM d, HH:mm')}
              </TableCell>
              <TableCell>
                <Link
                  to={`/app/tickets/${ticket.id}`}
                  className="p-2 hover:text-primary"
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
