-- Add promotions table with RLS policies

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pgcrypto;

  CREATE TABLE IF NOT EXISTS public.promotions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    discount_percent integer DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
    is_active boolean DEFAULT true,
    starts_at timestamptz,
    ends_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Store owners can manage their promotions" ON public.promotions;
  CREATE POLICY "Store owners can manage their promotions" ON public.promotions
    FOR ALL
    USING (
      EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
    )
    WITH CHECK (
      EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
    );

  DROP POLICY IF EXISTS "Public can read active promotions" ON public.promotions;
  CREATE POLICY "Public can read active promotions" ON public.promotions
    FOR SELECT
    USING (
      is_active = true AND
      (starts_at IS NULL OR starts_at <= now()) AND
      (ends_at IS NULL OR ends_at >= now()) AND
      EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND status = 'approved')
    );

  DROP TRIGGER IF EXISTS promotions_updated_at ON public.promotions;
  CREATE TRIGGER promotions_updated_at
    BEFORE UPDATE ON public.promotions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Promotions table migration: %', SQLERRM;
END $$;

NOTIFY pgrst, 'reload schema';

