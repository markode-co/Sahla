# Sahla - Setup Guide

## 1. Install Dependencies

```bash
npm install
```

## 2. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **SQL Editor** and run the contents of `src/lib/supabase/schema.sql`
3. Go to **Storage** and create 3 buckets:
   - `documents` (private) — for merchant ID documents
   - `products` (public) — for product images
   - `receipts` (private) — for payment receipts

4. For each bucket, add storage policies:

**products bucket (public read):**
```sql
CREATE POLICY "Public read products" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Auth upload products" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products' AND auth.uid() IS NOT NULL);
```

**documents bucket:**
```sql
CREATE POLICY "Owner upload docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);
CREATE POLICY "Owner read docs" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admin read docs" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
```

**receipts bucket:**
```sql
CREATE POLICY "Anyone upload receipts" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'receipts');
CREATE POLICY "Store owner read receipts" ON storage.objects FOR SELECT USING (bucket_id = 'receipts');
```

## 3. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Get these from: Supabase Dashboard → Settings → API

## 4. Create Admin User

1. Register a normal account at `/register`
2. In Supabase SQL Editor, run:
```sql
UPDATE public.users SET role = 'admin' WHERE email = 'your-admin@email.com';
```

## 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 6. Deploy to Vercel

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## Project Structure

```
src/
├── app/
│   ├── (auth)/login        # Login page
│   ├── (auth)/register     # Register page
│   ├── onboarding/         # 4-step merchant onboarding
│   ├── dashboard/
│   │   ├── merchant/       # Merchant dashboard
│   │   └── admin/          # Admin dashboard
│   └── store/[slug]/       # Public store pages
├── components/
│   ├── ui/                 # Badge, Modal, StatsCard
│   ├── dashboard/          # Sidebar
│   └── store/              # ProductCard, CartButton, etc.
├── actions/                # Server actions
├── lib/supabase/           # Supabase clients + schema
├── store/                  # Zustand cart store
└── types/                  # TypeScript types
```

## User Flows

### Merchant Flow
1. Register → `/register`
2. Verify email
3. Setup store → `/onboarding/store-setup`
4. Set payment methods → `/onboarding/payment`
5. Upload documents → `/onboarding/documents`
6. Subscribe → `/onboarding/subscription`
7. Dashboard → `/dashboard/merchant`

### Admin Flow
1. Login with admin account
2. Review merchants at `/dashboard/admin/merchants`
3. Approve/reject stores
4. Manage subscriptions

### Customer Flow
1. Visit store → `/store/[slug]`
2. Browse products
3. Add to cart
4. Checkout → `/store/[slug]/checkout`
5. Fill form + choose payment + upload receipt
