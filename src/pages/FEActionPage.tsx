/**
 * FEActionPage - Field Executive Action Page for Token-Based Ticket Access
 *
 * Uses fe_action_tokens for authentication (no login required).
 
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

  
  useEffect(() => {
    const load = async () => {
      try {
        if (!tokenId) {
          setLoading(false);
          return;
        }

        // 1️⃣ Load FE action token
        const { data: tokenRow, error: tokenError } = await (supabase as any)
          .from("fe_action_tokens")
          .select("*")
          .eq("id", tokenId)
          .eq("used", false)
          .gt("expires_at", new Date().toISOString())
          .maybeSingle();

        if (tokenError || !tokenRow) {
          toast({
            title: "Invalid or expired link",
            description: tokenError?.message || "Token not found or expired",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        setToken(tokenRow);

        // 2️⃣ Load ticket
        const { data: ticketRow, error: ticketError } = await supabase
          .from("tickets")
          .select("*")
          .eq("id", tokenRow.ticket_id)
          .single();

        if (ticketError || !ticketRow) {
          toast({
            title: "Ticket not found",
            description: ticketError?.message,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        setTicket(ticketRow);
        setLoading(false);
      } catch (err) {
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

  
  const handleSubmit = async () => {
    if (!file || !token || !ticket) {
      toast({ title: "Please upload a photo", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    try {
      const toBase64 = (file: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });

      const base64Image = await toBase64(file);

      const actionType = token.action_type;

      await supabase.from("ticket_comments").insert({
        ticket_id: ticket.id,
        source: "FE",
        body:
          actionType === "ON_SITE"
            ? "Field Executive uploaded on-site proof"
            : "Field Executive uploaded resolution proof",
        attachments: {
          image_base64: base64Image,
          remarks,
          action_type: actionType,
        },
      });

      const newStatus =
        actionType === "ON_SITE"
          ? "ON_SITE"
          : "RESOLVED_PENDING_VERIFICATION";

      await supabase
        .from("tickets")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ticket.id);

      // ✅ Mark FE action token as used
      await (supabase as any)
        .from("fe_action_tokens")
        .update({ used: true })
        .eq("id", token.id);

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
      toast({
        title: "Submission failed",
        description: err?.message || "Check console",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!token || !ticket) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">Invalid or expired link</p>
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
              You may close this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {token.action_type === "ON_SITE"
              ? "On-Site Proof Upload"
              : "Resolution Proof Upload"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-sm space-y-1">
            <div><strong>Ticket:</strong> {ticket.ticket_number}</div>
            <div><strong>Status:</strong> {ticket.status}</div>
          </div>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <textarea
            placeholder="Remarks (optional)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={submitting || !file}
          >
            {submitting ? "Submitting..." : "Submit Proof"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
*/
//the above version works so please revert back to it if the new one has issues. The new one has some code formatting changes and some comments added for clarity, but the core logic is the same.

/**
 * FEActionPage - Field Executive Action Page for Token-Based Ticket Access
 *
 * Uses fe_action_tokens for authentication (no login required).
 *//**
 * FEActionPage - Field Executive Action Page (TOKEN BASED)
 *
 * RULES:
 * - NO auth required
 * - NO direct ticket mutations
 * - Backend owns lifecycle + token usage
 */
/**
 * FEActionPage - Field Executive Action Page (TOKEN BASED)
 *
 * RULES:
 * - NO auth required
 * - NO direct ticket mutations
 * - Backend owns lifecycle + token usage
 */

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Upload, CheckCircle } from "lucide-react";

const API_BASE = import.meta.env.VITE_CRM_API_URL;

export default function FEActionPage() {
  const { tokenId } = useParams<{ tokenId: string }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [token, setToken] = useState<any>(null);
  const [ticket, setTicket] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState("");

  /* ======================================================
     LOAD TOKEN + TICKET (READ ONLY)
  ====================================================== */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        if (!tokenId) {
          setLoading(false);
          return;
        }

        /* 1️⃣ Load token (read-only) */
        const { data: tokenRow, error: tokenError } = await (supabase as any)
          .from("fe_action_tokens")
          .select("*")
          .eq("id", tokenId)
          .eq("used", false)
          .gt("expires_at", new Date().toISOString())
          .maybeSingle();

        if (cancelled) return;

        if (tokenError || !tokenRow) {
          toast({
            title: "Invalid or expired link",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        setToken(tokenRow);

        /* 2️⃣ Load ticket (read-only) */
        const { data: ticketRow, error: ticketError } = await supabase
          .from("tickets")
          .select("id, ticket_number, status")
          .eq("id", tokenRow.ticket_id)
          .single();

        if (cancelled) return;

        if (ticketError || !ticketRow) {
          toast({
            title: "Ticket not found",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        setTicket(ticketRow);
      } catch (err) {
        console.error("[FEActionPage LOAD ERROR]", err);
        toast({
          title: "Unexpected error",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [tokenId]);

  /* ======================================================
     SUBMIT PROOF
  ====================================================== */
  const handleSubmit = async () => {
    if (!file || !token || !ticket) {
      toast({
        title: "Please upload a photo",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      /* 1️⃣ Upload image to Supabase Storage */
      const filePath = `tickets/${ticket.id}/${token.action_type}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("Ticket_Uploads")
        .upload(filePath, file, { upsert: false });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from("Ticket_Uploads")
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error("Failed to generate image URL");
      }

      /* 2️⃣ Send proof to BACKEND (authoritative) */
      const endpoint =
        token.action_type === "ON_SITE"
          ? "/fe-proofs/onsite"
          : "/fe-proofs/resolution";

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenId: token.id,
          imageUrl: urlData.publicUrl,
          remarks,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Submission failed");
      }

      setSubmitted(true);
      toast({
        title: "Proof submitted successfully",
        description: "You may now close this page.",
      });
    } catch (err: any) {
      console.error("[FEActionPage SUBMIT ERROR]", err);
      toast({
        title: "Submission failed",
        description: err?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* ======================================================
     UI STATES
  ====================================================== */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!token || !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center text-destructive">
            Invalid or expired link
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-lg font-semibold">Proof Submitted</h2>
            <p className="text-muted-foreground">
              You may now close this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ======================================================
     MAIN UI
  ====================================================== */

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {token.action_type === "ON_SITE"
              ? "On-Site Proof Upload"
              : "Resolution Proof Upload"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-sm space-y-1">
            <div>
              <strong>Ticket:</strong> {ticket.ticket_number}
            </div>
            <div>
              <strong>Status:</strong> {ticket.status}
            </div>
          </div>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <textarea
            className="w-full rounded border p-2 text-sm"
            placeholder="Remarks (optional)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={submitting || !file}
          >
            {submitting ? "Submitting…" : "Submit Proof"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
