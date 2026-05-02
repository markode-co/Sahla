"use client";

import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cart";
import Link from "next/link";

export function CartButton({ storeSlug }: { storeSlug: string }) {
  const totalItems = useCartStore((s) => s.getTotalItems());

  return (
    <Link
      href={`/store/${storeSlug}/checkout`}
      className="relative flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl transition-colors font-medium text-sm"
    >
      <ShoppingCart className="w-5 h-5" />
      السلة
      {totalItems > 0 && (
        <span className="absolute -top-2 -left-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </Link>
  );
}
