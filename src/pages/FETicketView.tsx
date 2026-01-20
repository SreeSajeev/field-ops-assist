import { useParams, useSearchParams } from "react-router-dom";
import { useFETokenAccess } from "@/hooks/useFETokenAccess";
import {
  useTicket,
  useTicketComments,
  useAddComment,
  useUpdateTicketStatus,
} from "@/hooks/useTickets";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";

export default function FETicketView() {
  const { ticketId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  // ✅ ALWAYS call hooks
  const tokenQuery = useFETokenAccess(token);
  const ticketQuery = useTicket(ticketId ?? "");
  const commentsQuery = useTicketComments(ticketId ?? "");

  const addComment = useAddComment();
  const updateStatus = useUpdateTicketStatus();

  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ---- ACCESS CHECKS (AFTER hooks) ----
  if (tokenQuery.isLoading) {
    return <div className="p-6">Validating access…</div>;
  }

  if (tokenQuery.error || !tokenQuery.data) {
    return <div className="p-6 text-red-600">Access denied or link expired.</div>;
  }

  if (tokenQuery.data.ticket_id !== ticketId) {
    return <div className="p-6 text-red-600">This link is not for this ticket.</div>;
  }

  const ticket = ticketQuery.data;
  const comments = commentsQuery.data;

  const handleReachedSite = async () => {
    if (!file) {
      alert("Please upload an image first");
      return;
    }

    try {
      setSubmitting(true);

      const filePath = `fe-proofs/${ticketId}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("fe-proofs")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("fe-proofs")
        .getPublicUrl(filePath);

      await addComment.mutateAsync({
        ticketId: ticketId!,
        body: "FE reached site and uploaded proof.",
        source: "FE",
        attachments: [
          {
            type: "image",
            url: urlData.publicUrl,
            uploaded_at: new Date().toISOString(),
          },
        ],
      });

      await updateStatus.mutateAsync({
        ticketId: ticketId!,
        status: "ON_SITE",
      });

      alert("Proof submitted successfully");
    } catch (err: any) {
      alert(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">
          Ticket #{ticket?.ticket_number}
        </h2>
        <p>Status: {ticket?.status}</p>

        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <Button onClick={handleReachedSite} disabled={submitting}>
          {submitting ? "Submitting…" : "Reached Site"}
        </Button>
      </Card>

      <div className="mt-6">
        <h3 className="font-semibold">Activity</h3>
        {comments?.map((c) => (
          <div key={c.id} className="text-sm border-b py-2">
            <strong>{c.source}</strong>: {c.body}
          </div>
        ))}
      </div>
    </div>
  );
}
