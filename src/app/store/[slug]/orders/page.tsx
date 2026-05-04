import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import OrderTrackingForm from "../track/order-tracking-form";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;
  const supabase = await createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("name")
    .eq("slug", slug)
    .eq("status", "approved")
    .single();

  return {
    title: store?.name ? `الطلبات - ${store.name}` : "طلبات المتجر",
    description: store?.name ? `تحقق من حالة الطلبات في ${store.name}` : "تابع طلباتك بسهولة.",
  };
}

export default async function StoreOrdersPage({ params }: Props) {
  const { slug } = params;
  const supabase = await createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("slug", slug)
    .eq("status", "approved")
    .single();

  if (!store) notFound();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">الطلبات</h1>
        <p className="text-gray-500 mt-1">ابحث عن الطلب الحالي أو تتبع حالة أي طلب برقم الطلب والهاتف.</p>
      </div>

      <OrderTrackingForm storeSlug={slug} />
    </div>
  );
}
