// src/pages/TicketDetail.tsx
// 🔥 DEMO MODE – Proof ALWAYS visible, Close ALWAYS allowed

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
  const [actionBusy, setActionBusy] = useState(false);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          Loading ticket…
        </div>
      </DashboardLayout>
    );
  }

  if (!ticket) {
    return (
      <DashboardLayout>
        <div className="text-center">
          Ticket not found
        </div>
      </DashboardLayout>
    );
  }

  const currentAssignment =
    assignments && assignments.length > 0 ? assignments[0] : null;

  const assignedFE = currentAssignment?.field_executives ?? null;

  /* =====================================================
     🔥 FORCE CLOSE (NO STATUS BLOCKERS)
  ===================================================== */

  const handleForceClose = async () => {
    if (actionBusy) return;
    setActionBusy(true);

    try {
      await fetch(
        `${import.meta.env.VITE_CRM_API_URL}/tickets/${ticket.id}/close`,
        { method: "POST" }
      );

      await queryClient.invalidateQueries({
        queryKey: ["ticket", ticket.id],
      });

      await queryClient.invalidateQueries({
        queryKey: ["ticket-comments", ticket.id],
      });

      toast({
        title: "Ticket Closed",
      });
    } catch {
      toast({
        title: "Close failed",
        variant: "destructive",
      });
    } finally {
      setActionBusy(false);
    }
  };

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
              </div>
              <p className="text-muted-foreground">
                Opened {format(new Date(ticket.opened_at), "PPpp")}
              </p>
            </div>
          </div>

          {/* 🔥 ALWAYS SHOW CLOSE BUTTON */}
          <Button
            onClick={handleForceClose}
            disabled={actionBusy}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Close Ticket
          </Button>
        </div>

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
                <Info label="Vehicle Number" value={ticket.vehicle_number} />
                <Info label="Category" value={ticket.category} />
                <Info label="Issue Type" value={ticket.issue_type} />
                <IconInfo icon={MapPin} label="Location" value={ticket.location} />
                <IconInfo icon={Mail} label="Reported By" value={ticket.opened_by_email} />
              </CardContent>
            </Card>

            {/* ASSIGNED FE */}
            {assignedFE && (
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Field Executive</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">{assignedFE.name}</p>
                </CardContent>
              </Card>
            )}

            {/* 🔥 ACTIVITY — PROOF ALWAYS RENDERS */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {comments?.length ? (
                  comments.map((c: any) => {
                    let attachments: any[] = [];

                    try {
                      if (c.attachments) {
                        attachments =
                          typeof c.attachments === "string"
                            ? JSON.parse(c.attachments)
                            : c.attachments;
                      }

                      if (!Array.isArray(attachments)) {
                        attachments = [attachments];
                      }
                    } catch {
                      attachments = [];
                    }

                    return (
                      <div key={c.id} className="border-l-2 pl-4 space-y-2">
                        <div className="text-xs text-muted-foreground">
                          {c.source} •{" "}
                          {format(new Date(c.created_at), "PPp")}
                        </div>

                        <p className="text-sm">
                          {c.body || "Proof uploaded"}
                        </p>

                        {/* 🔥 FORCE RENDER ALL ATTACHMENTS */}
                        {attachments.map((a, i) => (
                          <div key={i} className="space-y-2">
                            {a?.image_url && (
                              <img
                                src={a.image_url}
                                alt="proof"
                                className="max-h-72 rounded border"
                              />
                            )}

                            {a?.remarks && (
                              <p className="text-sm text-muted-foreground">
                                <strong>Remarks:</strong> {a.remarks}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No activity yet.
                  </p>
                )}
              </CardContent>
            </Card>

          </div>

          {/* RIGHT */}
          <div>
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
          </div>
        </div>
      </div>

      <FEAssignmentModal
        ticket={ticket}
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
      />
    </DashboardLayout>
  );
}

/* ================= HELPERS ================= */

function Info({ label, value }: any) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "—"}</p>
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
