import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTicket, useTicketComments } from "@/hooks/useTickets";
import { useFETokenForTicket } from "@/hooks/useFETokenForTicket";

export default function FETicketView() {
  const params = useParams<{ ticketId: string }>();
  const navigate = useNavigate();

  const ticketId = params.ticketId ?? "";

  const ticketQuery = useTicket(ticketId);
  const commentsQuery = useTicketComments(ticketId);
  const tokenQuery = useFETokenForTicket(ticketId);

  if (!ticketId) {
    return <div className="p-6 text-red-600">Invalid ticket.</div>;
  }

  if (ticketQuery.isLoading || tokenQuery.isLoading) {
    return <div className="p-6">Loading…</div>;
  }

  if (!ticketQuery.data) {
    return <div className="p-6 text-red-600">Ticket not found.</div>;
  }

  // Narrow intentionally to avoid TS union explosion
  const token = tokenQuery.data as any | null;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Ticket Info */}
      <Card className="p-6 space-y-2">
        <h2 className="text-xl font-semibold">
          Ticket #{ticketQuery.data.ticket_number}
        </h2>
        <p>Status: {ticketQuery.data.status}</p>
        <p>Location: {ticketQuery.data.location ?? "Not specified"}</p>
        <p>Issue Type: {ticketQuery.data.issue_type ?? "—"}</p>
      </Card>

      {/* Action Token */}
      {token ? (
        <Card className="p-4 flex items-center justify-between">
          <span className="font-medium">
            {token.action_type === "ON_SITE"
              ? "On-Site Proof Required"
              : "Resolution Proof Required"}
          </span>

          <Button
            onClick={() =>
              navigate(`/fe/action/${token.token_hash}`)
            }
          >
            {token.action_type === "ON_SITE"
              ? "Upload On-Site Proof"
              : "Upload Resolution Proof"}
          </Button>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">
          No pending actions for this ticket.
        </p>
      )}

      {/* Activity Timeline */}
      <div className="space-y-2">
        <h3 className="font-semibold">Activity</h3>
        {commentsQuery.data?.length ? (
          commentsQuery.data.map((c) => (
            <div key={c.id} className="border-b py-2 text-sm">
              <strong>{c.source}</strong>: {c.body}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No activity yet.
          </p>
        )}
      </div>
    </div>
  );
}
