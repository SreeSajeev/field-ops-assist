import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatusBadge } from '@/components/tickets/StatusBadge';
import { ConfidenceScore } from '@/components/tickets/ConfidenceScore';
import { useTicket, useTicketComments, useUpdateTicketStatus } from '@/hooks/useTickets';
import { useFieldExecutives } from '@/hooks/useFieldExecutives';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Truck, Calendar, Mail, AlertTriangle, CheckCircle } from 'lucide-react';

export default function TicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { data: ticket, isLoading } = useTicket(ticketId || '');
  const { data: comments } = useTicketComments(ticketId || '');
  const { data: fieldExecutives } = useFieldExecutives();
  const updateStatus = useUpdateTicketStatus();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading ticket...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!ticket) {
    return (
      <DashboardLayout>
        <div className="text-center">
          <h2 className="text-xl font-semibold">Ticket not found</h2>
          <Link to="/tickets" className="text-primary hover:underline">Back to tickets</Link>
        </div>
      </DashboardLayout>
    );
  }

  const handleApprove = () => {
    if (ticket.status === 'NEEDS_REVIEW') {
      updateStatus.mutate({ ticketId: ticket.id, status: 'OPEN' });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Link to="/tickets">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold font-mono">{ticket.ticket_number}</h1>
                <StatusBadge status={ticket.status} />
                {ticket.needs_review && (
                  <Badge variant="outline" className="border-warning text-warning">
                    <AlertTriangle className="mr-1 h-3 w-3" /> Needs Review
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                Opened {format(new Date(ticket.opened_at), 'PPpp')}
              </p>
            </div>
          </div>
          
          {ticket.needs_review && (
            <Button onClick={handleApprove} disabled={updateStatus.isPending}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve & Mark Open
            </Button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Complaint ID</p>
                  <p className="font-medium">{ticket.complaint_id || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle Number</p>
                  <p className="font-mono font-medium">{ticket.vehicle_number || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{ticket.category || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Issue Type</p>
                  <p className="font-medium">{ticket.issue_type || '—'}</p>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{ticket.location || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Reported By</p>
                    <p className="font-medium">{ticket.opened_by_email || '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                {comments?.length ? (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border-l-2 border-muted pl-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{comment.source}</Badge>
                          <span>{format(new Date(comment.created_at), 'PPp')}</span>
                        </div>
                        <p className="mt-1">{comment.body}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No activity yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Parsing Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <ConfidenceScore score={ticket.confidence_score} size="lg" />
                {ticket.confidence_score && ticket.confidence_score < 95 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Some fields may require manual verification.
                  </p>
                )}
              </CardContent>
            </Card>

            {ticket.status === 'OPEN' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Assign Field Executive
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Select a field executive to assign this ticket.
                  </p>
                  {fieldExecutives?.length ? (
                    <div className="space-y-2">
                      {fieldExecutives.slice(0, 5).map((fe) => (
                        <div 
                          key={fe.id} 
                          className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"
                        >
                          <div>
                            <p className="font-medium">{fe.name}</p>
                            <p className="text-sm text-muted-foreground">{fe.base_location}</p>
                          </div>
                          <Button size="sm">Assign</Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No field executives available</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
