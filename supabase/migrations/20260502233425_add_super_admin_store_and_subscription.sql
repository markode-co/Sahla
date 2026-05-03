-- Add store and subscription for super admin
INSERT INTO public.subscriptions (user_id, plan, status, started_at)
SELECT id, 'premium', 'active', now()
FROM public.users
WHERE email = 'ca.markode@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = users.id);

INSERT INTO public.stores (user_id, name, slug, description, logo_color, status)
SELECT id, 'متجر الإدارة', 'admin-store', 'متجر خاص بالإدارة', '#0ea5e9', 'approved'
FROM public.users
WHERE email = 'ca.markode@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.stores WHERE user_id = users.id);