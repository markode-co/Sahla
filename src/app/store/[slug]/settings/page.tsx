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
    title: store?.name ? `الإعدادات - ${store.name}` : "الإعدادات",
    description: store?.name ? `تحكم في إعدادات المتجر ضمن ${store.name}` : "صفحة الإعدادات",
  };
}

export default async function StoreSettingsPage({ params }: Props) {
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
        <h1 className="text-2xl font-bold text-gray-900">الإعدادات</h1>
        <p className="text-gray-500 mt-1">إدارة تفضيلات المتجر وطرق الاتصال الخاصة بك.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900">الإشعارات</h2>
          <p className="mt-3 text-sm text-gray-600">
            ستصل الإشعارات إلى حسابك عند تفعيل بيانات الاتصال، أو عند توفر تنبيهات جديدة من المتجر.
          </p>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900">الخصوصية والأمان</h2>
          <p className="mt-3 text-sm text-gray-600">
            يمكنك تحديث بياناتك لاحقًا بعد تسجيل الدخول للحفاظ على سريتها وراحة التسوق.
          </p>
        </div>
      </div>

      <div className="card p-6 border-dashed border-2 border-gray-200 text-sm text-gray-500">
        <p>هذه الصفحة جاهزة لاستقبال إعدادات إضافية مثل تهيئة طرق الدفع، حالة التفعيل، وسياسات المتجر.</p>
      </div>
    </div>
  );
}
