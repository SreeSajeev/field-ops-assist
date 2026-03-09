import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_CRM_API_URL ?? "http://localhost:3000";

export default function FEActionPage() {
  const { tokenId } = useParams<{ tokenId: string }>();

  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [token, setToken] = useState<any>(null);
  const [ticket, setTicket] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState("");
  const [resolutionOutcome, setResolutionOutcome] = useState<"SUCCESS" | "FAILED">("SUCCESS");
  const [failureReason, setFailureReason] = useState("");
  const [submitPending, setSubmitPending] = useState(false);

  /* ================= LOAD TOKEN + TICKET ================= */
  useEffect(() => {
    const load = async () => {
      if (!tokenId) {
        setLoading(false);
        return;
      }

      try {
        setLoadError(null);
        // 🔥 Force ANY to avoid TS relational inference crash
        const { data: tokenRow, error: tokenError } = await (supabase as any)
          .from("fe_action_tokens")
          .select("*")
          .eq("id", tokenId)
          .eq("used", false)
          .gt("expires_at", new Date().toISOString())
          .single();

        if (tokenError || !tokenRow) {
          console.error("TOKEN ERROR:", tokenError);
          setLoadError("Invalid or expired link");
          setLoading(false);
          return;
        }

        setToken(tokenRow);

        const { data: ticketRow, error: ticketError } = await (supabase as any)
          .from("tickets")
          .select("*")
          .eq("id", tokenRow.ticket_id)
          .single();

        if (ticketError || !ticketRow) {
          console.error("TICKET ERROR:", ticketError);
          setLoadError("Unable to load ticket details.\nPlease contact the support team.");
          setLoading(false);
          return;
        }

        setTicket(ticketRow);
      } catch (err) {
        console.error("LOAD FAILED:", err);
        setLoadError("Unable to load ticket details.\nPlease contact the support team.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [tokenId]);

  const toBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  /* ================= SUBMIT PROOF ================= */
  const handleSubmit = async () => {
    if (!token || !ticket) {
      toast({ title: "Missing token or ticket" });
      return;
    }

    const isResolution = token.action_type === "RESOLUTION";

    if (isResolution) {
      if (resolutionOutcome === "FAILED") {
        if (!failureReason.trim()) {
          toast({ title: "Please provide a reason for failure", variant: "destructive" });
          return;
        }
      } else {
        if (!file) {
          toast({ title: "Please upload a photo for resolution proof" });
          return;
        }
      }
    } else {
      if (!file) {
        toast({ title: "Please upload a photo" });
        return;
      }
    }

    setSubmitPending(true);
    try {
      if (isResolution) {
        const body: Record<string, unknown> = {
          token: token.id,
          outcome: resolutionOutcome,
        };
        if (resolutionOutcome === "FAILED") {
          body.failure_reason = failureReason.trim();
        } else {
          const base64Image = await toBase64(file!);
          body.attachments = { image_base64: base64Image, remarks, action_type: "RESOLUTION" };
        }
        const res = await fetch(`${API_BASE}/fe/proof`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data?.error ?? "Submission failed");
        }
        setSubmitted(true);
        toast({
          title: resolutionOutcome === "FAILED" ? "Failed attempt recorded" : "Proof submitted successfully",
          description: "You may now close this page.",
        });
        return;
      }

      /* ON_SITE: existing Supabase flow */
      const base64Image = await toBase64(file!);
      const { error: commentError } = await (supabase as any)
        .from("ticket_comments")
        .insert({
          ticket_id: ticket.id,
          source: "FE",
          body: "Field Executive uploaded on-site proof",
          attachments: {
            image_base64: base64Image,
            remarks,
            action_type: token.action_type,
          },
        });

      if (commentError) throw commentError;

      const { error: statusError } = await (supabase as any)
        .from("tickets")
        .update({ status: "ON_SITE" })
        .eq("id", ticket.id);

      if (statusError) throw statusError;

      await (supabase as any)
        .from("fe_action_tokens")
        .update({ used: true })
        .eq("id", token.id);

      setSubmitted(true);
      toast({
        title: "Proof submitted successfully",
        description: "You may now close this page.",
      });
    } catch (err: any) {
      console.error("SUBMIT FAILED:", err);
      toast({
        title: "Submission failed",
        description: err?.message,
        variant: "destructive",
      });
    } finally {
      setSubmitPending(false);
    }
  };

  /* ================= UI ================= */

  if (loading) {
    return <div className="p-8 text-center">Loading…</div>;
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Unable to load</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {String(loadError)
              .split("\n")
              .map((line, idx) => (
                <p key={idx} className="text-sm text-muted-foreground">
                  {line}
                </p>
              ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid or expired link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please request a new link from the support team.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 text-center">
          <h2 className="text-lg font-semibold text-green-600">
            Proof Submitted
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            You may close this page.
          </p>
        </Card>
      </div>
    );
  }

  const isResolution = token.action_type === "RESOLUTION";
  const issueDescription =
    (ticket.remarks && String(ticket.remarks).trim()) ||
    (ticket.short_description && String(ticket.short_description).trim()) ||
    (ticket.description && String(ticket.description).trim()) ||
    "";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {isResolution ? "Resolution Proof Upload" : "On-Site Proof Upload"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* ================= Ticket Details ================= */}
          <div className="rounded-lg border bg-white p-4 shadow-sm space-y-4">
            <div className="space-y-0.5">
              <div className="text-xs text-muted-foreground">Ticket Details</div>
              <div className="text-base font-semibold">
                Ticket {ticket.ticket_number ?? "N/A"}
              </div>
            </div>

            <div className="space-y-3">
              {ticket.vehicle_number && (
                <div className="space-y-0.5">
                  <div className="text-xs text-muted-foreground">Vehicle</div>
                  <div className="text-sm font-medium">{ticket.vehicle_number}</div>
                </div>
              )}
              {ticket.category && (
                <div className="space-y-0.5">
                  <div className="text-xs text-muted-foreground">Category</div>
                  <div className="text-sm font-medium">{ticket.category}</div>
                </div>
              )}
              {ticket.issue_type && (
                <div className="space-y-0.5">
                  <div className="text-xs text-muted-foreground">Issue Type</div>
                  <div className="text-sm font-medium">{ticket.issue_type}</div>
                </div>
              )}
              {ticket.location && (
                <div className="space-y-0.5">
                  <div className="text-xs text-muted-foreground">Location</div>
                  <div className="text-sm font-medium">{ticket.location}</div>
                </div>
              )}
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="space-y-0.5">
                <div className="text-xs text-muted-foreground">Issue Description</div>
                <div className="text-sm font-medium whitespace-pre-wrap">
                  {issueDescription || "No issue description provided."}
                </div>
              </div>

              {(ticket.opened_by_email || ticket.contact_number) && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Reported By</div>
                  {ticket.opened_by_email && (
                    <div className="text-sm font-medium break-words">{ticket.opened_by_email}</div>
                  )}
                  {ticket.contact_number && (
                    <div className="text-sm font-medium">Contact: {ticket.contact_number}</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* ================= Proof Upload ================= */}
          <div className="rounded-lg border bg-white p-4 shadow-sm space-y-4">
            <div className="space-y-0.5">
              <div className="text-xs text-muted-foreground">
                Upload {isResolution ? "Resolution" : "On-Site"} Proof
              </div>
              <div className="text-sm font-medium">
                {isResolution ? "Resolution proof upload" : "On-site proof upload"}
              </div>
            </div>

          {isResolution && (
            <>
              <div className="space-y-2">
                <Label>Outcome</Label>
                <RadioGroup
                  value={resolutionOutcome}
                  onValueChange={(v) => setResolutionOutcome(v as "SUCCESS" | "FAILED")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="SUCCESS" id="outcome-success" />
                    <Label htmlFor="outcome-success" className="font-normal cursor-pointer">Success (issue resolved)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="FAILED" id="outcome-failed" />
                    <Label htmlFor="outcome-failed" className="font-normal cursor-pointer">Failed (could not resolve)</Label>
                  </div>
                </RadioGroup>
              </div>
              {resolutionOutcome === "FAILED" && (
                <div className="space-y-2">
                  <Label htmlFor="failure-reason">Reason for failure *</Label>
                  <textarea
                    id="failure-reason"
                    className="w-full border rounded p-2 text-sm min-h-[80px]"
                    placeholder="Required: explain why the issue could not be resolved"
                    value={failureReason}
                    onChange={(e) => setFailureReason(e.target.value)}
                  />
                </div>
              )}
            </>
          )}

          {(!isResolution || resolutionOutcome === "SUCCESS") && (
            <>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <textarea
                className="w-full border rounded p-2 text-sm"
                placeholder={isResolution ? "Optional remarks" : "Optional remarks"}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </>
          )}

          <Button className="w-full" onClick={handleSubmit} disabled={submitPending}>
            {submitPending ? "Submitting…" : isResolution && resolutionOutcome === "FAILED" ? "Report Failed Attempt" : "Submit Proof"}
          </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
