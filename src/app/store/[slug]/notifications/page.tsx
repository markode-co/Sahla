import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("name")
    .eq("slug", slug)
    .eq("status", "approved")
    .single();

  return {
    title: store?.name ? `الإشعارات - ${store.name}` : "الإشعارات",
    description: store?.name ? `كل التنبيهات الخاصة بمتجر ${store.name}` : "صفحة الإشعارات",
  };
}

export default async function StoreNotificationsPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: store } = await supabase
    .from("stores")
    .select("name")
    .eq("slug", slug)
    .eq("status", "approved")
    .single();

  if (!store) notFound();

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">الإشعارات</h1>
            <p className="text-gray-500 mt-1">كل التنبيهات المتعلقة بمتجرك في {store.name}.</p>
          </div>
        </div>
      </div>

      <div className="card p-6 border-dashed border-2 border-gray-200 text-center">
        <p className="text-gray-500">لا توجد إشعارات جديدة في الوقت الحالي.</p>
        <p className="text-sm text-gray-400 mt-3">
          ستظهر هنا تنبيهات الطلبات، العروض، والتحديثات فور وصولها.
        </p>
      </div>
    </div>
  );
}
