import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckoutForm } from "./checkout-form";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CheckoutPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .eq("status", "approved")
    .single();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/store/${slug}/login?next=/store/${slug}/checkout`);
  }

  if (!store) notFound();

  const { data: paymentMethod } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("store_id", store.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <a href={`/store/${slug}`} className="text-gray-400 hover:text-gray-600 text-sm">
            ← العودة للمتجر
          </a>
          <span className="text-gray-300">/</span>
          <span className="text-gray-700 font-medium text-sm">إتمام الطلب</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">إتمام الطلب</h1>
        <CheckoutForm
          storeId={store.id}
          storeSlug={slug}
          storeName={store.name}
          paymentMethod={paymentMethod}
        />
      </div>
    </div>
  );
}
