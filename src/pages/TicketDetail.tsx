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
  Clock,
  Image as ImageIcon,
} from "lucide-react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/tickets/StatusBadge";
import { ConfidenceScore } from "@/components/tickets/ConfidenceScore";
import { FEAssignmentModal } from "@/components/tickets/FEAssignmentModal";
import { CloseTicketDialog } from "@/components/tickets/CloseTicketDialog";
import { generateFEToken } from "@/lib/feToken";

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

  const { data: ticket, isLoading } = useTicket(ticketId ?? "");
  const { data: comments } = useTicketComments(ticketId ?? "");
  const { data: assignments } = useTicketAssignments(ticketId ?? "");
  const updateStatus = useUpdateTicketStatus();

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

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

  const currentAssignment = assignments?.[0];
  const assignedFE = currentAssignment?.field_executives;

  const isPendingVerification =
    ticket.status === "RESOLVED_PENDING_VERIFICATION";

  const canCloseTicket = ["ON_SITE", "RESOLVED_PENDING_VERIFICATION"].includes(
    ticket.status
  );

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

  const handleGenerateOnSiteToken = async () => {
    if (!ticket || !currentAssignment) return;

    try {
      const token = await generateFEToken(
        ticket.id,
        currentAssignment.fe_id,
        "ON_SITE"
      );
      setGeneratedToken(token.id);
    } catch (error) {
      console.error(error);
      toast({
        title: "Token generation failed",
        description: "Could not generate on-site token.",
        variant: "destructive",
      });
    }
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

            {canCloseTicket && !isPendingVerification && !isResolved && (
              <Button
                variant="outline"
                className="border-green-500 text-green-600"
                onClick={() => setCloseDialogOpen(true)}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Close Ticket
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

        {isPendingVerification && (
          <Alert className="border-amber-500/50 bg-amber-50">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                <strong>Pending Verification:</strong> FE marked work complete.
              </span>
              <Button
                onClick={handleVerifyAndClose}
                className="ml-4 bg-green-600 hover:bg-green-700"
              >
                Verify & Close
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Details */}
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
            {/* Assignment */}
            {currentAssignment && assignedFE && (
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
                          currentAssignment.assigned_at ||
                            currentAssignment.created_at
                        ),
                        "PPp"
                      )}
                    </p>
                  </div>
                  <Badge>{assignedFE.active ? "Active" : "Inactive"}</Badge>
                </CardContent>
              </Card>
            )}
        </div>
                        {/* Activity */}
            {/* Activity */}
<Card>
  <CardHeader>
    <CardTitle>Activity Timeline</CardTitle>
  </CardHeader>

  <CardContent className="space-y-4">
    {comments?.length ? (
      comments.map((c) => {
        const attachments = c.attachments as any;

        return (
          <div key={c.id} className="border-l-2 pl-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">{c.source}</Badge>
              {format(new Date(c.created_at), "PPp")}
            </div>

            <p className="mt-1 whitespace-pre-wrap">{c.body}</p>

            {/* ✅ BASE64 IMAGE RENDER */}
            {attachments?.image_base64 && (
              <div className="mt-3">
                <img
                  src={attachments.image_base64}
                  alt="Proof"
                  className="max-h-64 rounded border"
                />
              </div>
            )}

            {/* Fallback */}
            {!attachments?.image_base64 && attachments && (
              <div className="mt-2 flex items-center gap-2 text-sm text-primary">
                <ImageIcon className="h-4 w-4" />
                Proof attached
              </div>
            )}
          </div>
        );
      })
    ) : (
      <p className="text-muted-foreground text-center">No activity yet</p>
    )}
  </CardContent>
</Card>



          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Parsing Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <ConfidenceScore score={ticket.confidence_score} size="lg" />
              </CardContent>
            </Card>

            {ticket.status === "OPEN" && (
              <Card>
                <CardHeader>
                  <CardTitle>Assign Field Executive</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={() => setAssignModalOpen(true)}>
                    <User className="mr-2 h-4 w-4" />
                    Assign
                  </Button>
                </CardContent>
              </Card>
            )}

            {ticket.status === "ASSIGNED" && (
              <Card>
                <CardHeader>
                  <CardTitle>Field Executive Action</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={handleGenerateOnSiteToken}>
                    Generate On-Site Token
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Token Modal */}
      {generatedToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold">On-Site Token Generated</h2>

            <div className="flex gap-2">
              <input
                readOnly
                value={generatedToken}
                className="flex-1 border rounded px-2 py-1 font-mono text-sm"
              />
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(generatedToken);
                  toast({ title: "Copied to clipboard" });
                }}
              >
                Copy
              </Button>
            </div>

            <input
              readOnly
              value={`${window.location.origin}/fe/action/${generatedToken}`}
              className="w-full border rounded px-2 py-1 font-mono text-sm"
            />

            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setGeneratedToken(null)}>
                Close
              </Button>
            </div>
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
