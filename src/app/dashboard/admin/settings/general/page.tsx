import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { StatsCard } from "@/components/ui/stats-card";
import { Store, ShoppingCart, CreditCard, Clock } from "lucide-react";

export default async function AdminGeneralSettings() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/login");

  const supabase = createAdminClient();

  const [storesCountRes, pendingStoresCountRes, ordersCountRes, subscriptionsCountRes] =
    await Promise.all([
      supabase.from("stores").select("id", { count: "exact", head: true }),
      supabase.from("stores").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
    ]);

  const totalStores = storesCountRes.count ?? 0;
  const pendingStores = pendingStoresCountRes.count ?? 0;
  const totalOrders = ordersCountRes.count ?? 0;
  const activeSubscriptions = subscriptionsCountRes.count ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">إعدادات عامة</h1>
        <p className="text-gray-500 mt-1">نظرة عامة على منصة المتاجر والإعدادات العامة.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatsCard title="إجمالي المتاجر" value={totalStores} icon={Store} color="blue" />
        <StatsCard title="متاجر بانتظار الموافقة" value={pendingStores} icon={Clock} color="yellow" />
        <StatsCard title="إجمالي الطلبات" value={totalOrders} icon={ShoppingCart} color="purple" />
        <StatsCard title="اشتراكات نشطة" value={activeSubscriptions} icon={CreditCard} color="green" />
      </div>

      <div className="card p-6">
        <h2 className="section-title">ملاحظات النظام</h2>
        <p className="text-gray-500 mt-2 leading-7">
          استخدم هذه الصفحة لمراقبة الحالة العامة للمنصة وإدارة الإجراءات السريعة. يمكنك الرجوع لصفحة الطلبات أو التجار لمراجعة التفاصيل.
        </p>
        <div className="grid gap-4 mt-6 sm:grid-cols-2">
          <Link href="/dashboard/admin/orders" className="card p-4 hover:bg-gray-50 transition">
            <h3 className="font-semibold text-gray-900">مراجعة الطلبات</h3>
            <p className="text-sm text-gray-500 mt-1">اطلع على حالة الطلبات وعالج الطلبات المعلقة مباشرة.</p>
          </Link>
          <Link href="/dashboard/admin/merchants" className="card p-4 hover:bg-gray-50 transition">
            <h3 className="font-semibold text-gray-900">مراجعة التجار</h3>
            <p className="text-sm text-gray-500 mt-1">راجع متاجر جديدة واطلع على حالة الاشتراكات والمستندات.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
