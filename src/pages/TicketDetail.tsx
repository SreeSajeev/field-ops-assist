import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  MapPin,
  Truck,
  Mail,
  AlertTriangle,
  CheckCircle,
  User,
  Clock,
  Image as ImageIcon,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/tickets/StatusBadge";
import { ConfidenceScore } from "@/components/tickets/ConfidenceScore";
import { FEAssignmentModal } from "@/components/tickets/FEAssignmentModal";
import { CloseTicketDialog } from "@/components/tickets/CloseTicketDialog";
import { generateFEActionToken } from "@/lib/feToken";

import {
  useTicket,
  useTicketComments,
  useTicketAssignments,
  useUpdateTicketStatus,
} from "@/hooks/useTickets";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TicketStatus } from "@/lib/types";
import { toast } from "@/hooks/use-toast";

export default function TicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate(); // ✅ added

  const { data: ticket, isLoading } = useTicket(ticketId ?? "");
  const { data: comments } = useTicketComments(ticketId ?? "");
  const { data: assignments } = useTicketAssignments(ticketId ?? "");
  const updateStatus = useUpdateTicketStatus();

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [tokenLabel, setTokenLabel] = useState<"ON_SITE" | "RESOLUTION">("ON_SITE");

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          Loading ticket…
        </div>
      </DashboardLayout>
    );
  }

  if (!ticket) {
    return (
      <DashboardLayout>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Ticket not found</h2>
          <Button onClick={() => navigate(-1)} className="text-primary">
            Back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const currentAssignment = assignments?.[0];
  const assignedFE = currentAssignment?.field_executives;

  const isPendingVerification =
    ticket.status === "RESOLVED_PENDING_VERIFICATION";

  const isResolved = ticket.status === "RESOLVED";

  const handleApprove = () => {
    if (ticket.needs_review) {
      updateStatus.mutate({ ticketId: ticket.id, status: "OPEN" });
    }
  };

  const handleVerifyAndClose = () => {
    updateStatus.mutate(
      { ticketId: ticket.id, status: "RESOLVED" as TicketStatus },
      {
        onSuccess: () =>
          toast({
            title: "Ticket Closed",
            description: `Ticket ${ticket.ticket_number} verified and closed.`,
          }),
      }
    );
  };

  const generateToken = async (type: "ON_SITE" | "RESOLUTION") => {
    if (!ticket || !currentAssignment?.fe_id) return;

    try {
      const result = await generateFEActionToken({
        ticketId: ticket.id,
        feId: currentAssignment.fe_id,
        actionType: type,
      });

      if (type === "ON_SITE") {
        await updateStatus.mutateAsync({
          ticketId: ticket.id,
          status: "EN_ROUTE" as TicketStatus,
        });
      }

      if (type === "RESOLUTION") {
        await updateStatus.mutateAsync({
          ticketId: ticket.id,
          status: "ON_SITE" as TicketStatus,
        });
      }

      setTokenLabel(type);
      setGeneratedToken(result.tokenId);
    } catch {
      toast({
        title: "Token generation failed",
        variant: "destructive",
      });
    }
  };

  const handleClose = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_CRM_API_URL}/tickets/${ticket.id}/close`,
        { method: "POST" }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Close failed");
      }

      await updateStatus.mutateAsync({
        ticketId: ticket.id,
        status: "RESOLVED" as TicketStatus,
      });

      toast({
        title: "Ticket Closed",
        description: `Ticket ${ticket.ticket_number} verified and closed.`,
      });
    } catch (err) {
      toast({
        title: "Close failed",
        description:
          err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* ✅ FIXED BACK BUTTON */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold font-mono">
                  {ticket.ticket_number}
                </h1>
                <StatusBadge status={ticket.status} />
              </div>
              <p className="text-muted-foreground">
                Opened {format(new Date(ticket.opened_at), "PPpp")}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {isPendingVerification && (
              <Button
                onClick={handleClose}
                className="bg-green-600 hover:bg-green-700"
              >
                Verify & Close
              </Button>
            )}

            {isResolved && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="mr-2 h-4 w-4" />
                Resolved
              </Badge>
            )}
          </div>
        </div>

        {/* rest of your UI unchanged */}
      </div>

      <FEAssignmentModal
        ticket={ticket}
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
      />

      <CloseTicketDialog
        ticket={ticket}
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        onConfirm={handleClose}
        isPending={updateStatus.isPending}
      />
    </DashboardLayout>
  );
}

function Info({ label, value, mono }: any) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={mono ? "font-mono font-medium" : "font-medium"}>
        {value || "—"}
      </p>
    </div>
  );
}

function IconInfo({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-1 h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{value || "—"}</p>
      </div>
    </div>
  );
}
