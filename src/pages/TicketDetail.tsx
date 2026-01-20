/**
 * TicketDetail.tsx
 * 
 * Detailed view of a single ticket with assignment, verification, and close functionality.
 * Includes:
 * - Requirement 2: Close Ticket functionality with confirmation
 * - Requirement 3: Integration with FE Assignment modal (confirmation handled there)
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatusBadge } from '@/components/tickets/StatusBadge';
import { ConfidenceScore } from '@/components/tickets/ConfidenceScore';
import { FEAssignmentModal } from '@/components/tickets/FEAssignmentModal';
import { CloseTicketDialog } from '@/components/tickets/CloseTicketDialog';
import { useTicket, useTicketComments, useTicketAssignments, useUpdateTicketStatus } from '@/hooks/useTickets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  MapPin, 
  Truck, 
  Calendar, 
  Mail, 
  AlertTriangle, 
  CheckCircle,
  User,
  Clock,
  Image,
  Video,
  XCircle
} from 'lucide-react';
import { TicketStatus } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

export default function TicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { data: ticket, isLoading } = useTicket(ticketId || '');
  const { data: comments } = useTicketComments(ticketId || '');
  const { data: assignments } = useTicketAssignments(ticketId || '');
  const updateStatus = useUpdateTicketStatus();
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);

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

  // Handle verification and close from pending verification state
  const handleVerifyAndClose = () => {
    updateStatus.mutate(
      { ticketId: ticket.id, status: 'RESOLVED' as TicketStatus },
      {
        onSuccess: () => {
          toast({
            title: 'Ticket Closed',
            description: `Ticket ${ticket.ticket_number} has been verified and closed.`,
          });
        },
      }
    );
  };

  // Handle closing ticket from close dialog (Requirement 2)
  const handleCloseTicket = () => {
    updateStatus.mutate(
      { ticketId: ticket.id, status: 'RESOLVED' as TicketStatus },
      {
        onSuccess: () => {
          setCloseDialogOpen(false);
          toast({
            title: 'Ticket Closed',
            description: `Ticket ${ticket.ticket_number} has been resolved and closed.`,
          });
        },
      }
    );
  };

  const currentAssignment = assignments?.[0];
  const assignedFE = currentAssignment?.field_executives;

  // Check if ticket is pending verification
  const isPendingVerification = ticket.status === 'RESOLVED_PENDING_VERIFICATION';
  
  // Check if ticket can be closed (Requirement 2: only from ON_SITE or RESOLVED_PENDING_VERIFICATION)
  const canCloseTicket = ['ON_SITE', 'RESOLVED_PENDING_VERIFICATION'].includes(ticket.status);
  
  // Check if ticket is already resolved
  const isResolved = ticket.status === 'RESOLVED';

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
          
          <div className="flex gap-2">
            {ticket.needs_review && (
              <Button onClick={handleApprove} disabled={updateStatus.isPending}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve & Mark Open
              </Button>
            )}
            
            {/* Requirement 2: Close Ticket Button - Only show for closeable states */}
            {canCloseTicket && !isPendingVerification && (
              <Button 
                variant="outline" 
                onClick={() => setCloseDialogOpen(true)}
                disabled={updateStatus.isPending}
                className="border-green-500 text-green-600 hover:bg-green-50"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Close Ticket
              </Button>
            )}
            
            {/* Show resolved badge if already resolved */}
            {isResolved && (
              <Badge className="bg-green-100 text-green-800 border-0 py-2 px-4">
                <CheckCircle className="mr-2 h-4 w-4" />
                Resolved
              </Badge>
            )}
          </div>
        </div>

        {/* Pending Verification Alert */}
        {isPendingVerification && (
          <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                <strong>Pending Verification:</strong> The Field Executive has marked this ticket as complete. 
                Please review the work and verify to close the ticket.
              </span>
              <Button 
                onClick={handleVerifyAndClose} 
                disabled={updateStatus.isPending}
                className="ml-4 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Verify & Close Ticket
              </Button>
            </AlertDescription>
          </Alert>
        )}

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

            {/* Current Assignment */}
            {currentAssignment && assignedFE && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Assigned Field Executive
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                      {assignedFE.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{assignedFE.name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {assignedFE.base_location || 'No location'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Assigned {format(new Date(currentAssignment.assigned_at || currentAssignment.created_at), 'PPp')}
                        </span>
                      </div>
                    </div>
                    <Badge variant={assignedFE.active ? 'default' : 'secondary'}>
                      {assignedFE.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {currentAssignment.override_reason && (
                    <Alert className="mt-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Override Reason:</strong> {currentAssignment.override_reason}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

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

            {/* Assignment Section - Only show for OPEN tickets */}
            {ticket.status === 'OPEN' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Assign Field Executive
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Select a field executive to assign this ticket. The system will recommend 
                    the best matches based on location and skills.
                  </p>
                  <Button 
                    onClick={() => setAssignModalOpen(true)} 
                    className="w-full"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Assign Field Executive
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Status Info for non-OPEN tickets */}
            {ticket.status !== 'OPEN' && ticket.status !== 'NEEDS_REVIEW' && !isPendingVerification && currentAssignment && (
              <Card>
                <CardHeader>
                  <CardTitle>Assignment Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Assigned To</span>
                    <span className="font-medium">{assignedFE?.name}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      <FEAssignmentModal 
        ticket={ticket}
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
      />

      {/* Close Ticket Dialog - Requirement 2 */}
      <CloseTicketDialog
        ticket={ticket}
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        onConfirm={handleCloseTicket}
        isPending={updateStatus.isPending}
      />
    </DashboardLayout>
  );
}
