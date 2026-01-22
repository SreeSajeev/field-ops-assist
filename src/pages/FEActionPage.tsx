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

        // 1️⃣ Fetch token
        const tokenResult = await supabase
          .from("fe_action_tokens" as any)
          .select("*")
          .eq("id", tokenId)
          .eq("used", false)
          .gt("expires_at", new Date().toISOString())
          .single();

        if (tokenResult.error || !tokenResult.data) {
          console.error("❌ TOKEN LOAD ERROR:", tokenResult.error);
          toast({
            title: "Invalid or expired link",
            description: tokenResult.error?.message,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const tokenRow = tokenResult.data as any;
        console.log("✅ Token loaded:", tokenRow);
        setToken(tokenRow);

        // 2️⃣ Fetch ticket
        const ticketResult = await supabase
          .from("tickets")
          .select("*")
          .eq("id", tokenRow.ticket_id)
          .single();

        if (ticketResult.error || !ticketResult.data) {
          console.error("❌ TICKET LOAD ERROR:", ticketResult.error);
          toast({
            title: "Ticket not found",
            description: ticketResult.error?.message,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        console.log("✅ Ticket loaded:", ticketResult.data);
        setTicket(ticketResult.data);
        setLoading(false);
      } catch (err) {
        console.error("🔥 UNEXPECTED LOAD ERROR:", err);
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

  /* ================= SUBMIT PROOF ================= */
  const handleSubmit = async () => {
    if (!file || !token || !ticket) {
      toast({ title: "Please upload a photo" });
      return;
    }

    try {
      console.log("🚀 Submitting proof…");

      const filePath = `${ticket.id}/${token.action_type}_${Date.now()}.jpg`;
      console.log("📁 Upload path:", filePath);

      // 1️⃣ Upload image
      const uploadResult = await supabase.storage
        .from("Ticket_Uploads")
        .upload(filePath, file);

      if (uploadResult.error) {
        console.error("❌ UPLOAD ERROR:", uploadResult.error);
        throw new Error(uploadResult.error.message);
      }

      console.log("✅ Image uploaded");

      // 2️⃣ Get public URL
      const { data: urlData } = supabase.storage
        .from("Ticket_Uploads")
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error("Failed to get public image URL");
      }

      console.log("🔗 Image URL:", urlData.publicUrl);

      // 3️⃣ Insert ticket comment
      const commentResult = await supabase.from("ticket_comments").insert({
        ticket_id: ticket.id,
        source: "FE",
        body:
          token.action_type === "ON_SITE"
            ? "Field Executive uploaded on-site proof"
            : "Field Executive uploaded resolution proof",
        attachments: {
          image_url: urlData.publicUrl,
          remarks,
          action_type: token.action_type,
        },
      });

      if (commentResult.error) {
        console.error("❌ COMMENT INSERT ERROR:", commentResult.error);
        throw new Error(commentResult.error.message);
      }

      console.log("✅ Comment inserted");

      // 4️⃣ Update ticket status
      const statusUpdateResult = await supabase
        .from("tickets")
        .update({
          status:
            token.action_type === "ON_SITE"
              ? "ON_SITE"
              : "RESOLVED_PENDING_VERIFICATION",
        })
        .eq("id", ticket.id);

      if (statusUpdateResult.error) {
        console.error("❌ TICKET STATUS UPDATE ERROR:", statusUpdateResult.error);
        throw new Error(statusUpdateResult.error.message);
      }

      console.log("✅ Ticket status updated");

      // 5️⃣ Mark token as used
      const tokenUpdateResult = await supabase
        .from("fe_action_tokens" as any)
        .update({ used: true })
        .eq("id", token.id);

      if (tokenUpdateResult.error) {
        console.error("❌ TOKEN UPDATE ERROR:", tokenUpdateResult.error);
        throw new Error(tokenUpdateResult.error.message);
      }

      console.log("✅ Token marked as used");

      toast({
        title: "Proof submitted successfully",
        description: "You may now close this page.",
      });
    } catch (err: any) {
      console.error("🔥 SUBMISSION FAILED:", err);
      toast({
        title: "Submission failed",
        description: err?.message || "Check console for details",
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
