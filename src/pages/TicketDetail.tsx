import { useState } from "react";
import { useParams, Link } from "react-router-dom";
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
  useUpdateTicketStatus,
} from "@/hooks/useTickets";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TicketStatus } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { generateFEActionToken } from "@/lib/feToken";

/* ================= TYPES ================= */

type FEAttachment = {
  image_base64?: string;
  remarks?: string;
  action_type?: string;
};

/* ================= COMPONENT ================= */

export default function TicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();

  const { data: ticket, isLoading } = useTicket(ticketId ?? "");
  const { data: comments } = useTicketComments(ticketId ?? "");
  const { data: assignments } = useTicketAssignments(ticketId ?? "");
  const updateStatus = useUpdateTicketStatus();

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [tokenLabel, setTokenLabel] =
    useState<"ON_SITE" | "RESOLUTION">("ON_SITE");

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
          <Link to="/tickets" className="text-primary hover:underline">
            Back to tickets
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  /* ================= DERIVED STATE ================= */

  const hasAssignment = Boolean(assignments && assignments.length > 0);
  const currentAssignment = hasAssignment ? assignments![0] : null;
  const assignedFE = currentAssignment?.field_executives;

  const canAssignFE =
    !currentAssignment &&
    (ticket.status === "OPEN" || ticket.status === "ASSIGNED");

  const isPendingVerification =
    ticket.status === "RESOLVED_PENDING_VERIFICATION";
  const isResolved = ticket.status === "RESOLVED";

  /* ================= ACTIONS ================= */

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

  const handleCloseTicket = () => {
    updateStatus.mutate(
      { ticketId: ticket.id, status: "RESOLVED" as TicketStatus },
      {
        onSuccess: () => {
          setCloseDialogOpen(false);
          toast({
            title: "Ticket Closed",
            description: `Ticket ${ticket.ticket_number} closed successfully.`,
          });
        },
      }
    );
  };

  const generateToken = async (type: "ON_SITE" | "RESOLUTION") => {
    if (!currentAssignment?.fe_id) return;

    try {
      const res = await generateFEActionToken({
        ticketId: ticket.id,
        feId: currentAssignment.fe_id,
        actionType: type,
      });

      await updateStatus.mutateAsync({
        ticketId: ticket.id,
        status: type === "ON_SITE" ? "EN_ROUTE" : "ON_SITE",
      });

      await supabase.from("audit_logs").insert({
        entity_type: "ticket",
        entity_id: ticket.id,
        action: `token_generated_${type.toLowerCase()}`,
        metadata: {
          fe_id: currentAssignment.fe_id,
          token_type: type,
        },
      });

      setTokenLabel(type);
      setGeneratedToken(res.tokenId);
    } catch {
      toast({
        title: "Token generation failed",
        variant: "destructive",
      });
    }
  };

  /* ================= UI ================= */

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Link to="/tickets">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold font-mono">
                  {ticket.ticket_number}
                </h1>
                <StatusBadge status={ticket.status} />
                {ticket.needs_review && (
                  <Badge variant="outline" className="border-warning text-warning">
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
              <Button onClick={handleApprove}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve & Open
              </Button>
            )}

            {isPendingVerification && (
              <Button
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
                <Info label="Vehicle Number" value={ticket.vehicle_number} mono />
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
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Assigned Field Executive
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-semibold">
                    {assignedFE.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{assignedFE.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Assigned{" "}
                      {format(
                        new Date(
                          currentAssignment?.assigned_at ??
                            currentAssignment?.created_at
                        ),
                        "PPp"
                      )}
                    </p>
                  </div>
                  <Badge>{assignedFE.active ? "Active" : "Inactive"}</Badge>
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
                {comments?.map((c) => {
                  let a: FEAttachment | null = null;
                  try {
                    if (c.attachments) {
                      a =
                        typeof c.attachments === "string"
                          ? JSON.parse(c.attachments)
                          : c.attachments;
                    }
                  } catch {}

                  return (
                    <div key={c.id} className="border-l-2 pl-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline">{c.source}</Badge>
                        {format(new Date(c.created_at), "PPp")}
                      </div>
                      <p className="mt-1">{c.body}</p>

                      {a?.image_base64 && (
                        <img
                          src={a.image_base64}
                          className="mt-3 max-h-64 rounded border"
                        />
                      )}

                      {a?.remarks && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          <strong>Remarks:</strong> {a.remarks}
                        </p>
                      )}
                    </div>
                  );
                })}
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
                <ConfidenceScore score={ticket.confidence_score} size="lg" />
              </CardContent>
            </Card>

            {ticket.status === "ASSIGNED" && (
              <Button className="w-full" onClick={() => generateToken("ON_SITE")}>
                Generate On-Site Token
              </Button>
            )}

            {ticket.status === "ON_SITE" && (
              <Button
                className="w-full"
                onClick={() => generateToken("RESOLUTION")}
              >
                Generate Resolution Token
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* TOKEN MODAL */}
      {generatedToken && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-full max-w-md space-y-3">
            <h2 className="font-semibold">
              {tokenLabel === "ON_SITE"
                ? "On-Site Token"
                : "Resolution Token"}
            </h2>

            <input
              readOnly
              value={generatedToken}
              className="w-full border px-2 py-1 font-mono"
            />

            <input
              readOnly
              value={`${window.location.origin}/fe/action/${generatedToken}`}
              className="w-full border px-2 py-1 font-mono text-sm"
            />

            <Button onClick={() => setGeneratedToken(null)} variant="ghost">
              Close
            </Button>
          </div>
        </div>
      )}

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
        isPending={updateStatus.isPending}
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
