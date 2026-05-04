-- Add support for custom domain mapping for stores
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS custom_domain text UNIQUE;
