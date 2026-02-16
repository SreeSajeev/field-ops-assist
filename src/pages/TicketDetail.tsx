// src/pages/TicketDetail.tsx
// Backend-authoritative, reconciliation-safe version

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  MapPin,
  Truck,
  Mail,
  AlertTriangle,
  CheckCircle,
  User,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/tickets/StatusBadge";
import { ConfidenceScore } from "@/components/tickets/ConfidenceScore";
import { FEAssignmentModal } from "@/components/tickets/FEAssignmentModal";
import { CloseTicketDialog } from "@/components/tickets/CloseTicketDialog";

import {
  useTicket,
  useTicketComments,
  useTicketAssignments,
  useCloseTicket,
} from "@/hooks/useTickets";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

/* ================= TYPES ================= */

type FEAttachment = {
  image_url?: string;
  remarks?: string;
  action_type?: string;
};

/* ================= COMPONENT ================= */

export default function TicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: ticket, isLoading } = useTicket(ticketId ?? "");
  const { data: comments } = useTicketComments(ticketId ?? "");
  const { data: assignments } = useTicketAssignments(ticketId ?? "");
  const closeTicket = useCloseTicket();

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  /* ================= LOADING / EMPTY ================= */

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
          <Button variant="link" onClick={() => navigate("/app/tickets")}>
            Back to tickets
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  /* ================= DERIVED STATE ================= */

  const currentAssignment =
    assignments && assignments.length > 0 ? assignments[0] : null;

  const assignedFE = currentAssignment?.field_executives ?? null;

  const canAssignFE =
    !currentAssignment &&
    (ticket.status === "OPEN" || ticket.status === "ASSIGNED");

  const isPendingVerification =
    ticket.status === "RESOLVED_PENDING_VERIFICATION";

  const isResolved = ticket.status === "RESOLVED";

  /* ================= ACTIONS (RECONCILED) ================= */

  const handleApprove = async () => {
    if (!ticket.needs_review || actionBusy) return;
    setActionBusy(true);

    try {
      await fetch(
        `${import.meta.env.VITE_CRM_API_URL}/tickets/${ticket.id}/approve-review`,
        { method: "POST" }
      );

      await queryClient.invalidateQueries({
        queryKey: ["ticket", ticket.id],
      });

      toast({
        title: "Ticket approved",
        description: "Ticket reopened and ready for assignment.",
      });
    } catch {
      toast({
        title: "Approval failed",
        variant: "destructive",
      });
    } finally {
      setActionBusy(false);
    }
  };

  const handleVerifyOnsite = async () => {
    if (actionBusy) return;
    setActionBusy(true);

    try {
      await fetch(
        `${import.meta.env.VITE_CRM_API_URL}/tickets/${ticket.id}/on-site-token`,
        { method: "POST" }
      );

      await queryClient.invalidateQueries({
        queryKey: ["ticket", ticket.id],
      });

      toast({
        title: "On-site proof verified",
        description: "Resolution link sent to Field Executive.",
      });
    } catch {
      toast({
        title: "Verification failed",
        variant: "destructive",
      });
    } finally {
      setActionBusy(false);
    }
  };

  const handleVerifyAndClose = () => {
    closeTicket.mutate({ ticketId: ticket.id });
  };

  const handleCloseTicket = () => {
    closeTicket.mutate(
      { ticketId: ticket.id },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: ["ticket", ticket.id],
          });
          setCloseDialogOpen(false);
        },
      }
    );
  };

  /* ================= UI ================= */

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
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
                {ticket.needs_review && (
                  <Badge
                    variant="outline"
                    className="border-warning text-warning"
                  >
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Needs Review
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                Opened {format(new Date(ticket.opened_at), "PPpp")}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {ticket.needs_review && (
              <Button disabled={actionBusy} onClick={handleApprove}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve & Open
              </Button>
            )}

            {isPendingVerification && (
              <Button
                disabled={actionBusy}
                onClick={handleVerifyAndClose}
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

        {/* REST OF FILE UNCHANGED */}


        {/* MAIN GRID */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {/* DETAILS */}
            <Card>
              <CardHeader>
                <CardTitle>Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Info label="Complaint ID" value={ticket.complaint_id} />
                <Info
                  label="Vehicle Number"
                  value={ticket.vehicle_number}
                  mono
                />
                <Info label="Category" value={ticket.category} />
                <Info label="Issue Type" value={ticket.issue_type} />
                <IconInfo
                  icon={MapPin}
                  label="Location"
                  value={ticket.location}
                />
                <IconInfo
                  icon={Mail}
                  label="Reported By"
                  value={ticket.opened_by_email}
                />
              </CardContent>
            </Card>

            {/* ASSIGNED FE */}
            {assignedFE && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Assigned Field Executive
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-semibold">
                    {assignedFE.name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{assignedFE.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Assigned{" "}
                      {format(
                        new Date(
                          currentAssignment?.assigned_at ??
                            currentAssignment?.created_at ??
                            ticket.opened_at
                        ),
                        "PPp"
                      )}
                    </p>
                  </div>
                  <Badge>
                    {assignedFE.active ? "Active" : "Inactive"}
                  </Badge>
                </CardContent>
              </Card>
            )}

            {/* ASSIGN FE */}
            {canAssignFE && (
              <Card>
                <CardHeader>
                  <CardTitle>Assign Field Executive</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    onClick={() => setAssignModalOpen(true)}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Assign Field Executive
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* ACTIVITY */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {comments?.length ? (
                  comments.map((c) => {
                    let attachment: FEAttachment | null = null;

                    try {
                      if (c.attachments) {
                        attachment =
                          typeof c.attachments === "string"
                            ? JSON.parse(c.attachments)
                            : c.attachments;
                      }
                    } catch {
                      attachment = null;
                    }

                    // 🔐 SAFE DISPLAY MESSAGE
                    const message =
                      c.body ||
                      (attachment?.action_type === "ON_SITE"
                        ? "Field Executive submitted on-site proof"
                        : attachment?.action_type === "RESOLUTION"
                        ? "Field Executive submitted resolution proof"
                        : c.source === "SYSTEM"
                        ? "System updated ticket status"
                        : "Activity recorded");

                    return (
                      <div key={c.id} className="relative pl-4 border-l-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <Badge variant="outline">{c.source}</Badge>
                          <span>{format(new Date(c.created_at), "PPp")}</span>
                        </div>

                        <p className="text-sm">{message}</p>

                        {attachment?.image_url && (
                          <img
                            src={attachment.image_url}
                            alt="FE proof"
                            className="mt-3 max-h-64 rounded border"
                          />
                        )}

                        {attachment?.remarks && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            <strong>Remarks:</strong> {attachment.remarks}
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No activity recorded yet.
                  </p>
                )}
              </CardContent>
            </Card>

          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Parsing Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <ConfidenceScore
                  score={ticket.confidence_score}
                  size="lg"
                />
              </CardContent>
            </Card>

            {ticket.status === "ON_SITE" && (
              <Button
                disabled={actionBusy}
                className="w-full"
                onClick={handleVerifyOnsite}
              >
                Verify On-Site Proof
              </Button>
            )}
          </div>
        </div>
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
        onConfirm={handleCloseTicket}
        isPending={closeTicket.isPending}
      />
    </DashboardLayout>
  );
}

/* ================= HELPERS ================= */

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
