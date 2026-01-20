/**
 * CloseTicketDialog.tsx
 * 
 * Confirmation dialog for Service Staff to close/resolve a ticket.
 * Only allows closing tickets that are in appropriate states (ON_SITE, RESOLVED_PENDING_VERIFICATION).
 * 
 * Part of Requirement 2: Service Staff Ability to Close a Ticket
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { Ticket, TicketStatus } from '@/lib/types';

interface CloseTicketDialogProps {
  ticket: Ticket;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

// Statuses from which a ticket can be closed
const CLOSEABLE_STATUSES: TicketStatus[] = [
  'ON_SITE',
  'RESOLVED_PENDING_VERIFICATION',
];

export function CloseTicketDialog({
  ticket,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: CloseTicketDialogProps) {
  const canClose = CLOSEABLE_STATUSES.includes(ticket.status);
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Close Ticket
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            {canClose ? (
              <>
                <p>
                  Are you sure you want to close ticket{' '}
                  <span className="font-mono font-semibold">{ticket.ticket_number}</span>?
                </p>
                <p className="text-sm">
                  This will mark the ticket as <Badge className="bg-green-100 text-green-800 border-0">RESOLVED</Badge> and 
                  finalize the ticket lifecycle. This action indicates that the issue has been 
                  verified and resolved.
                </p>
              </>
            ) : (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Cannot Close This Ticket</p>
                  <p className="text-sm text-amber-700 mt-1">
                    Tickets can only be closed when they are in <strong>ON_SITE</strong> or{' '}
                    <strong>RESOLVED_PENDING_VERIFICATION</strong> status.
                  </p>
                  <p className="text-sm text-amber-700 mt-2">
                    Current status: <Badge variant="outline">{ticket.status}</Badge>
                  </p>
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          {canClose && (
            <AlertDialogAction
              onClick={onConfirm}
              disabled={isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {isPending ? 'Closing...' : 'Close Ticket'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
