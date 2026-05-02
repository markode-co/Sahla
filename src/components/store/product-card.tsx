"use client";

import Image from "next/image";
import { ShoppingCart, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import toast from "react-hot-toast";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  storeId: string;
  storeSlug: string;
}

export function ProductCard({ product, storeId, storeSlug }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);

  function handleAddToCart() {
    addItem(product, storeId, storeSlug);
    toast.success(`تمت إضافة ${product.name} للسلة`);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="aspect-square relative bg-gray-50">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-gray-200" />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2 leading-tight">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-gray-400 mb-2 line-clamp-1">{product.description}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-primary-600 text-sm">
            {formatCurrency(product.price)}
          </span>
          <button
            onClick={handleAddToCart}
            className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
        {product.stock <= 5 && product.stock > 0 && (
          <p className="text-xs text-orange-500 mt-1">باقي {product.stock} فقط</p>
        )}
        {product.stock === 0 && (
          <p className="text-xs text-red-500 mt-1">نفذت الكمية</p>
        )}
      </div>
    </div>
  );
}
