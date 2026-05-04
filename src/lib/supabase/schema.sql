-- ============================================================
-- FULL SCHEMA — canonical reference, matches migration 20260503200000
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  SELECT
    CASE
      WHEN email = 'ca.markode@gmail.com' THEN 'admin'
      ELSE role
    END
  FROM public.users
  WHERE id = auth.uid();
$$;

-- =====================
-- USERS
-- =====================
CREATE TABLE IF NOT EXISTS public.users (
  id          uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email       text NOT NULL,
  full_name   text,
  phone       text,
  role        text NOT NULL DEFAULT 'merchant' CHECK (role IN ('admin', 'merchant')),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own data"  ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
CREATE POLICY "Users can read own data"   ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can read all users" ON public.users FOR SELECT USING (public.get_my_role() = 'admin');

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================
-- STORES
-- =====================
CREATE TABLE IF NOT EXISTS public.stores (
  id               uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name             text NOT NULL,
  slug             text UNIQUE NOT NULL,
  description      text,
  logo_url         text,
  logo_color       text DEFAULT '#0ea5e9',
  logo_initials    text,
  status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store owners can manage their store" ON public.stores;
DROP POLICY IF EXISTS "Public can read approved stores"     ON public.stores;
DROP POLICY IF EXISTS "Admins can manage all stores"        ON public.stores;
CREATE POLICY "Store owners can manage their store" ON public.stores
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public can read approved stores" ON public.stores
  FOR SELECT USING (status = 'approved');
CREATE POLICY "Admins can manage all stores" ON public.stores
  FOR ALL USING (public.get_my_role() = 'admin');

DROP TRIGGER IF EXISTS stores_updated_at ON public.stores;
CREATE TRIGGER stores_updated_at BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================
-- PRODUCTS
-- =====================
CREATE TABLE IF NOT EXISTS public.products (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id    uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  name        text NOT NULL,
  description text,
  price       decimal(10,2) NOT NULL CHECK (price >= 0),
  stock       integer DEFAULT 0,
  image_url   text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store owners manage their products" ON public.products;
DROP POLICY IF EXISTS "Public can read active products"    ON public.products;
DROP POLICY IF EXISTS "Admins can manage all products"     ON public.products;
CREATE POLICY "Store owners manage their products" ON public.products
  FOR ALL USING (EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid()));
CREATE POLICY "Public can read active products" ON public.products
  FOR SELECT USING (is_active = true AND EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND status = 'approved'));
CREATE POLICY "Admins can manage all products" ON public.products
  FOR ALL USING (public.get_my_role() = 'admin');

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================
-- ORDERS
-- =====================
CREATE TABLE IF NOT EXISTS public.orders (
  id               uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id         uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  customer_name    text NOT NULL,
  customer_phone   text NOT NULL,
  customer_address text NOT NULL,
  customer_email   text,
  status           text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'delivered')),
  payment_method   text NOT NULL
                   CHECK (payment_method IN ('instapay', 'bank_transfer', 'cash_on_delivery')),
  notes            text,
  total_amount     decimal(10,2) NOT NULL DEFAULT 0,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store owners can manage their orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert orders"             ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all orders"         ON public.orders;
CREATE POLICY "Store owners can manage their orders" ON public.orders
  FOR ALL USING (EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid()));
CREATE POLICY "Anyone can insert orders" ON public.orders
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage all orders" ON public.orders
  FOR ALL USING (public.get_my_role() = 'admin');

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================
-- ORDER ITEMS
-- =====================
CREATE TABLE IF NOT EXISTS public.order_items (
  id            uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id      uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id    uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name  text NOT NULL,
  product_price decimal(10,2) NOT NULL,
  quantity      integer NOT NULL CHECK (quantity > 0),
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store owners can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can insert order items"     ON public.order_items;
DROP POLICY IF EXISTS "Admins can manage all order items" ON public.order_items;
CREATE POLICY "Store owners can view order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o JOIN public.stores s ON s.id = o.store_id
            WHERE o.id = order_id AND s.user_id = auth.uid())
  );
CREATE POLICY "Anyone can insert order items" ON public.order_items
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage all order items" ON public.order_items
  FOR ALL USING (public.get_my_role() = 'admin');

-- =====================
-- PAYMENTS
-- =====================
CREATE TABLE IF NOT EXISTS public.payments (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id    uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL UNIQUE,
  method      text NOT NULL,
  receipt_url text,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store owners can view payments" ON public.payments;
DROP POLICY IF EXISTS "Anyone can insert payments"     ON public.payments;
DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;
CREATE POLICY "Store owners can view payments" ON public.payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o JOIN public.stores s ON s.id = o.store_id
            WHERE o.id = order_id AND s.user_id = auth.uid())
  );
CREATE POLICY "Anyone can insert payments" ON public.payments
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage all payments" ON public.payments
  FOR ALL USING (public.get_my_role() = 'admin');

