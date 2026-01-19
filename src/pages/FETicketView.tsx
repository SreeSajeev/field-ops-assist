import { useParams, useSearchParams } from "react-router-dom";

const FETicketView = () => {
  const { ticketId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  return (
    <div style={{ padding: "24px" }}>
      <h1>FE Ticket View</h1>

      <p>
        <strong>Ticket ID:</strong> {ticketId}
      </p>

      <p>
        <strong>Token:</strong> {token}
      </p>

      <p style={{ marginTop: "16px", color: "green" }}>
        ✅ FE route is working without authentication
      </p>
    </div>
  );
};

export default FETicketView;
