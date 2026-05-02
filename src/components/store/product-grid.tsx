"use client";

import { ShoppingBag } from "lucide-react";
import type { Product } from "@/types";
import { ProductCard } from "./product-card";

interface ProductGridProps {
  products: Product[];
  storeId: string;
  storeSlug: string;
}

export function ProductGrid({ products, storeId, storeSlug }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-200" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد منتجات بعد</h3>
        <p className="text-gray-400">سيتم إضافة المنتجات قريباً</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          storeId={storeId}
          storeSlug={storeSlug}
        />
      ))}
    </div>
  );
}
