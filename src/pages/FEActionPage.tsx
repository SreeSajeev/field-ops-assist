/**
 * FEActionPage - Field Executive Action Page for Token-Based Ticket Access
 * 
 * This page allows Field Executives to submit proof for tickets using
 * the access_tokens table for authentication instead of requiring login.
 * 
 * Token flow:
 * 1. Service Staff generates an access token for a ticket
 * 2. FE receives a link with the token
 * 3. FE can upload proof and update ticket status
 */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Upload, CheckCircle } from "lucide-react";

export default function FEActionPage() {
  const { tokenId } = useParams<{ tokenId: string }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [token, setToken] = useState<any>(null);
  const [ticket, setTicket] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState("");

  /* ================= LOAD TOKEN + TICKET ================= */
  useEffect(() => {
    const load = async () => {
      try {
        if (!tokenId) {
          setLoading(false);
          return;
        }

        console.log("🔍 Loading FE access token:", tokenId);

        // 1️⃣ Load token from access_tokens table using token_hash
        const { data: tokenRow, error: tokenError } = await supabase
          .from("access_tokens")
          .select("*")
          .eq("token_hash", tokenId)
          .eq("revoked", false)
          .gt("expires_at", new Date().toISOString())
          .maybeSingle();

        if (tokenError || !tokenRow) {
          console.error("❌ TOKEN ERROR:", tokenError);
          toast({
            title: "Invalid or expired link",
            description: tokenError?.message || "Token not found or expired",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        console.log("✅ Token loaded:", tokenRow);
        setToken(tokenRow);

        // 2️⃣ Load ticket using the ticket_id from token
        const { data: ticketRow, error: ticketError } = await supabase
          .from("tickets")
          .select("*")
          .eq("id", tokenRow.ticket_id)
          .single();

        if (ticketError || !ticketRow) {
          console.error("❌ TICKET ERROR:", ticketError);
          toast({
            title: "Ticket not found",
            description: ticketError?.message,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        console.log("✅ Ticket loaded:", ticketRow);
        setTicket(ticketRow);
        setLoading(false);
      } catch (err) {
        console.error("🔥 LOAD FAILED:", err);
        toast({
          title: "Unexpected error",
          description: "Check console for details",
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    load();
  }, [tokenId]);

  /* ================= SUBMIT PROOF (BASE64) ================= */
  const handleSubmit = async () => {
    if (!file || !token || !ticket) {
      toast({ title: "Please upload a photo", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    try {
      console.log("🚀 Submitting proof (BASE64)");

      // Convert image to base64
      const toBase64 = (file: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });

      const base64Image = await toBase64(file);

      // Determine action type based on ticket status
      const actionType = ticket.status === 'ASSIGNED' ? 'ON_SITE' : 'RESOLUTION';

      // Insert ticket comment with proof
      const { error: commentError } = await supabase
        .from("ticket_comments")
        .insert({
          ticket_id: ticket.id,
          source: "FE",
          body: actionType === "ON_SITE"
            ? "Field Executive uploaded on-site proof"
            : "Field Executive uploaded resolution proof",
          attachments: {
            image_base64: base64Image,
            remarks,
            action_type: actionType,
          },
        });

      if (commentError) {
        console.error("❌ COMMENT ERROR:", commentError);
        throw new Error(commentError.message);
      }

      // Update ticket status based on current state
      const newStatus = actionType === "ON_SITE" ? "ON_SITE" : "RESOLVED_PENDING_VERIFICATION";
      
      const { error: statusError } = await supabase
        .from("tickets")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ticket.id);

      if (statusError) {
        console.error("❌ STATUS ERROR:", statusError);
        throw new Error(statusError.message);
      }

      // Mark token as revoked after use
      const { error: tokenUpdateError } = await supabase
        .from("access_tokens")
        .update({ revoked: true })
        .eq("id", token.id);

      if (tokenUpdateError) {
        console.error("❌ TOKEN UPDATE ERROR:", tokenUpdateError);
        // Don't throw - proof was submitted successfully
      }

      // Log the action
      await supabase.from("audit_logs").insert({
        entity_type: "ticket",
        entity_id: ticket.id,
        action: `fe_proof_submitted_${actionType.toLowerCase()}`,
        metadata: { 
          fe_id: token.fe_id,
          new_status: newStatus,
        },
      });

      setSubmitted(true);
      toast({
        title: "Proof submitted successfully",
        description: "You may now close this page.",
      });
    } catch (err: any) {
      console.error("🔥 SUBMISSION FAILED:", err);
      toast({
        title: "Submission failed",
        description: err?.message || "Check console",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= UI ================= */
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  if (!token || !ticket) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">Invalid or expired link</p>
            <p className="text-sm text-muted-foreground mt-2">
              This access link may have expired or already been used.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold">Proof Submitted</h2>
            <p className="text-muted-foreground">
              Your proof has been submitted successfully. You may close this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const actionType = ticket.status === 'ASSIGNED' ? 'ON_SITE' : 'RESOLUTION';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {actionType === "ON_SITE"
              ? "On-Site Proof Upload"
              : "Resolution Proof Upload"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-sm space-y-1">
            <div><strong>Ticket:</strong> {ticket.ticket_number}</div>
            <div><strong>Location:</strong> {ticket.location || 'Not specified'}</div>
            <div><strong>Status:</strong> {ticket.status}</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Upload Photo *</label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="w-full border rounded-md p-2 text-sm"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Remarks (optional)</label>
            <textarea
              className="w-full border rounded-md p-2 text-sm min-h-[80px]"
              placeholder="Add any notes about the visit..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <Button 
            className="w-full" 
            onClick={handleSubmit}
            disabled={submitting || !file}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Proof'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
