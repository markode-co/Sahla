-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================
-- USERS (extends auth.users)
-- =====================
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  phone text,
  role text not null default 'merchant' check (role in ('admin', 'merchant')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.users enable row level security;

create policy "Users can read own data" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own data" on public.users
  for update using (auth.uid() = id);

create policy "Admins can read all users" on public.users
  for select using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- =====================
-- STORES
-- =====================
create table public.stores (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  description text,
  logo_url text,
  logo_color text default '#0ea5e9',
  logo_initials text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.stores enable row level security;

create policy "Store owners can manage their store" on public.stores
  for all using (auth.uid() = user_id);

create policy "Public can read approved stores" on public.stores
  for select using (status = 'approved');

create policy "Admins can manage all stores" on public.stores
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- =====================
-- PRODUCTS
-- =====================
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references public.stores(id) on delete cascade not null,
  name text not null,
  description text,
  price decimal(10,2) not null check (price >= 0),
  stock integer default 0,
  image_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.products enable row level security;

create policy "Store owners manage their products" on public.products
  for all using (
    exists (select 1 from public.stores where id = store_id and user_id = auth.uid())
  );

create policy "Public can read active products" on public.products
  for select using (
    is_active = true and
    exists (select 1 from public.stores where id = store_id and status = 'approved')
  );

create policy "Admins can manage all products" on public.products
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- =====================
-- ORDERS
-- =====================
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references public.stores(id) on delete cascade not null,
  customer_name text not null,
  customer_phone text not null,
  customer_address text not null,
  customer_email text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled', 'delivered')),
  payment_method text not null check (payment_method in ('instapay', 'bank_transfer', 'cash_on_delivery')),
  notes text,
  total_amount decimal(10,2) not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.orders enable row level security;

create policy "Store owners can manage their orders" on public.orders
  for all using (
    exists (select 1 from public.stores where id = store_id and user_id = auth.uid())
  );

create policy "Admins can manage all orders" on public.orders
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Anyone can insert orders" on public.orders
  for insert with check (true);

-- =====================
-- ORDER ITEMS
-- =====================
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_price decimal(10,2) not null,
  quantity integer not null check (quantity > 0),
  created_at timestamptz default now()
);

alter table public.order_items enable row level security;

create policy "Store owners can view order items" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      join public.stores s on s.id = o.store_id
      where o.id = order_id and s.user_id = auth.uid()
    )
  );

create policy "Anyone can insert order items" on public.order_items
  for insert with check (true);

create policy "Admins can manage all order items" on public.order_items
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- =====================
-- PAYMENTS
-- =====================
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null unique,
  method text not null,
  receipt_url text,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  created_at timestamptz default now()
);

alter table public.payments enable row level security;

create policy "Store owners can view payments" on public.payments
  for select using (
    exists (
      select 1 from public.orders o
      join public.stores s on s.id = o.store_id
      where o.id = order_id and s.user_id = auth.uid()
    )
  );

create policy "Anyone can insert payments" on public.payments
  for insert with check (true);

create policy "Admins can manage all payments" on public.payments
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- =====================
-- SUBSCRIPTIONS
-- =====================
create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null unique,
  plan text not null check (plan in ('basic', 'pro', 'premium')),
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  started_at timestamptz default now(),
  expires_at timestamptz,
  created_at timestamptz default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can read own subscription" on public.subscriptions
  for select using (auth.uid() = user_id);

create policy "Admins can manage all subscriptions" on public.subscriptions
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- =====================
-- DOCUMENTS
-- =====================
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null check (type in ('national_id', 'commercial_register', 'tax_card')),
  file_url text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now()
);

alter table public.documents enable row level security;

create policy "Users can manage own documents" on public.documents
  for all using (auth.uid() = user_id);

create policy "Admins can manage all documents" on public.documents
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- =====================
-- PAYMENT METHODS (merchant payment info)
-- =====================
create table public.payment_methods (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references public.stores(id) on delete cascade not null unique,
  instapay_username text,
  bank_name text,
  bank_account_number text,
  bank_account_name text,
  cash_on_delivery boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.payment_methods enable row level security;

create policy "Store owners can manage payment methods" on public.payment_methods
  for all using (
    exists (select 1 from public.stores where id = store_id and user_id = auth.uid())
  );

create policy "Public can read payment methods" on public.payment_methods
  for select using (
    exists (select 1 from public.stores where id = store_id and status = 'approved')
  );

-- =====================
-- TRIGGERS: updated_at
-- =====================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at before update on public.users
  for each row execute function update_updated_at();

create trigger stores_updated_at before update on public.stores
  for each row execute function update_updated_at();

create trigger products_updated_at before update on public.products
  for each row execute function update_updated_at();

create trigger orders_updated_at before update on public.orders
  for each row execute function update_updated_at();

-- =====================
-- TRIGGER: Auto-create user profile on signup
-- =====================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'role', 'merchant')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================
-- STORAGE BUCKETS (run in Supabase dashboard)
-- =====================
-- insert into storage.buckets (id, name, public) values ('documents', 'documents', false);
-- insert into storage.buckets (id, name, public) values ('products', 'products', true);
-- insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false);

-- Storage policies
-- create policy "Merchants can upload documents" on storage.objects
--   for insert with check (bucket_id = 'documents' and auth.uid() is not null);

-- create policy "Documents owners can view" on storage.objects
--   for select using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

-- create policy "Merchants can upload product images" on storage.objects
--   for insert with check (bucket_id = 'products' and auth.uid() is not null);

-- create policy "Public can view product images" on storage.objects
--   for select using (bucket_id = 'products');
