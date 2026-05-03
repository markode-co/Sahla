-- ============================================================
-- COMPLETE SCHEMA SETUP: Creates all tables and RLS policies
-- Safe to run even if tables already exist (uses IF NOT EXISTS)
-- ============================================================

-- ─── 1. EXTENSIONS ───────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

-- Ensure uuid_generate_v4 is in the search path
SET search_path = public, extensions, pg_catalog;

-- ─── 2. HELPER FUNCTIONS ───────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(role, 'merchant') FROM public.users WHERE id = auth.uid();
$$;

-- ─── 3. USERS TABLE ───────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL UNIQUE,
  full_name text,
  phone text,
  role text NOT NULL DEFAULT 'merchant' CHECK (role IN ('admin', 'merchant')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can read own data" ON public.users;
  CREATE POLICY "Users can read own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

  DROP POLICY IF EXISTS "Users can update own data" ON public.users;
  CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

  DROP POLICY IF EXISTS "Users can insert their own record" ON public.users;
  CREATE POLICY "Users can insert their own record" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id AND role = 'merchant');

  DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
  CREATE POLICY "Admins can read all users" ON public.users
    FOR SELECT USING (public.get_my_role() = 'admin');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping users policies: %', SQLERRM;
END $$;

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 4. STORES TABLE ───────────────────
CREATE TABLE IF NOT EXISTS public.stores (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  logo_url text,
  logo_color text DEFAULT '#0ea5e9',
  logo_initials text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Store owners can select their store" ON public.stores;
  CREATE POLICY "Store owners can select their store"
    ON public.stores FOR SELECT USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Store owners can update their store" ON public.stores;
  CREATE POLICY "Store owners can update their store"
    ON public.stores FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Store owners can insert store" ON public.stores;
  CREATE POLICY "Store owners can insert store"
    ON public.stores FOR INSERT WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Public can read approved stores" ON public.stores;
  CREATE POLICY "Public can read approved stores"
    ON public.stores FOR SELECT USING (status = 'approved');

  DROP POLICY IF EXISTS "Admins can select all stores" ON public.stores;
  CREATE POLICY "Admins can select all stores"
    ON public.stores FOR SELECT USING (public.get_my_role() = 'admin');

  DROP POLICY IF EXISTS "Admins can update all stores" ON public.stores;
  CREATE POLICY "Admins can update all stores"
    ON public.stores FOR UPDATE USING (public.get_my_role() = 'admin')
    WITH CHECK (public.get_my_role() = 'admin');

  DROP POLICY IF EXISTS "Admins can insert stores" ON public.stores;
  CREATE POLICY "Admins can insert stores"
    ON public.stores FOR INSERT WITH CHECK (public.get_my_role() = 'admin');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping stores policies: %', SQLERRM;
END $$;

DROP TRIGGER IF EXISTS stores_updated_at ON public.stores;
CREATE TRIGGER stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 5. PRODUCTS TABLE ───────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  stock integer DEFAULT 0,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Store owners manage their products" ON public.products;
  CREATE POLICY "Store owners manage their products" ON public.products
    FOR ALL USING (
      EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
    )
    WITH CHECK (
      EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
    );

  DROP POLICY IF EXISTS "Public can read active products" ON public.products;
  CREATE POLICY "Public can read active products" ON public.products
    FOR SELECT USING (
      is_active = true AND
      EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND status = 'approved')
    );

  DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
  CREATE POLICY "Admins can manage all products" ON public.products
    FOR ALL USING (public.get_my_role() = 'admin');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping products policies: %', SQLERRM;
END $$;

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 6. ORDERS TABLE ───────────────────
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_address text NOT NULL,
  customer_email text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'delivered')),
  payment_method text NOT NULL CHECK (payment_method IN ('instapay', 'bank_transfer', 'cash_on_delivery')),
  notes text,
  total_amount decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Store owners can manage their orders" ON public.orders;
  CREATE POLICY "Store owners can manage their orders" ON public.orders
    FOR ALL USING (
      EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
    )
    WITH CHECK (
      EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
    );

  DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
  CREATE POLICY "Anyone can insert orders" ON public.orders
    FOR INSERT WITH CHECK (true);

  DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
  CREATE POLICY "Admins can manage all orders" ON public.orders
    FOR ALL USING (public.get_my_role() = 'admin');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping orders policies: %', SQLERRM;
