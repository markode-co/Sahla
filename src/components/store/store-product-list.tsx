"use client";

import { useMemo, useState } from "react";
import { Search, Filter, ArrowRight } from "lucide-react";
import { ProductGrid } from "@/components/store/product-grid";
import type { Product, Store } from "@/types";

interface StoreProductListProps {
  storeSlug: string;
  store: Store;
  products: Product[];
}

const filters = [
  { id: "all", label: "الكل" },
  { id: "available", label: "المتوفر" },
  { id: "out-of-stock", label: "نفدت الكمية" },
];

export function StoreProductList({ storeSlug, store, products }: StoreProductListProps) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">("newest");

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesQuery = product.name
          .toLowerCase()
          .includes(query.toLowerCase().trim());
        if (!matchesQuery) return false;

        if (activeFilter === "available") {
          return product.stock > 0;
        }
        if (activeFilter === "out-of-stock") {
          return product.stock === 0;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === "price_asc") {
          return a.price - b.price;
        }
        return b.price - a.price;
      });
  }, [products, query, activeFilter, sortBy]);

  return (
    <div>
      <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/50 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">متجر</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">{store.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{store.description || "تصفح المنتجات واختر الأفضل لك."}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-3xl bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm">
            <Filter className="w-4 h-4" />
            <span>{filteredProducts.length} نتائج</span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن منتج أو علامة تجارية"
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-3 pr-12 pl-12 text-sm text-slate-900 outline-none transition focus:border-primary-500 focus:bg-white"
            />
          </label>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`rounded-3xl border px-3 py-3 text-sm font-medium transition ${
                activeFilter === "all"
                  ? "border-primary-600 bg-primary-50 text-primary-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("available")}
              className={`rounded-3xl border px-3 py-3 text-sm font-medium transition ${
                activeFilter === "available"
                  ? "border-primary-600 bg-primary-50 text-primary-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              متوفر
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("out-of-stock")}
              className={`rounded-3xl border px-3 py-3 text-sm font-medium transition ${
                activeFilter === "out-of-stock"
                  ? "border-primary-600 bg-primary-50 text-primary-700"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              نفد
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <span>ترتيب حسب:</span>
          <button
            type="button"
            onClick={() => setSortBy("newest")}
            className={`rounded-full px-4 py-2 transition ${
              sortBy === "newest"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            الأحدث
          </button>
          <button
            type="button"
            onClick={() => setSortBy("price_asc")}
            className={`rounded-full px-4 py-2 transition ${
              sortBy === "price_asc"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            الأقل سعرًا
          </button>
          <button
            type="button"
            onClick={() => setSortBy("price_desc")}
            className={`rounded-full px-4 py-2 transition ${
              sortBy === "price_desc"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            الأعلى سعرًا
          </button>
        </div>
      </div>

      <div className="mt-6">
        <ProductGrid products={filteredProducts} storeId={store.id} storeSlug={storeSlug} />
      </div>
    </div>
  );
}
