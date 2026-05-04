-- ============================================================
-- FIX: Grant public schema permissions to anon and authenticated roles
-- Resolves "permission denied for schema public" errors in app server data fetching
-- ============================================================

DO $$
BEGIN
  -- Ensure schema usage for both anonymous and authenticated roles
  GRANT USAGE ON SCHEMA public TO anon;
  GRANT USAGE ON SCHEMA public TO authenticated;

  -- Grant table access to both roles; RLS policies still apply for row-level control
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

  -- Grant sequence usage for generated IDs
  GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
  GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

  -- Ensure future tables and sequences inherit the same privileges
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO anon;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO authenticated;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping schema permission fix: %', SQLERRM;
END $$;

NOTIFY pgrst, 'reload schema';
