import postmark from "postmark";

const client = new postmark.ServerClient(
  process.env.POSTMARK_SERVER_TOKEN
);

export async function sendOnSiteTokenEmail({ to, ticket, token }) {
  await client.sendEmail({
    From: "support@pariskq.in",
    To: to,
    Subject: `On-site token for ticket ${ticket.ticket_number}`,
    TextBody: `
Your on-site token has been generated.

Ticket: ${ticket.ticket_number}
Token: ${token}

Please proceed to site and update status.
`
  });
}

export async function sendResolutionTokenEmail({ to, ticket, token }) {
  await client.sendEmail({
    From: "support@pariskq.in",
    To: to,
    Subject: `Resolution token for ticket ${ticket.ticket_number}`,
    TextBody: `
Your resolution token has been generated.

Ticket: ${ticket.ticket_number}
Token: ${token}

Please upload proof after resolution.
`
  });
}

export async function sendClientResolvedEmail({ to, tickets }) {
  const list = tickets
    .map(t => `• ${t.ticket_number} (${t.category})`)
    .join("\n");

  await client.sendEmail({
    From: "support@pariskq.in",
    To: to,
    Subject: "All your tickets have been resolved",
    TextBody: `
Hello,

The following tickets have been resolved:

${list}

Thank you for choosing Pariskq.
`
  });
}
