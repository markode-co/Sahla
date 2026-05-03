-- Update get_my_role function to support super admin
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