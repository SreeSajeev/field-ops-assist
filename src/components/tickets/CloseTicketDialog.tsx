/**
 * CloseTicketDialog.tsx
 *
 * Confirmation dialog for Service Staff to close/resolve a ticket.
 * Only allows closing tickets that are in appropriate states (ON_SITE, RESOLVED_PENDING_VERIFICATION).
 * Requires Resolution Category; includes optional verification remarks (sent to backend and included in resolution email).
 */

import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { Ticket, TicketStatus } from "@/lib/types";
import { RESOLUTION_CATEGORIES } from "@/constants/complaintCategories";

interface CloseTicketDialogProps {
  ticket: Ticket;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (verificationRemarks: string, resolutionCategory: string) => void;
  isPending: boolean;
}

const CLOSEABLE_STATUSES: TicketStatus[] = [
  "ON_SITE",
  "RESOLVED_PENDING_VERIFICATION",
];

export function CloseTicketDialog({
  ticket,
  open,
  onOpenChange,
  onConfirm,
  isPending,
}: CloseTicketDialogProps) {
  const [remarks, setRemarks] = useState("");
  const [resolutionCategory, setResolutionCategory] = useState("");
  const canClose = CLOSEABLE_STATUSES.includes(ticket.status);
  const canConfirm = canClose && resolutionCategory.trim() !== "";

  useEffect(() => {
    if (!open) {
      setRemarks("");
      setResolutionCategory("");
    }
  }, [open]);

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(remarks, resolutionCategory.trim());
    setRemarks("");
    setResolutionCategory("");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Close Ticket
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              {canClose ? (
                <>
                  <p>
                    Are you sure you want to close ticket{" "}
                    <span className="font-mono font-semibold">{ticket.ticket_number}</span>?
                  </p>
                  <p>
                    This will mark the ticket as{" "}
                    <Badge className="bg-green-100 text-green-800 border-0">RESOLVED</Badge> and
                    finalize the ticket lifecycle. This action indicates that the issue has been
                    verified and resolved.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="close-resolution-category">Resolution Category *</Label>
                    <Select
                      value={resolutionCategory}
                      onValueChange={setResolutionCategory}
                    >
                      <SelectTrigger id="close-resolution-category">
                        <SelectValue placeholder="Select resolution category" />
                      </SelectTrigger>
                      <SelectContent>
                        {RESOLUTION_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="close-remarks">Verification remarks (optional)</Label>
                    <Textarea
                      id="close-remarks"
                      placeholder="Notes for the client..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                </>
              ) : (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-amber-800">Cannot Close This Ticket</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Tickets can only be closed when they are in <strong>ON_SITE</strong> or{" "}
                      <strong>RESOLVED_PENDING_VERIFICATION</strong> status.
                    </p>
                    <p className="text-sm text-amber-700 mt-2">
                      Current status: <Badge variant="outline">{ticket.status}</Badge>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          {canClose && (
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isPending || !canConfirm}
              className="bg-green-600 hover:bg-green-700"
            >
              {isPending ? "Closing…" : "Close Ticket"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
