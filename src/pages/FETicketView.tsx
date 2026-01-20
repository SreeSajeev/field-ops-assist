import { useParams, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFETokenAccess } from "@/hooks/useFETokenAccess";
import {
  useTicket,
  useTicketComments,
  useAddComment,
  useUpdateTicketStatus,
} from "@/hooks/useTickets";

export default function FETicketView() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const tokenQuery = useFETokenAccess(token);
  const ticketQuery = useTicket(ticketId ?? "");
  const commentsQuery = useTicketComments(ticketId ?? "");

  const addComment = useAddComment();
  const updateStatus = useUpdateTicketStatus();

  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (tokenQuery.isLoading || ticketQuery.isLoading) {
    return <div className="p-6">Loading…</div>;
  }

  if (!tokenQuery.data || tokenQuery.error) {
    return <div className="p-6 text-red-600">Access denied or expired.</div>;
  }

  if (tokenQuery.data.ticket_id !== ticketId) {
    return <div className="p-6 text-red-600">Invalid ticket link.</div>;
  }

  const handleReachedSite = async () => {
    if (!file || !ticketId) return alert("Upload an image");

    try {
      setSubmitting(true);

      const path = `${ticketId}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("Ticket_Uploads")
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: url } = supabase.storage
        .from("Ticket_Uploads")
        .getPublicUrl(path);

      await addComment.mutateAsync({
        ticketId,
        body: "FE reached site and uploaded proof.",
        source: "FE",
        attachments: [
          {
            type: "image",
            bucket: "Ticket_Uploads",
            path,
            public_url: url.publicUrl,
            uploaded_at: new Date().toISOString(),
          },
        ],
      });

      await updateStatus.mutateAsync({
        ticketId,
        status: "ON_SITE",
      });

      setDone(true);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">
          Ticket #{ticketQuery.data?.ticket_number}
        </h2>

        <p>Status: {ticketQuery.data?.status}</p>

        {!done && (
          <>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button disabled={submitting} onClick={handleReachedSite}>
              {submitting ? "Submitting…" : "Reached Site"}
            </Button>
          </>
        )}

        {done && <p className="text-green-600">Proof submitted successfully.</p>}
      </Card>

      <div className="mt-6">
        <h3 className="font-semibold">Activity</h3>
        {commentsQuery.data?.map((c) => (
          <div key={c.id} className="border-b py-2 text-sm">
            <strong>{c.source}</strong>: {c.body}
          </div>
        ))}
      </div>
    </div>
  );
}
