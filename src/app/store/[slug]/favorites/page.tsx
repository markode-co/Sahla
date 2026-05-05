import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FavoritesPageClient } from "@/components/store/favorites-page-client";
import type { Product, Store } from "@/types";

interface Props {
  params: {
    slug: string;
  };
}

export default async function FavoritesPage({ params }: Props) {
  const { slug } = params;
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
    .eq("is_active", true);

  return (
    <FavoritesPageClient
      storeSlug={slug}
      products={(products ?? []) as Product[]}
      store={store as Store}
    />
  );
}
