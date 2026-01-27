/**
 * FE Token Generation Utilities
 * 
 * This module provides functions to generate access tokens for Field Executives.
 * Tokens allow FEs to access ticket actions via a link without requiring login.
 * 
 * Uses the existing `access_tokens` table which has:
 * - token_hash: unique identifier for the token
 * - ticket_id: the ticket this token grants access to
 * - fe_id: the field executive this token is for
 * - expires_at: when the token expires
 * - revoked: whether the token has been used/revoked
 */
import { supabase } from '@/integrations/supabase/client';

/**
 * Generate a unique token hash
 * Creates a random string that can be used as a URL-safe token
 */
function generateTokenHash(): string {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate an access token for a Field Executive to access a ticket
 * 
 * @param ticketId - The ticket ID to grant access to
 * @param feId - The Field Executive ID
 * @param expiryHours - How many hours until the token expires (default: 24)
 * @returns The created token record including the token_hash for URL generation
 */
export async function generateFEToken(
  ticketId: string,
  feId: string,
  _actionType?: string, // Kept for backward compatibility but not stored
  expiryHours: number = 24
) {
  const tokenHash = generateTokenHash();
  const expiresAt = new Date(
    Date.now() + expiryHours * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from('access_tokens')
    .insert({
      token_hash: tokenHash,
      ticket_id: ticketId,
      fe_id: feId,
      expires_at: expiresAt,
      revoked: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to generate FE access token:', error);
    throw error;
  }

  // Return with 'id' property for backward compatibility with existing code
  return {
    ...data,
    id: data.token_hash, // Use token_hash as the URL identifier
  };
}

/**
 * Revoke an access token
 * 
 * @param tokenHash - The token hash to revoke
 */
export async function revokeFEToken(tokenHash: string) {
  const { error } = await supabase
    .from('access_tokens')
    .update({ revoked: true })
    .eq('token_hash', tokenHash);

  if (error) {
    console.error('Failed to revoke token:', error);
    throw error;
  }
}

/**
 * Get the FE action URL for a token
 * 
 * @param tokenHash - The token hash
 * @returns The full URL for the FE action page
 */
export function getFEActionUrl(tokenHash: string): string {
  return `${window.location.origin}/fe/action/${tokenHash}`;
}
