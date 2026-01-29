import { supabase } from '@/integrations/supabase/client';

export type FEActionType = 'ON_SITE' | 'RESOLUTION';

interface GenerateFEActionTokenParams {
  ticketId: string;
  feId: string;
  actionType: FEActionType;
  expiryHours?: number;
}

/**
 * Generates a Field Executive action token.
 * This does NOT update ticket status.
 * Ticket status must only change when token is USED.
 */
export async function generateFEActionToken({
  ticketId,
  feId,
  actionType,
  expiryHours = 24,
}: GenerateFEActionTokenParams) {
  // 1️⃣ Check for existing active token (important)
  const { data: existingToken, error: existingError } = await (supabase as any)
    .from('fe_action_tokens')
    .select('id')
    .eq('ticket_id', ticketId)
    .eq('fe_id', feId)
    .eq('action_type', actionType)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingToken) {
    // Prevent token spam
    return {
      tokenId: existingToken.id,
      alreadyExists: true,
    };
  }

  // 2️⃣ Create expiry timestamp
  const expiresAt = new Date(
    Date.now() + expiryHours * 60 * 60 * 1000
  ).toISOString();

  // 3️⃣ Insert token
  const { data, error } = await (supabase as any)
    .from('fe_action_tokens')
    .insert({
      ticket_id: ticketId,
      fe_id: feId,
      action_type: actionType,
      expires_at: expiresAt,
      used: false,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return {
    tokenId: data.id,
    alreadyExists: false,
  };
}
