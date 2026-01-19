import { useParams, useSearchParams } from "react-router-dom";
import { useState } from "react";

import { useFETokenAccess } from "@/hooks/useFETokenAccess";
import {
  useTicket,
  useTicketComments,
  useAddComment,
  useUpdateTicketStatus,
} from "@/hooks/useTickets";

import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FETicketView() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  /* ---------------------------------
     1. Validate FE Token
  ----------------------------------*/
  const {
    data: tokenRow,
    isLoading: tokenLoading,
    error: tokenError,
  } = useFETokenAccess(token);

  if (tokenLoading) {
    return <div className="p-6">Validating access…</div>;
  }

  if (tokenError || !tokenRow) {
    return <div className="p-6 text-red-600">Access denied or link expired.</div>;
  }

  if (tokenRow.ticket_id !== ticketId) {
    return <div className="p-6 text-red-600">This link is not valid for this ticket.</div>;
  }

  /* ---------------------------------
     2. Fetch Ticket + Comments
  ----------------------------------*/
  const { data: ticket } = useTicket(ticketId!);
  const { data: comments } = useTicketComments(ticketId!);

  const addComment = useAddComment();
  const updateStatus = useUpdateTicketStatus();

  /* ---------------------------------
     3. Local State
  ----------------------------------*/
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* ---------------------------------
     4. FE Action: Reached Site
  ----------------------------------*/
  const handleReachedSite = async () => {
    if (!file) {
      alert("Please upload a photo as proof.");
      return;
    }

    try {
      setSubmitting(true);

      /* Upload proof image */
      const storagePath = `fe-proofs/${ticketId}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("fe-proofs")
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("fe-proofs")
        .getPublicUrl(storagePath);

      /* Add FE comment with attachment */
      await addComment.mutateAsync({
        ticketId: ticketId!,
        body: "FE reached site and uploaded proof.",
        source: "FE",
        attachments: [
          {
            type: "image",
            storage_path: storagePath,
            url: publicUrlData.publicUrl,
            uploaded_at: new Date().toISOString(),
          },
        ],
      });

      /* Update ticket status */
      await updateStatus.mutateAsync({
        ticketId: ticketId!,
        status: "ON_SITE",
      });

      alert("Proof submitted successfully.");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------------
     5. UI
  ----------------------------------*/
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
        <h3 className="font-semibold mb-2">Activity</h3>
        {comments?.map((c) => (
          <div key={c.id} className="border-b py-2 text-sm">
            <strong>{c.source}</strong>: {c.body}
          </div>
        ))}
      </div>
    </div>
  );
}
