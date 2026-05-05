"use client";

import { useMemo } from "react";
import type { Product, Store } from "@/types";
import { useFavorites } from "@/hooks/use-favorites";
import { ProductGrid } from "@/components/store/product-grid";

interface FavoritesPageClientProps {
  storeSlug: string;
  products: Product[];
  store: Store;
}

export function FavoritesPageClient({ storeSlug, products, store }: FavoritesPageClientProps) {
  const { favorites } = useFavorites(storeSlug);

  const favoriteProducts = useMemo(
    () => products.filter((product) => favorites.includes(product.id)),
    [favorites, products]
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">المفضلات</h1>
            <p className="text-sm text-slate-500">عرض المنتجات التي أضفتها إلى المفضلة.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={store.custom_domain ? "/" : `/store/${store.slug}`}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              العودة إلى المتجر
            </a>
          </div>
        </div>

        {favoriteProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            <p className="text-lg font-medium text-slate-900">لا توجد منتجات في المفضلة بعد</p>
            <p className="mt-2 text-sm">اضغط على قلب المنتج لإضافته إلى المفضلة.</p>
          </div>
        ) : (
          <ProductGrid products={favoriteProducts} storeId={store.id} storeSlug={store.slug} />
        )}
      </div>
    </div>
  );
}
