-- Add method column to payment_methods table
ALTER TABLE public.payment_methods
  ADD COLUMN IF NOT EXISTS method text NOT NULL CHECK (method IN ('instapay', 'bank_transfer', 'cash_on_delivery')) DEFAULT 'cash_on_delivery';