END $$;

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 7. ORDER ITEMS TABLE ───────────────────
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_price decimal(10,2) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Store owners can view order items" ON public.order_items;
  CREATE POLICY "Store owners can view order items" ON public.order_items
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.orders o
        JOIN public.stores s ON s.id = o.store_id
        WHERE o.id = order_id AND s.user_id = auth.uid()
      )
    );

  DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
  CREATE POLICY "Anyone can insert order items" ON public.order_items
    FOR INSERT WITH CHECK (true);

  DROP POLICY IF EXISTS "Admins can manage all order items" ON public.order_items;
  CREATE POLICY "Admins can manage all order items" ON public.order_items
    FOR ALL USING (public.get_my_role() = 'admin');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping order_items policies: %', SQLERRM;
END $$;

-- ─── 8. PAYMENTS TABLE ───────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
  method text NOT NULL,
  receipt_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Store owners can view payments" ON public.payments;
  CREATE POLICY "Store owners can view payments" ON public.payments
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.orders o
        JOIN public.stores s ON s.id = o.store_id
        WHERE o.id = order_id AND s.user_id = auth.uid()
      )
    );

  DROP POLICY IF EXISTS "Anyone can insert payments" ON public.payments;
  CREATE POLICY "Anyone can insert payments" ON public.payments
    FOR INSERT WITH CHECK (true);

  DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;
  CREATE POLICY "Admins can manage all payments" ON public.payments
    FOR ALL USING (public.get_my_role() = 'admin');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping payments policies: %', SQLERRM;
END $$;

-- ─── 9. SUBSCRIPTIONS TABLE ───────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan text NOT NULL CHECK (plan IN ('basic', 'pro', 'premium')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  receipt_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "subscriptions_select" ON public.subscriptions;
  CREATE POLICY "subscriptions_select" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id OR public.get_my_role() = 'admin');

  DROP POLICY IF EXISTS "subscriptions_insert" ON public.subscriptions;
  CREATE POLICY "subscriptions_insert" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id OR public.get_my_role() = 'admin');

  DROP POLICY IF EXISTS "subscriptions_update" ON public.subscriptions;
  CREATE POLICY "subscriptions_update" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id OR public.get_my_role() = 'admin')
    WITH CHECK (auth.uid() = user_id OR public.get_my_role() = 'admin');

  DROP POLICY IF EXISTS "subscriptions_delete" ON public.subscriptions;
  CREATE POLICY "subscriptions_delete" ON public.subscriptions
    FOR DELETE USING (public.get_my_role() = 'admin');

  DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;
  CREATE POLICY "Admins can manage all subscriptions" ON public.subscriptions
    FOR ALL USING (public.get_my_role() = 'admin');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping subscriptions policies: %', SQLERRM;
END $$;

-- ─── 10. DOCUMENTS TABLE ───────────────────
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('national_id', 'commercial_register', 'tax_card')),
  file_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, type)
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can manage own documents" ON public.documents;
  CREATE POLICY "Users can manage own documents" ON public.documents
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Admins can manage all documents" ON public.documents;
  CREATE POLICY "Admins can manage all documents" ON public.documents
    FOR ALL USING (public.get_my_role() = 'admin');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping documents policies: %', SQLERRM;
END $$;

-- ─── 11. PAYMENT METHODS TABLE ───────────────────
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL UNIQUE,
  method text NOT NULL CHECK (method IN ('instapay', 'bank_transfer', 'card')),
  account_number text,
  account_holder text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Store owners can manage payment methods" ON public.payment_methods;
  CREATE POLICY "Store owners can manage payment methods" ON public.payment_methods
    FOR ALL USING (
      EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
    )
    WITH CHECK (
      EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid())
    );

  DROP POLICY IF EXISTS "Admins can manage all payment methods" ON public.payment_methods;
  CREATE POLICY "Admins can manage all payment methods" ON public.payment_methods
    FOR ALL USING (public.get_my_role() = 'admin');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping payment_methods policies: %', SQLERRM;
END $$;

DROP TRIGGER IF EXISTS payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── 12. STORAGE BUCKET POLICIES ───────────────────
DO $$
BEGIN
  DROP POLICY IF EXISTS "Authenticated users can upload to store-logos" ON storage.objects;
  DROP POLICY IF EXISTS "Public can read store-logos" ON storage.objects;
  DROP POLICY IF EXISTS "Users can manage their store-logos" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their store-logos" ON storage.objects;

  CREATE POLICY "Authenticated users can upload to store-logos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'store-logos' AND auth.role() = 'authenticated');

  CREATE POLICY "Public can read store-logos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'store-logos');

  CREATE POLICY "Users can manage their store-logos"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'store-logos' AND auth.role() = 'authenticated');

  CREATE POLICY "Users can delete their store-logos"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'store-logos' AND auth.role() = 'authenticated');
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping storage policies: %', SQLERRM;
END $$;

-- ─── 13. AUTH TRIGGER ───────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'merchant')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ─── RELOAD SCHEMA CACHE ───────────────────
NOTIFY pgrst, 'reload schema';
