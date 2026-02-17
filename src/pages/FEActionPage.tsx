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

export default function FEActionPage() {
  const { tokenId } = useParams<{ tokenId: string }>();

  const [loading, setLoading] = useState(true);
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

        // 1️⃣ Load FE action token
        const { data: tokenRow, error: tokenError } = await (supabase as any)
          .from("fe_action_tokens")
          .select("*")
          .eq("id", tokenId)
          .eq("used", false)
          .gt("expires_at", new Date().toISOString())
          .single();

        if (tokenError || !tokenRow) {
          toast({
            title: "Invalid or expired link",
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
          variant: "destructive",
        });
        setLoading(false);
      }
    };

    load();
  }, [tokenId]);

  /* ================= SUBMIT PROOF ================= */
  const handleSubmit = async () => {
    if (!file || !token || !ticket) {
      toast({
        title: "Please upload a photo",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert image to base64
      const toBase64 = (file: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });

      const base64Image = await toBase64(file);

      // Insert comment
      const { error: commentError } = await supabase
        .from("ticket_comments")
        .insert({
          ticket_id: ticket.id,
          source: "FE",
          body:
            token.action_type === "ON_SITE"
              ? "On-site proof submitted"
              : "Resolution proof submitted",
          attachments: {
            image_base64: base64Image,
            remarks,
            action_type: token.action_type,
          },
        });

      if (commentError) {
        throw commentError;
      }

      // Update ticket status
      const newStatus =
        token.action_type === "ON_SITE"
          ? "ON_SITE"
          : "RESOLVED_PENDING_VERIFICATION";

      const { error: statusError } = await supabase
        .from("tickets")
        .update({ status: newStatus })
        .eq("id", ticket.id);

      if (statusError) {
        throw statusError;
      }

      // Mark token as used
      await (supabase as any)
        .from("fe_action_tokens")
        .update({ used: true })
        .eq("id", token.id);

      toast({
        title: "Proof submitted successfully",
      });

      window.location.reload();
    } catch (err: any) {
      toast({
        title: "Submission failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  /* ================= UI ================= */
  if (loading) return <div className="p-6">Loading…</div>;

  if (!token || !ticket)
    return <div className="p-6">Invalid or expired link</div>;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {token.action_type === "ON_SITE"
              ? "On-Site Proof Upload"
              : "Resolution Proof Upload"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-sm font-medium">
            Ticket: {ticket.ticket_number}
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <textarea
            className="w-full rounded border p-2 text-sm"
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
