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
    title: store?.name ? `الملف الشخصي - ${store.name}` : "الملف الشخصي",
    description: store?.name ? `عرض إعدادات الملف الشخصي في ${store.name}` : "صفحة الملف الشخصي",
  };
}

export default async function StoreProfilePage({ params }: Props) {
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
        <h1 className="text-2xl font-bold text-gray-900">الملف الشخصي</h1>
        <p className="text-gray-500 mt-1">هذا القسم مخصص لعرض بيانات العميل ومعلومات الحساب.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900">معلومات الحساب</h2>
          <div className="mt-4 space-y-3 text-sm text-gray-600">
            <p>الاسم الكامل: <span className="font-medium text-gray-900">-</span></p>
            <p>البريد الإلكتروني: <span className="font-medium text-gray-900">-</span></p>
            <p>رقم الهاتف: <span className="font-medium text-gray-900">-</span></p>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900">عنوان الشحن</h2>
          <div className="mt-4 space-y-3 text-sm text-gray-600">
            <p>العنوان: <span className="font-medium text-gray-900">-</span></p>
            <p>المدينة: <span className="font-medium text-gray-900">-</span></p>
            <p>الرمز البريدي: <span className="font-medium text-gray-900">-</span></p>
          </div>
        </div>
      </div>

      <div className="card p-6 border-l-4 border-primary-500 bg-primary-50">
        <p className="text-sm text-primary-900">
          قم بتسجيل الدخول أو إنشاء حساب للعميل لحفظ البيانات الشخصية والعناوين وتسهيل عملية الشراء لاحقًا.
        </p>
      </div>
    </div>
  );
}
