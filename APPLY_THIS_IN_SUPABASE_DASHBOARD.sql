-- ============================================================
-- COMBINED FIX: All RLS policies + Auth trigger
-- Copy & paste into Supabase Dashboard → SQL Editor
-- ============================================================

-- ─── 1. AUTH TRIGGER: Auto-create public.users on signup ───────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    CASE 
      WHEN NEW.email = 'ca.markode@gmail.com' THEN 'admin'
      ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'merchant')
    END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Sync existing auth.users without public.users records
INSERT INTO public.users (id, email, full_name, phone, role)
SELECT
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name',
  au.raw_user_meta_data->>'phone',
  CASE
    WHEN au.email = 'ca.markode@gmail.com' THEN 'admin'
    ELSE COALESCE(au.raw_user_meta_data->>'role', 'merchant')
  END
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ─── 2. USERS TABLE POLICIES ───────────────────
DROP POLICY IF EXISTS "Users can insert their own record" ON public.users;
CREATE POLICY "Users can insert their own record"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id AND role = 'merchant');

DROP POLICY IF EXISTS "Users can read own data" ON public.users;
CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own data" ON public.users;
CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
CREATE POLICY "Admins can read all users"
  ON public.users
  FOR SELECT
  USING (public.get_my_role() = 'admin');

-- ─── 3. STORES TABLE POLICIES ───────────────────
DROP POLICY IF EXISTS "Store owners can manage their store" ON public.stores;
CREATE POLICY "Store owners can manage their store"
  ON public.stores
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can read approved stores" ON public.stores;
CREATE POLICY "Public can read approved stores"
  ON public.stores
  FOR SELECT
  USING (status = 'approved');

DROP POLICY IF EXISTS "Admins can manage all stores" ON public.stores;
CREATE POLICY "Admins can manage all stores"
  ON public.stores
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- ─── 4. PRODUCTS TABLE POLICIES ───────────────────
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

DROP POLICY IF EXISTS "Public can read active products" ON public.products;
CREATE POLICY "Public can read active products"
  ON public.products
  FOR SELECT
  USING (
    is_active = true AND
    EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND status = 'approved')
  );

DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
CREATE POLICY "Admins can manage all products"
  ON public.products
  FOR ALL
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- ─── 5. DOCUMENTS TABLE POLICIES ───────────────────
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

-- ─── 6. PAYMENT METHODS TABLE POLICIES ───────────────────
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

-- ─── 7. ORDERS TABLE POLICIES ───────────────────
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

-- ─── 8. ORDER ITEMS TABLE POLICIES ───────────────────
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

-- ─── 9. PAYMENTS TABLE POLICIES ───────────────────
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

-- ─── 10. SUBSCRIPTIONS TABLE POLICIES ───────────────────
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

-- ─── 11. STORAGE BUCKET POLICIES ───────────────────
DROP POLICY IF EXISTS "Users can upload to store-logos" ON storage.objects;
CREATE POLICY "Users can upload to store-logos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'store-logos' AND
    (auth.uid()::text = (storage.foldername(name))[1])
  );

DROP POLICY IF EXISTS "Users can read store logos" ON storage.objects;
CREATE POLICY "Users can read store logos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'store-logos');

DROP POLICY IF EXISTS "Admins can manage store-logos" ON storage.objects;
CREATE POLICY "Admins can manage store-logos"
  ON storage.objects
  FOR ALL
  USING (bucket_id = 'store-logos' AND public.get_my_role() = 'admin');

-- ─── 12. RELOAD SCHEMA CACHE ───────────────────
NOTIFY pgrst, 'reload schema';
