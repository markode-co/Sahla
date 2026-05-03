-- ============================================================
-- FIX: Grant schema permissions to authenticated role
-- This resolves 403 Forbidden and 42501 permission denied errors
-- ============================================================

-- Grant USAGE on public schema to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant SELECT, INSERT, UPDATE, DELETE on all tables to authenticated role
-- (RLS policies will still control access)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant USAGE on sequences for auto-incrementing IDs
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';