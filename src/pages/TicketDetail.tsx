//works
import { useState } from "react";
import { useParams, Link, useNavigate, Navigate } from "react-router-dom";
import { formatIST } from "@/lib/dateUtils";
import {
  ArrowLeft,
  MapPin,
  Truck,
  Mail,
  CheckCircle,
  User,
  Clock,
  Image as ImageIcon,
  Star,
} from "lucide-react";

import { AppLayoutNew } from "@/components/layout/AppLayoutNew";
import { PageContainer } from "@/components/layout/PageContainer";
import { StatusBadge } from "@/components/tickets/StatusBadge";
import { ConfidenceScore } from "@/components/tickets/ConfidenceScore";
import { getDisplayConfidenceScore } from "@/lib/confidence";
import { FEAssignmentModal } from "@/components/tickets/FEAssignmentModal";
import { CloseTicketDialog } from "@/components/tickets/CloseTicketDialog";
import { generateFEActionToken } from "@/lib/feToken";


import {
  useTicket,
  useTicketComments,
  useTicketAssignments,
  useUpdateTicketStatus,
  useUpdateTicket,
} from "@/hooks/useTickets";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { TicketStatus } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export default function TicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const { data: ticket, isLoading } = useTicket(ticketId ?? "");
  const { data: comments } = useTicketComments(ticketId ?? "");
  const { data: assignments } = useTicketAssignments(ticketId ?? "");
  const updateStatus = useUpdateTicketStatus();
  const updateTicket = useUpdateTicket();

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closePending, setClosePending] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [tokenLabel, setTokenLabel] = useState<"ON_SITE" | "RESOLUTION">("ON_SITE");

  if (isLoading) {
    return (
      <AppLayoutNew>
        <PageContainer>
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            Loading ticket…
          </div>
        </PageContainer>
      </AppLayoutNew>
    );
  }

  if (!ticket) {
    return (
      <AppLayoutNew>
        <PageContainer>
          <div className="space-y-2 text-center">
            <h2 className="text-xl font-semibold">Ticket not found</h2>
            <Link to="/app/tickets" className="text-primary hover:underline">
              Back to tickets
            </Link>
          </div>
        </PageContainer>
      </AppLayoutNew>
    );
  }

  if (userProfile?.role === "CLIENT" && ticket.client_slug !== userProfile.client_slug) {
    return <Navigate to="/app/client" replace />;
  }

  const currentAssignment = assignments?.[0];
  const assignedFE = currentAssignment?.field_executives;

  const isPendingVerification =
    ticket.status === "RESOLVED_PENDING_VERIFICATION";

  const isResolved = ticket.status === "RESOLVED";

  /* ================= ACTION HANDLERS ================= */

  const handleApprove = () => {
    if (ticket.status === "NEEDS_REVIEW") {
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


  const handleClose = async (verificationRemarks: string, resolutionCategory: string) => {
    setClosePending(true);
    const apiBase =
      import.meta.env.VITE_CRM_API_URL ?? "http://localhost:3000";
    try {
      const res = await fetch(
        `${apiBase}/tickets/${ticket.id}/close`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            verification_remarks:
              verificationRemarks != null && String(verificationRemarks).trim() !== ""
                ? String(verificationRemarks).trim()
                : null,
            resolution_category:
              resolutionCategory != null && String(resolutionCategory).trim() !== ""
                ? String(resolutionCategory).trim()
                : undefined,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Close failed");
      }
      setCloseDialogOpen(false);
      toast({
        title: "Ticket Closed",
        description: `Ticket ${ticket.ticket_number} verified and closed.`,
      });
      window.location.reload();
    } catch (err) {
      toast({
        title: "Close failed",
        description:
          err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setClosePending(false);
    }
  };



  /* ================= UI ================= */

  return (
    <AppLayoutNew>
      <PageContainer>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/app")} aria-label="Back to dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold font-mono">
                  {ticket.ticket_number}
                </h1>
                <StatusBadge status={ticket.status} />
                {ticket.priority === true && (
                  <Badge variant="outline" className="border-yellow-500 bg-yellow-500/15 text-yellow-800 font-semibold ring-2 ring-yellow-300/60 shadow-sm">
                    <Star className="mr-1 h-3.5 w-3.5 fill-yellow-500 text-yellow-500 shrink-0" aria-hidden />
                    Priority
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                Opened {formatIST(ticket.opened_at, "PPpp")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(ticket.status === "OPEN" || ticket.status === "FE_ATTEMPT_FAILED") && (
              <Button onClick={() => setAssignModalOpen(true)}>
                <User className="mr-2 h-4 w-4" />
                Assign Field Executive
              </Button>
            )}
            {ticket.status === "NEEDS_REVIEW" && (
              <Button onClick={handleApprove}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve & Open
              </Button>
            )}

            {isPendingVerification && (
              <Button
                onClick={() => setCloseDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700"
                disabled={closePending}
              >
                {closePending ? "Closing…" : "Verify & Close"}
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
            {/* Attempt Failed: show when FE reported resolution failed */}
            {ticket.status === "FE_ATTEMPT_FAILED" && currentAssignment && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-800">
                    <Truck className="h-5 w-5" />
                    Attempt Failed
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-amber-800">
                    <strong>Reason:</strong> {(currentAssignment as { failure_reason?: string | null }).failure_reason ?? "—"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Attempt count: {assignments?.length ?? 0}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Assignment */}
            {currentAssignment && assignedFE && ticket.status !== "FE_ATTEMPT_FAILED" && (
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
                      {formatIST(
                        currentAssignment.assigned_at ||
                          currentAssignment.created_at,
                        "PPp"
                      )}
                    </p>
                  </div>
                  <Badge>{assignedFE.active ? "Active" : "Inactive"}</Badge>
                </CardContent>
              </Card>
            )}

            {(ticket.status === "OPEN" || ticket.status === "FE_ATTEMPT_FAILED") && (
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
                  const a = c.attachments as any;
                  return (
                    <div key={c.id} className="border-l-2 pl-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline">{c.source}</Badge>
                        {formatIST(c.created_at, "PPp")}
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
                <CardTitle className="flex items-center gap-2 font-semibold">
                  <span className="inline-flex rounded-full ring-2 ring-yellow-300/60 p-0.5" aria-hidden>
                    <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                  </span>
                  Priority
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {ticket.priority === true ? "Marked as priority" : "Normal"}
                </span>
                <Switch
                  checked={ticket.priority === true}
                  onCheckedChange={(checked) => {
                    updateTicket.mutate(
                      { ticketId: ticket.id, updates: { priority: checked } },
                      {
                        onError: (err) =>
                          toast({
                            title: "Failed to update priority",
                            description: err.message,
                            variant: "destructive",
                          }),
                      }
                    );
                  }}
                  disabled={updateTicket.isPending}
                  aria-label="Toggle priority"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Parsing Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <ConfidenceScore score={getDisplayConfidenceScore(ticket)} size="lg" />
              </CardContent>
            </Card>

            {ticket.status === "ON_SITE" && (
              <Button onClick={() => generateToken("RESOLUTION")} className="w-full">
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
              {tokenLabel === "ON_SITE" ? "On-Site Token" : "Resolution Token"}
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
        onConfirm={handleClose}
        isPending={closePending}
      />
    </PageContainer>
    </AppLayoutNew>
  );
}

/* ===== Helpers ===== */
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
