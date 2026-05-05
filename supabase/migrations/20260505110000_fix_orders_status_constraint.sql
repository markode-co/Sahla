BEGIN;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
    CHECK (status IN ('pending', 'approved', 'received', 'preparing', 'on_the_way', 'rejected', 'cancelled', 'delivered'));

COMMIT;
