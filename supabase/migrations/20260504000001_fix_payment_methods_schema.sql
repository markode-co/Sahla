-- ============================================================
-- Fix missing payment_methods columns + refresh PostgREST schema
-- ============================================================

ALTER TABLE public.payment_methods
  ADD COLUMN IF NOT EXISTS method text NOT NULL CHECK (method IN ('instapay', 'bank_transfer', 'cash_on_delivery')) DEFAULT 'cash_on_delivery',
  ADD COLUMN IF NOT EXISTS instapay_username text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_account_number text,
  ADD COLUMN IF NOT EXISTS bank_account_name text,
  ADD COLUMN IF NOT EXISTS cash_on_delivery boolean DEFAULT false;

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store owners can manage payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Public can read payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Admins can manage all payment methods" ON public.payment_methods;

CREATE POLICY "Store owners can manage payment methods" ON public.payment_methods
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
  );

CREATE POLICY "Public can read payment methods" ON public.payment_methods
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND status = 'approved')
  );

CREATE POLICY "Admins can manage all payment methods" ON public.payment_methods
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

DROP TRIGGER IF EXISTS payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

NOTIFY pgrst, 'reload schema';
