/**
 * FEActionPage - TOKEN BASED (Backend Authoritative)
 *
 * RULES:
 * - NO direct Supabase lifecycle reads
 * - Backend validates token
 * - Backend controls state transitions
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
  // 🔥 FIX: param name must match router definition
  const { token } = useParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [context, setContext] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState("");

  /* ======================================================
     VALIDATE TOKEN (BACKEND ONLY)
  ====================================================== */
  useEffect(() => {
    let cancelled = false;

    const validate = async () => {
      try {
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/fe/action/${token}`);

        if (!res.ok) {
          if (!cancelled) setContext(null);
          return;
        }

        const data = await res.json();

        if (!cancelled) {
          setContext(data);
        }
      } catch (err) {
        console.error("[FEActionPage TOKEN ERROR]", err);
        if (!cancelled) setContext(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    validate();

    return () => {
      cancelled = true;
    };
  }, [token]);

  /* ======================================================
     SUBMIT PROOF
  ====================================================== */
  const handleSubmit = async () => {
    if (!file || !context || !token) {
      toast({
        title: "Please upload a photo",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const filePath = `tickets/${context.ticketId}/${context.actionType}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("Ticket_Uploads")
        .upload(filePath, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("Ticket_Uploads")
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error("Failed to generate image URL");
      }

      const res = await fetch(`${API_BASE}/fe/proof`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
          attachments: [
            {
              image_url: urlData.publicUrl,
              remarks,
              action_type: context.actionType,
            },
          ],
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

  if (!context) {
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {context.actionType === "ON_SITE"
              ? "On-Site Proof Upload"
              : "Resolution Proof Upload"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-sm space-y-1">
            <div>
              <strong>Ticket:</strong> {context.ticketNumber}
            </div>
            <div>
              <strong>Status:</strong> {context.ticketStatus}
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
