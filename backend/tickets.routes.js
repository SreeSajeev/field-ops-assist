import express from "express";
import { supabase } from "./supabase.js";
import {
  sendOnSiteTokenEmail,
  sendResolutionTokenEmail,
  sendClientResolvedEmail
} from "./email.service.js";

export const router = express.Router();

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
