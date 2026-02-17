/**
 * FEActionPage - Backend Validated
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

/* 🔥 HARD CODE FOR DEMO (NO ENV ISSUES) */
const API_BASE = "https://pariskq-crm-backend.onrender.com";

export default function FEActionPage() {
  const { token } = useParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [context, setContext] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState("");

  /* ======================================================
     1️⃣ VALIDATE TOKEN WITH BACKEND
  ====================================================== */
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const validate = async () => {
      try {
        const res = await fetch(`${API_BASE}/fe/action/${token}`);

        if (!res.ok) {
          throw new Error("Invalid token");
        }

        const data = await res.json();
        setContext(data);
      } catch (err) {
        console.error("[FEActionPage] token validation failed:", err);
        setContext(null);
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, [token]);

  /* ======================================================
     2️⃣ SUBMIT PROOF
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
          token,
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
