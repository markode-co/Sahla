import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="page-title">إعدادات المدير</h1>
        <p className="text-gray-500 mt-1">إدارة إعدادات النظام أو حساب المدير</p>
      </div>
      <div className="space-y-4">
        <Link href="/dashboard/admin/settings/account" className="block card p-4 hover:bg-gray-50 transition">
          إعدادات الحساب
        </Link>
        <Link href="/dashboard/admin/settings/general" className="block card p-4 hover:bg-gray-50 transition">
          إعدادات عامة
        </Link>
        <Link href="/dashboard/admin/settings/payment" className="block card p-4 hover:bg-gray-50 transition">
          طرق الدفع للمنصة
        </Link>
      </div>
    </div>
  );
}
