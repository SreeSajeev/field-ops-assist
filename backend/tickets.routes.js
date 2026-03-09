import express from "express";
import { supabase } from "./supabase.js";
import {
  sendOnSiteTokenEmail,
  sendResolutionTokenEmail,
  sendClientResolvedEmail
} from "./email.service.js";

export const router = express.Router();

/* ASSIGN TICKET TO FIELD EXECUTIVE */
router.post("/:id/assign", async (req, res) => {
  const { id: ticketId } = req.params;
  const { feId } = req.body || {};

  if (!ticketId || !feId) {
    return res.status(400).json({ error: "ticket id and feId are required" });
  }

  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .select("id, status")
    .eq("id", ticketId)
    .single();

  if (ticketError || !ticket) {
    return res.status(404).json({ error: "Ticket not found" });
  }

  const allowedStatuses = ["OPEN", "REOPENED", "FE_ATTEMPT_FAILED"];
  if (!allowedStatuses.includes(ticket.status)) {
    return res.status(400).json({
      error: `Ticket cannot be assigned in status ${ticket.status}. Allowed: ${allowedStatuses.join(", ")}`,
    });
  }

  const { data: fe, error: feError } = await supabase
    .from("field_executives")
    .select("id")
    .eq("id", feId)
    .single();

  if (feError || !fe) {
    return res.status(400).json({ error: "Field executive not found" });
  }

  const { data: assignment, error: assignError } = await supabase
    .from("ticket_assignments")
    .insert({
      ticket_id: ticketId,
      fe_id: feId,
    })
    .select("id")
    .single();

  if (assignError) {
    console.error("ticket_assignments insert error:", assignError);
    return res.status(500).json({ error: "Failed to create assignment" });
  }

  const { error: updateError } = await supabase
    .from("tickets")
    .update({
      current_assignment_id: assignment.id,
      status: "ASSIGNED",
      updated_at: new Date().toISOString(),
    })
    .eq("id", ticketId);

  if (updateError) {
    console.error("tickets update error:", updateError);
    return res.status(500).json({ error: "Failed to update ticket" });
  }

  return res.json({ success: true, assignmentId: assignment.id });
});

/* ON-SITE TOKEN */
router.post("/:id/on-site-token", async (req, res) => {
  const { id } = req.params;

  const { data: ticket } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", id)
    .single();

  const { data: assignment, error: assignErr } = await supabase
  .from("ticket_assignments")
  .select("fe_id, field_executives:fe_id(email)")
  .eq("ticket_id", id)
  .single();

    if (!assignment) {
      return res.status(400).json({
        error: "No field executive assigned to this ticket"
      });
    }


  const { data: token } = await supabase
    .from("fe_action_tokens")
    .insert({
      ticket_id: id,
      fe_id: assignment.fe_id,
      action_type: "ON_SITE"
    })
    .select()
    .single();

  await supabase
    .from("tickets")
    .update({ status: "EN_ROUTE" })
    .eq("id", id);

  await sendOnSiteTokenEmail({
    to: assignment.field_executives.email,
    ticket,
    token: token.id
  });

  res.json({ success: true });
});

/* RESOLUTION TOKEN */
router.post("/:id/resolution-token", async (req, res) => {
  const { id } = req.params;

  const { data: ticket } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", id)
    .single();

  const { data: assignment } = await supabase
    .from("ticket_assignments")
    .select("fe_id, field_executives:fe_id(email)")
    .eq("ticket_id", id)
    .single();

  const { data: token } = await supabase
    .from("fe_action_tokens")
    .insert({
      ticket_id: id,
      fe_id: assignment.fe_id,
      action_type: "RESOLUTION"
    })
    .select()
    .single();

  await supabase
    .from("tickets")
    .update({ status: "ON_SITE" })
    .eq("id", id);

  await sendResolutionTokenEmail({
    to: assignment.field_executives.email,
    ticket,
    token: token.id
  });

  res.json({ success: true });
});

/* VERIFY & CLOSE */
router.post("/:id/verify", async (req, res) => {
  const { id } = req.params;

  const { data: ticket } = await supabase
    .from("tickets")
    .update({ status: "RESOLVED" })
    .eq("id", id)
    .select()
    .single();

  const { data: openTickets } = await supabase
    .from("tickets")
    .select("id")
    .eq("opened_by_email", ticket.opened_by_email)
    .neq("status", "RESOLVED");

  if (!openTickets || openTickets.length === 0)  {
    const { data: resolved } = await supabase
      .from("tickets")
      .select("ticket_number, category")
      .eq("opened_by_email", ticket.opened_by_email)
      .eq("status", "RESOLVED");

    await sendClientResolvedEmail({
      to: ticket.opened_by_email,
      tickets: resolved
    });
  }

  res.json({ success: true });
});
