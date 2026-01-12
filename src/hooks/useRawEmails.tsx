import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RawEmail, ParsedEmail, RawEmailWithParsed, EmailProcessingStatus } from '@/lib/types';

function determineProcessingStatus(
  rawEmail: RawEmail,
  parsedEmail: ParsedEmail | null
): EmailProcessingStatus {
  // If no parsed email exists, it's just received
  if (!parsedEmail) {
    return 'RECEIVED';
  }

  // If ticket was created
  if (rawEmail.ticket_created) {
    return 'TICKET_CREATED';
  }

  // If needs review (confidence < 95%)
  if (parsedEmail.needs_review) {
    return 'NEEDS_REVIEW';
  }

  // If confidence is low (< 80%), it's a draft
  if (parsedEmail.confidence_score !== null && parsedEmail.confidence_score < 80) {
    return 'DRAFT';
  }

  // Otherwise it's parsed successfully
  return 'PARSED';
}

export function useRawEmails() {
  return useQuery({
    queryKey: ['raw-emails'],
    queryFn: async () => {
      // Fetch raw emails
      const { data: rawEmails, error: rawError } = await supabase
        .from('raw_emails')
        .select('*')
        .order('received_at', { ascending: false })
        .limit(100);

      if (rawError) throw rawError;

      // Fetch all parsed emails
      const { data: parsedEmails, error: parsedError } = await supabase
        .from('parsed_emails')
        .select('*');

      if (parsedError) throw parsedError;

      // Create a map of raw_email_id to parsed_email
      const parsedMap = new Map<string, ParsedEmail>();
      (parsedEmails || []).forEach((pe) => {
        parsedMap.set(pe.raw_email_id, pe as ParsedEmail);
      });

      // Combine raw emails with parsed data and processing status
      const emailsWithStatus: RawEmailWithParsed[] = (rawEmails || []).map((raw) => {
        const rawEmail: RawEmail = {
          id: raw.id,
          message_id: raw.message_id,
          thread_id: raw.thread_id,
          from_email: raw.from_email,
          to_email: raw.to_email,
          subject: raw.subject,
          received_at: raw.received_at,
          payload: raw.payload,
          ticket_created: raw.ticket_created,
          created_at: raw.created_at,
        };
        const parsed = parsedMap.get(raw.id) || null;
        return {
          ...rawEmail,
          parsed_email: parsed,
          processing_status: determineProcessingStatus(rawEmail, parsed),
          linked_ticket_id: null,
        };
      });

      return emailsWithStatus;
    },
  });
}

export function useRawEmail(emailId: string) {
  return useQuery({
    queryKey: ['raw-email', emailId],
    queryFn: async () => {
      const { data: raw, error: rawError } = await supabase
        .from('raw_emails')
        .select('*')
        .eq('id', emailId)
        .single();

      if (rawError) throw rawError;

      const rawEmail: RawEmail = {
        id: raw.id,
        message_id: raw.message_id,
        thread_id: raw.thread_id,
        from_email: raw.from_email,
        to_email: raw.to_email,
        subject: raw.subject,
        received_at: raw.received_at,
        payload: raw.payload,
        ticket_created: raw.ticket_created,
        created_at: raw.created_at,
      };

      // Fetch parsed email if exists
      const { data: parsedEmail } = await supabase
        .from('parsed_emails')
        .select('*')
        .eq('raw_email_id', emailId)
        .maybeSingle();

      const emailWithStatus: RawEmailWithParsed = {
        ...rawEmail,
        parsed_email: parsedEmail as ParsedEmail | null,
        processing_status: determineProcessingStatus(rawEmail, parsedEmail as ParsedEmail | null),
      };

      return emailWithStatus;
    },
    enabled: !!emailId,
  });
}
