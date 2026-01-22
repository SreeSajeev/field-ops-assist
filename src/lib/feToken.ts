import { supabase as supabaseClient } from '@/integrations/supabase/client';

const supabase = supabaseClient as any;


export type FEActionType = 'ON_SITE' | 'RESOLUTION';

export async function generateFEToken(
  ticketId: string,
  feId: string,
  actionType: FEActionType
) {
  const expiresAt = new Date(
    Date.now() + 60 * 60 * 1000 // 1 hour
  ).toISOString();

  const { data, error } = await supabase
    .from('fe_action_tokens')
    .insert({
      ticket_id: ticketId,
      fe_id: feId,
      action_type: actionType,
      expires_at: expiresAt,
      used: false
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to generate FE token', error);
    throw error;
  }

  return data;
}
