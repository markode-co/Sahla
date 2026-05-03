-- ============================================================
-- CRITICAL FIX: Add missing INSERT policies to all tables
-- This resolves 403 Forbidden errors on REST API
-- NOTE: Tables must exist (created by initial_schema.sql)
-- ============================================================

-- ─── USERS TABLE - ADD MISSING INSERT POLICY ───────────────
-- Users cannot update their own role, only admins can do that
-- Users can only insert their own record (via trigger on auth.users)
DROP POLICY IF EXISTS "Users can insert their own record" ON public.users;
CREATE POLICY "Users can insert their own record"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id AND role = 'merchant');

-- ─── STORES TABLE - FIX POLICIES WITH PROPER CHECKS ───────────────
DROP POLICY IF EXISTS "Store owners can manage their store" ON public.stores;
CREATE POLICY "Store owners can manage their store"
  ON public.stores
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all stores" ON public.stores;
CREATE POLICY "Admins can manage all stores"
  ON public.stores
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "Public can read approved stores" ON public.stores;
CREATE POLICY "Public can read approved stores"
  ON public.stores
  FOR SELECT
  USING (status = 'approved');

-- ─── PRODUCTS TABLE - FIX INSERT POLICY ───────────────
-- Only create policies if products table exists
DO $$
BEGIN
  DROP POLICY IF EXISTS "Store owners manage their products" ON public.products;
  CREATE POLICY "Store owners manage their products"
    ON public.products
    FOR ALL
    USING (
      EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
    )
    WITH CHECK (
      EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
    );
  
  DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
  CREATE POLICY "Admins can manage all products"
    ON public.products
    FOR ALL
    USING (public.get_my_role() = 'admin')
    WITH CHECK (public.get_my_role() = 'admin');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping products table policies: %', SQLERRM;
END $$;

-- ─── DOCUMENTS TABLE - FIX INSERT POLICY ───────────────
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can manage own documents" ON public.documents;
  CREATE POLICY "Users can manage own documents"
    ON public.documents
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Admins can manage all documents" ON public.documents;
  CREATE POLICY "Admins can manage all documents"
    ON public.documents
    FOR ALL
    USING (public.get_my_role() = 'admin')
    WITH CHECK (public.get_my_role() = 'admin');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping documents table policies: %', SQLERRM;
END $$;

-- ─── PAYMENT METHODS TABLE - ADD POLICIES ───────────────
DO $$
BEGIN
  DROP POLICY IF EXISTS "Store owners can manage payment methods" ON public.payment_methods;
  CREATE POLICY "Store owners can manage payment methods"
    ON public.payment_methods
    FOR ALL
    USING (
      EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
    )
    WITH CHECK (
      EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
    );

  DROP POLICY IF EXISTS "Admins can manage all payment methods" ON public.payment_methods;
  CREATE POLICY "Admins can manage all payment methods"
    ON public.payment_methods
    FOR ALL
    USING (public.get_my_role() = 'admin')
    WITH CHECK (public.get_my_role() = 'admin');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping payment_methods table policies: %', SQLERRM;
END $$;

-- ─── ORDERS TABLE - FIX INSERT POLICY ───────────────
DO $$
BEGIN
  DROP POLICY IF EXISTS "Store owners can manage their orders" ON public.orders;
  CREATE POLICY "Store owners can manage their orders"
    ON public.orders
    FOR ALL
    USING (
      EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
    )
    WITH CHECK (
      EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
    );

  DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
  CREATE POLICY "Anyone can insert orders"
    ON public.orders
    FOR INSERT
    WITH CHECK (true);

  DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
  CREATE POLICY "Admins can manage all orders"
    ON public.orders
    FOR ALL
    USING (public.get_my_role() = 'admin')
    WITH CHECK (public.get_my_role() = 'admin');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping orders table policies: %', SQLERRM;
END $$;

-- ─── ORDER ITEMS TABLE - FIX INSERT POLICY ───────────────
DO $$
BEGIN
  DROP POLICY IF EXISTS "Store owners can view order items" ON public.order_items;
  CREATE POLICY "Store owners can view order items"
    ON public.order_items
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.orders o
        JOIN public.stores s ON s.id = o.store_id
        WHERE o.id = order_id AND s.user_id = auth.uid()
      )
    );

  DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
  CREATE POLICY "Anyone can insert order items"
    ON public.order_items
    FOR INSERT
    WITH CHECK (true);

  DROP POLICY IF EXISTS "Admins can manage all order items" ON public.order_items;
  CREATE POLICY "Admins can manage all order items"
    ON public.order_items
    FOR ALL
    USING (public.get_my_role() = 'admin')
    WITH CHECK (public.get_my_role() = 'admin');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping order_items table policies: %', SQLERRM;
END $$;

-- ─── PAYMENTS TABLE - FIX INSERT POLICY ───────────────
DO $$
BEGIN
  DROP POLICY IF EXISTS "Store owners can view payments" ON public.payments;
  CREATE POLICY "Store owners can view payments"
    ON public.payments
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.orders o
        JOIN public.stores s ON s.id = o.store_id
        WHERE o.id = order_id AND s.user_id = auth.uid()
      )
    );

  DROP POLICY IF EXISTS "Anyone can insert payments" ON public.payments;
  CREATE POLICY "Anyone can insert payments"
    ON public.payments
    FOR INSERT
    WITH CHECK (true);

  DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;
  CREATE POLICY "Admins can manage all payments"
    ON public.payments
    FOR ALL
    USING (public.get_my_role() = 'admin')
    WITH CHECK (public.get_my_role() = 'admin');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping payments table policies: %', SQLERRM;
END $$;

-- ─── SUBSCRIPTIONS TABLE - FIX POLICIES ───────────────
DO $$
BEGIN
  DROP POLICY IF EXISTS "subscriptions_select" ON public.subscriptions;
  CREATE POLICY "subscriptions_select" ON public.subscriptions
    FOR SELECT
    USING (auth.uid() = user_id OR public.get_my_role() = 'admin');

  DROP POLICY IF EXISTS "subscriptions_insert" ON public.subscriptions;
  CREATE POLICY "subscriptions_insert" ON public.subscriptions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR public.get_my_role() = 'admin');

  DROP POLICY IF EXISTS "subscriptions_update" ON public.subscriptions;
  CREATE POLICY "subscriptions_update" ON public.subscriptions
    FOR UPDATE
    USING (auth.uid() = user_id OR public.get_my_role() = 'admin')
    WITH CHECK (auth.uid() = user_id OR public.get_my_role() = 'admin');

  DROP POLICY IF EXISTS "subscriptions_delete" ON public.subscriptions;
  CREATE POLICY "subscriptions_delete" ON public.subscriptions
    FOR DELETE
    USING (auth.uid() = user_id OR public.get_my_role() = 'admin');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping subscriptions table policies: %', SQLERRM;
END $$;

-- ─── STORAGE BUCKET POLICIES ───────────────
-- These policies handle file uploads to store-logos bucket
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can upload to store-logos" ON storage.objects;
  DROP POLICY IF EXISTS "Users can read their store logos" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can manage store-logos" ON storage.objects;
  
  CREATE POLICY "Users can upload to store-logos"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'store-logos' AND
      (auth.uid()::text = (storage.foldername(name))[1])
    );

  CREATE POLICY "Users can read their store logos"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'store-logos');

  CREATE POLICY "Admins can manage store-logos"
    ON storage.objects
    FOR ALL
    USING (bucket_id = 'store-logos' AND public.get_my_role() = 'admin');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping storage bucket policies: %', SQLERRM;
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
