-- Add receipt_url and pending status to subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS receipt_url text;

-- Drop old status constraint and re-create with 'pending' included
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('pending', 'active', 'expired', 'cancelled'));
