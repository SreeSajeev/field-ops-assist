import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export default function FEActionPage() {
  const { tokenId } = useParams<{ tokenId: string }>();

  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [token, setToken] = useState<any>(null);
  const [ticket, setTicket] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState("");

  /* ================= LOAD TOKEN + TICKET ================= */
  useEffect(() => {
    const load = async () => {
      if (!tokenId) {
        setLoading(false);
        return;
      }

      try {
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
          setLoading(false);
          return;
        }

        setTicket(ticketRow);
      } catch (err) {
        console.error("LOAD FAILED:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [tokenId]);

  /* ================= SUBMIT PROOF (BASE64) ================= */
  const handleSubmit = async () => {
    if (!file || !token || !ticket) {
      toast({ title: "Please upload a photo" });
      return;
    }

    try {
      // Convert file to base64
      const toBase64 = (file: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });

      const base64Image = await toBase64(file);

      // 1️⃣ Insert comment
      const { error: commentError } = await (supabase as any)
        .from("ticket_comments")
        .insert({
          ticket_id: ticket.id,
          source: "FE",
          body:
            token.action_type === "ON_SITE"
              ? "Field Executive uploaded on-site proof"
              : "Field Executive uploaded resolution proof",
          attachments: {
            image_base64: base64Image,
            remarks,
            action_type: token.action_type,
          },
        });

      if (commentError) throw commentError;

      // 2️⃣ Update status
      const newStatus =
        token.action_type === "ON_SITE"
          ? "ON_SITE"
          : "RESOLVED_PENDING_VERIFICATION";

      const { error: statusError } = await (supabase as any)
        .from("tickets")
        .update({ status: newStatus })
        .eq("id", ticket.id);

      if (statusError) throw statusError;

      // 3️⃣ Mark token used
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
    }
  };

  /* ================= UI ================= */

  if (loading) {
    return <div className="p-8 text-center">Loading…</div>;
  }

  if (!token || !ticket) {
    return <div className="p-8 text-center">Invalid or expired link</div>;
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {token.action_type === "ON_SITE"
              ? "On-Site Proof Upload"
              : "Resolution Proof Upload"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-sm">
            <strong>Ticket:</strong> {ticket.ticket_number}
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <textarea
            className="w-full border rounded p-2 text-sm"
            placeholder="Optional remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />

          <Button className="w-full" onClick={handleSubmit}>
            Submit Proof
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
