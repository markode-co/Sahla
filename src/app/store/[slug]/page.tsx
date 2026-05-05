import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { StoreProductList } from "@/components/store/store-product-list";
import { StoreHeaderHero } from "@/components/store/store-header-hero";
import { StoreBanner } from "@/components/store/store-banner";
import { CartButton } from "@/components/store/cart-button";
import type { Store, Product } from "@/types";

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

  // Mock banners data - في المستقبل يمكن إضافة جدول banners في قاعدة البيانات
  const banners = [
    {
      id: "1",
      image_url:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=400&fit=crop",
      title: "تخفيض خاص 20%",
      description: "على جميع المنتجات هذا الأسبوع فقط",
    },
    {
      id: "2",
      image_url:
        "https://images.unsplash.com/photo-1507842217343-583f20270319?w=1200&h=400&fit=crop",
      title: "منتجات جديدة وصلت",
      description: "اكتشف أحدث التصاميم والموديلات",
    },
    {
      id: "3",
      image_url:
        "https://images.unsplash.com/photo-1491896150444-eea07dba3ae8?w=1200&h=400&fit=crop",
      title: "عرض نهاية الموسم",
      description: "خصومات تصل إلى 50% على المختار",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <StoreHeaderHero storeSlug={slug} storeName={store.name} />
        <StoreBanner banners={banners} />
        <StoreProductList storeSlug={slug} store={store as Store} products={products ?? []} />
      </div>

      <div className="fixed bottom-4 right-4 z-40">
        <CartButton storeSlug={slug} />
      </div>
    </div>
  );
}
