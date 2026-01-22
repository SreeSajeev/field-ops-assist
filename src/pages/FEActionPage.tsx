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
      if (!tokenId) {
        setLoading(false);
        return;
      }

      // ---- Fetch token (UNSAFE TABLE, bypass types) ----
      const tokenResult = await supabase
        .from("fe_action_tokens" as any)
        .select("*")
        .eq("id", tokenId)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (tokenResult.error || !tokenResult.data) {
        toast({
          title: "Invalid or expired link",
          description: "Please contact service staff.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // 🔑 CRITICAL: break TS inference chain
      const tokenRow = tokenResult.data as unknown as any;
      setToken(tokenRow);

      // ---- Fetch ticket using token.ticket_id ----
      const ticketResult = await supabase
        .from("tickets")
        .select("*")
        .eq("id", tokenRow.ticket_id)
        .single();

      if (ticketResult.error || !ticketResult.data) {
        toast({
          title: "Ticket not found",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setTicket(ticketResult.data);
      setLoading(false);
    };

    load();
  }, [tokenId]);

  /* ================= SUBMIT PROOF ================= */
  const handleSubmit = async () => {
    if (!file || !token || !ticket) {
      toast({ title: "Please upload a photo" });
      return;
    }

    try {
      const filePath = `${ticket.id}/${token.action_type}_${Date.now()}.jpg`;

      // Upload image
      const upload = await supabase.storage
        .from("Ticket_Uploads")
        .upload(filePath, file);

      if (upload.error) throw upload.error;

      const { data: publicUrl } = supabase.storage
        .from("Ticket_Uploads")
        .getPublicUrl(filePath);

      // Insert activity comment
      await supabase.from("ticket_comments").insert({
        ticket_id: ticket.id,
        source: "FE",
        body:
          token.action_type === "ON_SITE"
            ? "Field Executive uploaded on-site proof"
            : "Field Executive uploaded resolution proof",
        attachments: {
          image_url: publicUrl.publicUrl,
          remarks,
          action_type: token.action_type,
        },
      });

      // Update ticket status
      await supabase
        .from("tickets")
        .update({
          status:
            token.action_type === "ON_SITE"
              ? "ON_SITE"
              : "RESOLVED_PENDING_VERIFICATION",
        })
        .eq("id", ticket.id);

      // Mark token as used
      await supabase
        .from("fe_action_tokens" as any)
        .update({ used: true })
        .eq("id", token.id);

      toast({
        title: "Proof submitted successfully",
        description: "You may now close this page.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Submission failed",
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
