import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductDetailClient } from "@/components/store/product-detail-client";
import type { Product, Store } from "@/types";

interface Props {
  params: {
    slug: string;
    productId: string;
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug, productId } = params;
  const supabase = await createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .eq("status", "approved")
    .single();

  if (!store) notFound();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("store_id", store.id)
    .single();

  if (!product) notFound();

  return <ProductDetailClient storeSlug={slug} product={product as Product} store={store as Store} />;
}
