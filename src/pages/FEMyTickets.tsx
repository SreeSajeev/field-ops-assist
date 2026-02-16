/**
 * FEMyTickets - Field Executive Dashboard
 */

import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useFEMyTickets } from '@/hooks/useFEMyTickets';

import { useFETokenForTicket } from '@/hooks/useFETokenForTicket';
import { useFEConfirmOnsite, useFEMarkComplete } from '@/hooks/useTickets';
import { TicketStatus } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StatusBadge } from '@/components/tickets/StatusBadge';
import { toast } from '@/hooks/use-toast';
import {
  Truck,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  LogOut,
  Shield,
  PlayCircle,
  Loader2,
  Ticket as TicketIcon,
  Link as LinkIcon,
  Copy,
  ExternalLink,
} from 'lucide-react';

/* ======================================================
   FE Ticket Shape
====================================================== */
type FETwitter = {
  id: string;
  ticket_number: string;
  status: string;
  location?: string | null;
  issue_type?: string | null;
  category?: string | null;
  vehicle_number?: string | null;
  opened_at?: string | null;
};

/* ======================================================
   Ticket Card (UNCHANGED)
====================================================== */
function FETicketCard({
  ticket,
  onAcknowledge,
  onMarkComplete,
  isPending,
}: {
  ticket: FETwitter;
  onAcknowledge: (id: string) => void;
  onMarkComplete: (id: string) => void;
  isPending: boolean;
}) {
  const { data: accessToken } = useFETokenForTicket(ticket.id);

  const copyTokenLink = () => {
    if (!accessToken) return;
    const link = `${window.location.origin}/fe/action/${accessToken.token_hash}`;
    navigator.clipboard.writeText(link);
    toast({ title: 'Link copied to clipboard' });
  };

  const getActionButton = () => {
    switch (ticket.status) {
      case 'ASSIGNED':
        return (
          <Button
            onClick={() => onAcknowledge(ticket.id)}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="mr-2 h-4 w-4" />
            )}
            Mark as On Site
          </Button>
        );
      case 'ON_SITE':
        return (
          <Button
            onClick={() => onMarkComplete(ticket.id)}
            disabled={isPending}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Mark Work Complete
          </Button>
        );
      case 'RESOLVED_PENDING_VERIFICATION':
        return (
          <Badge
            variant="outline"
            className="w-full justify-center py-2 border-amber-500 text-amber-600"
          >
            <Clock className="mr-2 h-4 w-4" />
            Awaiting Staff Verification
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="font-mono text-lg">
              {ticket.ticket_number}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Created{' '}
              {ticket.opened_at
                ? format(new Date(ticket.opened_at), 'PPp')
                : '—'}
            </p>
          </div>

          <StatusBadge status={ticket.status as TicketStatus} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground">Location</p>
              <p className="font-medium">
                {ticket.location || 'Not specified'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Truck className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground">Issue Type</p>
              <p className="font-medium">
                {ticket.issue_type || ticket.category || 'Not specified'}
              </p>
            </div>
          </div>
        </div>

        {accessToken && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <LinkIcon className="h-4 w-4 text-primary" />
              <span>Access Token Available</span>
            </div>

            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-muted rounded px-2 py-1 truncate">
                {accessToken.token_hash}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={copyTokenLink}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() =>
                  window.open(
                    `/fe/action/${accessToken.token_hash}`,
                    '_blank'
                  )
                }
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Expires:{' '}
              {format(new Date(accessToken.expires_at), 'PPp')}
            </p>
          </div>
        )}

        <div className="pt-2">{getActionButton()}</div>
      </CardContent>
    </Card>
  );
}

/* ======================================================
   Page
====================================================== */
export default function FEMyTickets() {
  const { user, userProfile, signOut, isFieldExecutive } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { tickets, loading: ticketsLoading } = useFEMyTickets();

  const confirmOnsite = useFEConfirmOnsite();
  const markComplete = useFEMarkComplete();

  if (!isFieldExecutive && userProfile) {
    navigate('/');
    return null;
  }

  const handleAcknowledge = (ticketId: string) => {
    confirmOnsite.mutate(
      { ticketId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ['fe-token-for-ticket', ticketId],
          });
          queryClient.invalidateQueries({
            queryKey: ['fe-my-tickets'],
          });
        },
      }
    );
  };

  const handleMarkComplete = (ticketId: string) => {
    markComplete.mutate(
      { ticketId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ['fe-token-for-ticket', ticketId],
          });
          queryClient.invalidateQueries({
            queryKey: ['fe-my-tickets'],
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b px-6 py-4 bg-card">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">LogiCRM</h1>
              <p className="text-xs text-muted-foreground">
                Field Executive Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">
                {userProfile?.name || user?.email}
              </p>
              <Badge
                variant="outline"
                className="text-xs border-primary/50 text-primary"
              >
                <Truck className="mr-1 h-3 w-3" />
                Field Executive
              </Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {ticketsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !tickets.length ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <TicketIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Assigned Tickets
              </h3>
              <p className="text-muted-foreground max-w-sm">
                You don't have any tickets assigned yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tickets.map((ticket) => (
              <FETicketCard
                key={ticket.id}
                ticket={ticket}
                onAcknowledge={handleAcknowledge}
                onMarkComplete={handleMarkComplete}
                isPending={
                  confirmOnsite.isPending || markComplete.isPending
                }
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
