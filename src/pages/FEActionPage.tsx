import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

        console.log("🔍 Loading FE token:", tokenId);

        // 1️⃣ Load token
        const { data: tokenRow, error: tokenError } = await supabase
          .from("fe_action_tokens" as any)
          .select("*")
          .eq("id", tokenId)
          .eq("used", false)
          .gt("expires_at", new Date().toISOString())
          .single();

        if (tokenError || !tokenRow) {
          console.error("❌ TOKEN ERROR:", tokenError);
          toast({
            title: "Invalid or expired link",
            description: tokenError?.message,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        console.log("✅ Token loaded:", tokenRow);
        setToken(tokenRow);

        // 2️⃣ Load ticket
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
      toast({ title: "Please upload a photo" });
      return;
    }

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

      // Insert ticket comment
      const { error: commentError } = await supabase
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

      if (commentError) {
        console.error("❌ COMMENT ERROR:", commentError);
        throw new Error(commentError.message);
      }

      // Update ticket status
      const { error: statusError } = await supabase
        .from("tickets")
        .update({
          status:
            token.action_type === "ON_SITE"
              ? "ON_SITE"
              : "RESOLVED_PENDING_VERIFICATION",
        })
        .eq("id", ticket.id);

      if (statusError) {
        console.error("❌ STATUS ERROR:", statusError);
        throw new Error(statusError.message);
      }

      // Mark token as used
      const { error: tokenUpdateError } = await supabase
        .from("fe_action_tokens" as any)
        .update({ used: true })
        .eq("id", token.id);

      if (tokenUpdateError) {
        console.error("❌ TOKEN UPDATE ERROR:", tokenUpdateError);
        throw new Error(tokenUpdateError.message);
      }

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
    }
  };

  /* ================= UI ================= */
  if (loading) {
    return <div className="p-8 text-center">Loading…</div>;
  }

  if (!token || !ticket) {
    return <div className="p-8 text-center">Invalid or expired link</div>;
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
