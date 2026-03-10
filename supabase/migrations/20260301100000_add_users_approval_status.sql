-- Add approval_status to users table for organisation-based signup with admin approval.
-- Allowed values: 'pending', 'approved', 'rejected'. Default 'pending' for new signups.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';

-- Treat all existing users as approved (no behaviour change for current users).
UPDATE users
SET approval_status = 'approved'
WHERE approval_status IS NULL;
