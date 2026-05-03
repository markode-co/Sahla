-- ============================================================
-- Auth Trigger: Auto-create public.users on signup
-- This ensures every authenticated user has a matching record
-- in the public.users table
-- ============================================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the trigger function
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

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Sync existing auth.users that don't have public.users records
-- (handles manual registrations before this trigger was created)
-- ============================================================
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

-- Verify the trigger works
NOTIFY pgrst, 'reload schema';
