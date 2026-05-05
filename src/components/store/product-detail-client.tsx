"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Heart, Lock, Star, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { useFavorites } from "@/hooks/use-favorites";
import type { Product, Store } from "@/types";

interface ProductDetailClientProps {
  storeSlug: string;
  product: Product;
  store: Store;
}

const defaultSizes = [8, 10, 38, 40];

export function ProductDetailClient({ storeSlug, product, store }: ProductDetailClientProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [selectedSize, setSelectedSize] = useState<number>(defaultSizes[0]);
  const { isFavorite, toggleFavorite } = useFavorites(storeSlug);
  const favorite = isFavorite(product.id);

  const description = product.description || "هذا المنتج لا يحتوي على وصف حالياً.";
  const rating = useMemo(() => ({ value: 4.5, reviews: 20 }), []);

  const handleBuyNow = () => {
    addItem(product, product.store_id, storeSlug);
    toast.success("تمت إضافة المنتج إلى السلة");
    router.push(`/store/${storeSlug}/checkout`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="relative overflow-hidden bg-white shadow-sm">
        <div className="relative h-[55vh] max-h-[520px] min-h-[420px]">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gray-100 text-gray-400">
              صورة المنتج غير متاحة
            </div>
          )}
        </div>

        <div className="absolute left-4 top-4">
          <Link
            href={store.custom_domain ? "/" : `/store/${storeSlug}`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-slate-900 shadow-sm backdrop-blur transition hover:bg-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => toggleFavorite(product.id)}
          className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-red-500 shadow-sm backdrop-blur transition hover:bg-white"
        >
          <Heart className="w-5 h-5" fill={favorite ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="-mt-10 px-4 pb-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white p-5 shadow-xl shadow-slate-200/50 sm:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-slate-900">{product.name}</h1>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1 text-amber-500">
                    <Star className="w-4 h-4" />
                    {rating.value}
                  </span>
                  <span>({rating.reviews} تقييم)</span>
                </div>
              </div>
              <div className="rounded-3xl bg-slate-900 px-4 py-3 text-right text-lg font-semibold text-white">
                {formatCurrency(product.price)}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">الوصف</h2>
              <p className="text-sm leading-7 text-slate-600">{description}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">المقاس</p>
                  <p className="text-xs text-slate-500">اختر المقاس المناسب قبل الشراء</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                  {selectedSize}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {defaultSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`rounded-2xl border px-3 py-3 text-sm font-medium transition ${
                      selectedSize === size
                        ? "border-primary-600 bg-primary-50 text-primary-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    } ${size === 40 ? "opacity-50" : ""}`}
                    disabled={size === 40}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_72px]">
              <button
                type="button"
                onClick={handleBuyNow}
                className="inline-flex h-14 items-center justify-center rounded-3xl bg-primary-600 px-6 text-base font-semibold text-white transition hover:bg-primary-700"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                اشتري الآن
              </button>
              <button
                type="button"
                className="inline-flex h-14 items-center justify-center rounded-3xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300"
              >
                <Lock className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
