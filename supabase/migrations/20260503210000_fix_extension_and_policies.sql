-- ============================================================
-- Fix UUID-OSSP Extension and Recreate Policies/Triggers
-- ============================================================

-- Ensure uuid-ossp extension is properly available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

-- ─── Helper: updated_at trigger function ──────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Helper: get_my_role (SECURITY DEFINER) ───────────────
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

-- ─── USERS TABLE - recreate missing policies ───────────────
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

-- ─── USERS TABLE - recreate missing trigger ───────────────
DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ─── STORES TABLE - recreate missing policies ───────────────
DROP POLICY IF EXISTS "Store owners can manage their store" ON public.stores;
CREATE POLICY "Store owners can manage their store"
  ON public.stores
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can read approved stores" ON public.stores;
CREATE POLICY "Public can read approved stores"
  ON public.stores
  FOR SELECT
  USING (status = 'approved');

DROP POLICY IF EXISTS "Admins can manage all stores" ON public.stores;
CREATE POLICY "Admins can manage all stores"
  ON public.stores
  USING (public.get_my_role() = 'admin');

-- ─── STORES TABLE - recreate missing trigger ───────────────
DROP TRIGGER IF EXISTS stores_updated_at ON public.stores;
CREATE TRIGGER stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
