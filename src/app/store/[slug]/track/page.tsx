import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { OrderTrackingForm } from "./order-tracking-form";

interface Props {
  params: { slug: string };
  searchParams: { orderId?: string };
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
    title: store?.name ? `تتبع الطلب - ${store.name}` : "تتبع الطلب",
    description: store?.name ? `تحقق من حالة الطلب في ${store.name}` : "تحقق من حالة طلبك",
  };
}

export default async function TrackOrderPage({ params, searchParams }: Props) {
  const { slug } = params;
  const supabase = await createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("id, name")
    .eq("slug", slug)
    .eq("status", "approved")
    .single();

  if (!store) notFound();

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="page-title">تتبع الطلب</h1>
              <p className="text-gray-500 mt-1">
                أدخل رقم الطلب ورقم الهاتف لمعرفة حالة طلبك من {store.name}.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="btn-secondary inline-flex items-center justify-center px-4 py-2"
            >
              العودة إلى لوحة التحكم
            </Link>
          </div>
        </div>

        <OrderTrackingForm storeSlug={slug} initialOrderId={searchParams.orderId} />
      </div>
    </div>
  );
}
