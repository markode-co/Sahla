import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { ProductGrid } from "@/components/store/product-grid";
import { CartButton } from "@/components/store/cart-button";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("name, description")
    .eq("slug", slug)
    .eq("status", "approved")
    .single();

  if (!store) return { title: "متجر غير موجود" };

  return {
    title: store.name,
    description: store.description ?? `تسوق من ${store.name}`,
    openGraph: {
      title: store.name,
      description: store.description ?? `تسوق من ${store.name}`,
    },
  };
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .eq("status", "approved")
    .single();

  if (!store) notFound();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", store.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const { data: paymentMethod } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("store_id", store.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">المنتجات</h2>
            <p className="text-sm text-gray-500">{products?.length ?? 0} منتج متاح</p>
          </div>
          <CartButton storeSlug={slug} />
        </div>

        <ProductGrid
          products={products ?? []}
          storeId={store.id}
          storeSlug={store.slug}
        />
      </div>
    </div>
  );
}
