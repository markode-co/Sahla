-- ============================================================
-- Repair migration: constraints, policy fixes, data sync
-- ============================================================

-- 1. documents: one record per (user, type) — required for upsert onConflict
ALTER TABLE public.documents
  DROP CONSTRAINT IF EXISTS documents_user_type_key;
ALTER TABLE public.documents
  ADD CONSTRAINT documents_user_type_key UNIQUE (user_id, type);

-- 2. subscriptions insert policy: allow admins to insert for any user
--    (needed for admin updateSubscription server action)
DROP POLICY IF EXISTS "subscriptions_insert" ON public.subscriptions;
CREATE POLICY "subscriptions_insert" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.get_my_role() = 'admin');

DROP POLICY IF EXISTS "subscriptions_delete" ON public.subscriptions;
CREATE POLICY "subscriptions_delete" ON public.subscriptions
  FOR DELETE USING (public.get_my_role() = 'admin');

-- 3. Sync any auth.users not yet in public.users (covers manual registrations)
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

-- 4. Ensure admin role for ca.markode@gmail.com
UPDATE public.users
SET role = 'admin'
WHERE email = 'ca.markode@gmail.com';

-- 5. Auto-approve premium subscription for the admin account
INSERT INTO public.subscriptions (user_id, plan, status, started_at)
SELECT id, 'premium', 'active', now()
FROM public.users
WHERE email = 'ca.markode@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  status = 'active',
  plan   = 'premium';

-- 6. Remove duplicate stores if any remain before enforcing uniqueness
DELETE FROM public.stores
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.stores
  ORDER BY user_id, created_at ASC
);

-- 7. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
