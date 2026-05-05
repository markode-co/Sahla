"use client";

import { type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import toast from "react-hot-toast";
import { useFavorites } from "@/hooks/use-favorites";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  storeId: string;
  storeSlug: string;
}

export function ProductCard({ product, storeId, storeSlug }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const { isFavorite, toggleFavorite } = useFavorites(storeSlug);
  const favorite = isFavorite(product.id);

  function handleAddToCart() {
    addItem(product, storeId, storeSlug);
    toast.success(`تمت إضافة ${product.name} للسلة`);
  }

  const handleFavoriteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(product.id);
  };

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white transition-shadow hover:shadow-lg">
      <div className="relative overflow-hidden bg-gray-50 h-56 sm:h-64">
        <div className="absolute inset-0 z-0" />
        <Link
          href={`/store/${storeSlug}/product/${product.id}`}
          className="absolute inset-0 z-10"
          aria-label={`عرض تفاصيل ${product.name}`}
        />
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gray-100 text-gray-300">
            <Package className="w-10 h-10" />
          </div>
        )}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className="absolute right-3 top-3 z-20 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 text-gray-600 shadow-sm transition hover:bg-white"
        >
          <Heart
            className="w-5 h-5"
            fill={favorite ? "currentColor" : "none"}
          />
        </button>
      </div>

      <div className="p-4">
        <Link href={`/store/${storeSlug}/product/${product.id}`}>
          <h3 className="mb-2 text-sm font-semibold text-slate-900 line-clamp-2">{product.name}</h3>
        </Link>
        {product.description && (
          <p className="text-xs text-slate-500 mb-3 line-clamp-1">{product.description}</p>
        )}
        <div className="flex items-center justify-between gap-3">
          <span className="font-semibold text-primary-600">{formatCurrency(product.price)}</span>
          <button
            type="button"
            onClick={handleAddToCart}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-600 text-white transition hover:bg-primary-700"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
        {product.stock <= 5 && product.stock > 0 && (
          <p className="mt-3 text-xs text-orange-500">باقي {product.stock} فقط</p>
        )}
        {product.stock === 0 && (
          <p className="mt-3 text-xs text-red-500">نفذت الكمية</p>
        )}
      </div>
    </div>
  );
}
