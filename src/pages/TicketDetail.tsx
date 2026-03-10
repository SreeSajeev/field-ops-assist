//works
import { useState, useRef, useEffect } from "react";
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
  ClipboardCheck,
  FileText,
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
import { useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TicketStatus } from "@/lib/types";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ReviewCompleteSchema, formatZodError } from "@/lib/validation";
import { z } from "zod";

export default function TicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const isClient = userProfile?.role === "CLIENT";

  const queryClient = useQueryClient();
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

  const canCompleteReview =
    Boolean(ticket?.needs_review) &&
    (userProfile?.role === "ADMIN" ||
      userProfile?.role === "STAFF" ||
      userProfile?.role === "SUPER_ADMIN");

  const [reviewCategory, setReviewCategory] = useState("");
  const [reviewIssueType, setReviewIssueType] = useState("");
  const [reviewVehicleNumber, setReviewVehicleNumber] = useState("");
  const [reviewLocation, setReviewLocation] = useState("");
  const [reviewPriority, setReviewPriority] = useState(false);
  const [reviewErrors, setReviewErrors] = useState<Record<string, string>>({});
  const reviewFormSynced = useRef(false);
  useEffect(() => {
    if (ticket && canCompleteReview) {
      if (!reviewFormSynced.current) {
        reviewFormSynced.current = true;
        setReviewCategory(ticket.category ?? "");
        setReviewIssueType(ticket.issue_type ?? "");
        setReviewVehicleNumber(ticket.vehicle_number ?? "");
        setReviewLocation(ticket.location ?? "");
        setReviewPriority(ticket.priority === true);
      }
    } else {
      reviewFormSynced.current = false;
    }
  }, [ticket?.id, canCompleteReview, ticket?.category, ticket?.issue_type, ticket?.vehicle_number, ticket?.location, ticket?.priority]);

  if (isLoading) {
    const content = (
      <PageContainer>
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          Loading ticket…
        </div>
      </PageContainer>
    );
    return isClient ? content : <AppLayoutNew>{content}</AppLayoutNew>;
  }

  if (!ticket) {
    const content = (
      <PageContainer>
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-semibold">Ticket not found</h2>
          <Link to={isClient ? "/app/client" : "/app/tickets"} className="text-primary hover:underline">
            Back to {isClient ? "dashboard" : "tickets"}
          </Link>
        </div>
      </PageContainer>
    );
    return isClient ? content : <AppLayoutNew>{content}</AppLayoutNew>;
  }

  if (userProfile?.role === "CLIENT" && ticket.client_slug !== userProfile.client_slug) {
    return <Navigate to="/app/client" replace />;
  }
  if (
    userProfile?.role !== "SUPER_ADMIN" &&
    userProfile?.organisation_id &&
    ticket.organisation_id &&
    ticket.organisation_id !== userProfile.organisation_id
  ) {
    return <Navigate to="/app/tickets" replace />;
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

    const apiBase = import.meta.env.VITE_CRM_API_URL ?? "http://localhost:3000";

    try {
      if (type === "RESOLUTION") {
        // Use backend so resolution token is created + email + SMS sent (same as on-site at assign)
        const res = await fetch(`${apiBase}/tickets/${ticket.id}/on-site-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "Resolution token failed");
        setTokenLabel("RESOLUTION");
        setGeneratedToken(data.resolutionToken ?? data.resolution_token ?? null);
        queryClient.invalidateQueries({ queryKey: ["ticket", ticket.id] });
        queryClient.invalidateQueries({ queryKey: ["ticket-assignments", ticket.id] });
        queryClient.invalidateQueries({ queryKey: ["tickets"] });
        toast({ title: "Resolution token generated; email and SMS sent to FE" });
        return;
      }

      const result = await generateFEActionToken({
        ticketId: ticket.id,
        feId: currentAssignment.fe_id,
        actionType: type,
      });
      setTokenLabel(type);
      setGeneratedToken(result.tokenId);
    } catch (err) {
      toast({
        title: "Token generation failed",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    }
  };


  const handleCompleteReview = () => {
    if (!ticket) return;
    setReviewErrors({});
    const payload = {
      category: reviewCategory.trim(),
      issue_type: reviewIssueType.trim(),
      location: reviewLocation.trim(),
      vehicle_number: reviewVehicleNumber.trim() || null,
      priority: reviewPriority,
    };
    const result = ReviewCompleteSchema.safeParse(payload);
    if (!result.success) {
      const err = result.error as z.ZodError;
      const next: Record<string, string> = {};
      err.errors.forEach((e) => {
        const path = e.path[0] as string;
        if (path && e.message) next[path] = e.message;
      });
      setReviewErrors(next);
      toast({
        title: "Validation failed",
        description: formatZodError(err),
        variant: "destructive",
      });
      return;
    }
    updateTicket.mutate(
      {
        ticketId: ticket.id,
        updates: {
          category: result.data.category,
          issue_type: result.data.issue_type,
          location: result.data.location,
          vehicle_number: result.data.vehicle_number ?? null,
          priority: result.data.priority ?? false,
          needs_review: false,
          confidence_score: 100,
        },
      },
      {
        onError: (err) =>
          toast({
            title: "Update failed",
            description: err.message,
            variant: "destructive",
          }),
      }
    );
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

  const backTo = isClient ? "/app/client" : "/app";
  const detailContent = (
    <PageContainer>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(backTo)} aria-label="Back to dashboard">
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* LEFT */}
          <div className="md:col-span-2 space-y-6">
            {/* DETAILS */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Ticket Details</CardTitle>
                {canCompleteReview && (
                  <Button
                    onClick={handleCompleteReview}
                    disabled={updateTicket.isPending}
                  >
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    Complete Review
                  </Button>
                )}
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Info label="Complaint ID" value={ticket.complaint_id} />
                {canCompleteReview ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="review-vehicle">Vehicle Number</Label>
                      <Input
                        id="review-vehicle"
                        value={reviewVehicleNumber}
                        onChange={(e) => setReviewVehicleNumber(e.target.value)}
                        className={reviewErrors.vehicle_number ? "border-destructive" : ""}
                      />
                      {reviewErrors.vehicle_number && (
                        <p className="text-xs text-destructive">{reviewErrors.vehicle_number}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="review-category">Category *</Label>
                      <Input
                        id="review-category"
                        value={reviewCategory}
                        onChange={(e) => setReviewCategory(e.target.value)}
                        className={reviewErrors.category ? "border-destructive" : ""}
                      />
                      {reviewErrors.category && (
                        <p className="text-xs text-destructive">{reviewErrors.category}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="review-issue-type">Issue Type *</Label>
                      <Input
                        id="review-issue-type"
                        value={reviewIssueType}
                        onChange={(e) => setReviewIssueType(e.target.value)}
                        className={reviewErrors.issue_type ? "border-destructive" : ""}
                      />
                      {reviewErrors.issue_type && (
                        <p className="text-xs text-destructive">{reviewErrors.issue_type}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="review-location">Location *</Label>
                      <Input
                        id="review-location"
                        value={reviewLocation}
                        onChange={(e) => setReviewLocation(e.target.value)}
                        className={reviewErrors.location ? "border-destructive" : ""}
                      />
                      {reviewErrors.location && (
                        <p className="text-xs text-destructive">{reviewErrors.location}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <Switch
                        id="review-priority"
                        checked={reviewPriority}
                        onCheckedChange={setReviewPriority}
                      />
                      <Label htmlFor="review-priority">Priority</Label>
                    </div>
                    {ticket.short_description && (
                      <div className="sm:col-span-2 flex items-start gap-2">
                        <FileText className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-sm text-muted-foreground">Details</p>
                          <p className="font-medium whitespace-pre-wrap break-words text-sm">{ticket.short_description}</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <Info label="Vehicle Number" value={ticket.vehicle_number} mono />
                    <Info label="Category" value={ticket.category} />
                    <Info label="Issue Type" value={ticket.issue_type} />
                    <IconInfo icon={MapPin} label="Location" value={ticket.location} />
                    {ticket.short_description && (
                      <div className="sm:col-span-2 flex items-start gap-2">
                        <FileText className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-sm text-muted-foreground">Details</p>
                          <p className="font-medium whitespace-pre-wrap break-words">{ticket.short_description}</p>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {!canCompleteReview && (
                  <IconInfo icon={Mail} label="Reported By" value={ticket.opened_by_email} />
                )}
                {canCompleteReview && (
                  <div className="sm:col-span-2">
                    <IconInfo icon={Mail} label="Reported By" value={ticket.opened_by_email} />
                  </div>
                )}
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
          <div className="bg-white p-6 rounded w-full max-w-md max-h-[90vh] overflow-y-auto space-y-3">
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
  );
  return isClient ? detailContent : <AppLayoutNew>{detailContent}</AppLayoutNew>;
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
