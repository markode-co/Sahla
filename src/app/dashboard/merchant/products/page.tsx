import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { Plus, Package, Edit, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ProductActions } from "./product-actions";

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!store) redirect("/onboarding/store-setup");

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false });

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .single();

  const maxProducts =
    subscription?.plan === "basic" ? 20 : Infinity;
  const canAdd = (products?.length ?? 0) < maxProducts;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">المنتجات</h1>
          <p className="text-gray-500 mt-1">
            {products?.length ?? 0}{" "}
            {maxProducts !== Infinity ? `/ ${maxProducts}` : ""} منتج
          </p>
        </div>
        {canAdd ? (
          <Link
            href="/dashboard/merchant/products/new"
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            إضافة منتج
          </Link>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm px-4 py-2 rounded-xl">
            وصلت للحد الأقصى. قم بترقية خطتك
          </div>
        )}
      </div>

      {!products || products.length === 0 ? (
        <div className="card p-16 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد منتجات بعد</h3>
          <p className="text-gray-400 mb-6">أضف أول منتج لبدء البيع</p>
          <Link href="/dashboard/merchant/products/new" className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إضافة منتج
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map((product) => (
            <div key={product.id} className="card overflow-hidden group">
              <div className="aspect-square relative bg-gray-100">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                {!product.is_active && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">مخفي</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{product.name}</h3>
                <p className="text-primary-600 font-bold">{formatCurrency(product.price)}</p>
                <p className="text-xs text-gray-400 mt-1">المخزون: {product.stock}</p>
                <ProductActions product={product} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
