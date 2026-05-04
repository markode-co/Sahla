-- ============================================================
-- FIX: Subscriptions table status check constraint
-- Issue: INSERT failing with "violates check constraint subscriptions_status_check"
-- Cause: status CHECK constraint missing 'pending' value
-- Solution: Update constraint to include 'pending' for pending subscriptions
-- ============================================================

DO $$
BEGIN
  -- Drop the existing constraint
  ALTER TABLE public.subscriptions
    DROP CONSTRAINT IF EXISTS subscriptions_status_check;

  -- Add the corrected constraint that includes 'pending'
  ALTER TABLE public.subscriptions
    ADD CONSTRAINT subscriptions_status_check
    CHECK (status IN ('pending', 'active', 'expired', 'cancelled'));

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error fixing subscriptions status constraint: %', SQLERRM;
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