-- =====================
-- SUBSCRIPTIONS
-- =====================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan        text NOT NULL CHECK (plan IN ('basic', 'pro', 'premium')),
  status      text NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  receipt_url text,
  started_at  timestamptz DEFAULT now(),
  expires_at  timestamptz,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own subscription"     ON public.subscriptions;
DROP POLICY IF EXISTS "Users can upsert own subscription"   ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_select"                ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert"                ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_update"                ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_delete"                ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;

CREATE POLICY "subscriptions_select" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id OR public.get_my_role() = 'admin');
CREATE POLICY "subscriptions_insert" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.get_my_role() = 'admin');
CREATE POLICY "subscriptions_update" ON public.subscriptions
  FOR UPDATE
  USING     (auth.uid() = user_id OR public.get_my_role() = 'admin')
  WITH CHECK (auth.uid() = user_id OR public.get_my_role() = 'admin');
CREATE POLICY "subscriptions_delete" ON public.subscriptions
  FOR DELETE USING (public.get_my_role() = 'admin');
CREATE POLICY "Admins can manage all subscriptions" ON public.subscriptions
  FOR ALL USING (public.get_my_role() = 'admin');

-- =====================
-- DOCUMENTS
-- =====================
CREATE TABLE IF NOT EXISTS public.documents (
  id         uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type       text NOT NULL CHECK (type IN ('national_id', 'commercial_register', 'tax_card')),
  file_url   text NOT NULL,
  status     text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_user_type_key;
ALTER TABLE public.documents ADD CONSTRAINT documents_user_type_key UNIQUE (user_id, type);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own documents"  ON public.documents;
DROP POLICY IF EXISTS "Admins can manage all documents" ON public.documents;
CREATE POLICY "Users can manage own documents"  ON public.documents
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all documents" ON public.documents
  FOR ALL USING (public.get_my_role() = 'admin');

-- =====================
-- PAYMENT METHODS
-- =====================
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id                  uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_id            uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL UNIQUE,
  method              text NOT NULL CHECK (method IN ('instapay', 'bank_transfer', 'cash_on_delivery')),
  instapay_username   text,
  bank_name           text,
  bank_account_number text,
  bank_account_name   text,
  cash_on_delivery    boolean DEFAULT false,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Store owners can manage payment methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Public can read payment methods"         ON public.payment_methods;
CREATE POLICY "Store owners can manage payment methods" ON public.payment_methods
  FOR ALL
  USING     (EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND user_id = auth.uid()));
CREATE POLICY "Public can read payment methods" ON public.payment_methods
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND status = 'approved'));

DROP TRIGGER IF EXISTS payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER payment_methods_updated_at BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================
-- TRIGGER: auto-create user profile on signup
-- =====================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone, role)
  VALUES (
    NEW.id, NEW.email,
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- STORAGE BUCKETS
-- =====================
INSERT INTO storage.buckets (id, name, public) VALUES ('store-logos', 'store-logos', true)  ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('products',    'products',    true)  ON CONFLICT (id) DO UPDATE SET public = true;
INSERT INTO storage.buckets (id, name, public) VALUES ('documents',   'documents',   false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts',    'receipts',    true)  ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Authenticated users can upload store logos"    ON storage.objects;
DROP POLICY IF EXISTS "Public can view store logos"                   ON storage.objects;
DROP POLICY IF EXISTS "Store owners can update their logo"            ON storage.objects;
DROP POLICY IF EXISTS "Store owners can delete their logo"            ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view product images"                ON storage.objects;
DROP POLICY IF EXISTS "Store owners can update product images"        ON storage.objects;
DROP POLICY IF EXISTS "Store owners can delete product images"        ON storage.objects;
DROP POLICY IF EXISTS "Merchants can upload documents"                ON storage.objects;
DROP POLICY IF EXISTS "Document owners can view their documents"      ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all documents"                 ON storage.objects;
DROP POLICY IF EXISTS "Customers can upload payment receipts"         ON storage.objects;
DROP POLICY IF EXISTS "Store owners can view payment receipts"        ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload receipts"       ON storage.objects;
DROP POLICY IF EXISTS "Public can view receipts"                      ON storage.objects;

CREATE POLICY "Authenticated users can upload store logos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'store-logos' AND auth.uid() IS NOT NULL);
CREATE POLICY "Public can view store logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'store-logos');
CREATE POLICY "Store owners can update their logo" ON storage.objects
  FOR UPDATE USING (bucket_id = 'store-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Store owners can delete their logo" ON storage.objects
  FOR DELETE USING (bucket_id = 'store-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'products' AND auth.uid() IS NOT NULL);
CREATE POLICY "Public can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Store owners can update product images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Store owners can delete product images" ON storage.objects
  FOR DELETE USING (bucket_id = 'products' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Merchants can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);
CREATE POLICY "Document owners can view their documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins can view all documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND public.get_my_role() = 'admin');

CREATE POLICY "Authenticated users can upload receipts" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'receipts' AND auth.uid() IS NOT NULL);
CREATE POLICY "Public can view receipts" ON storage.objects
  FOR SELECT USING (bucket_id = 'receipts');

NOTIFY pgrst, 'reload schema';
