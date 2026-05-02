import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatsCard } from "@/components/ui/stats-card";
import { Users, ShoppingCart, CreditCard, Clock, TrendingUp } from "lucide-react";
import { getAdminStats } from "@/actions/admin";
import { formatCurrency, formatDate, getOrderStatusLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/dashboard/merchant");

  const stats = await getAdminStats();

  const { data: recentOrders } = await supabase
    .from("orders")
    .select("*, stores(name)")
    .order("created_at", { ascending: false })
    .limit(5);

  const statusVariantMap: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
    pending: "warning",
    approved: "success",
    rejected: "danger",
    cancelled: "default",
    delivered: "info",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">لوحة تحكم المدير</h1>
        <p className="text-gray-500 mt-1">نظرة عامة على المنصة</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard title="إجمالي التجار" value={stats.totalMerchants} icon={Users} color="blue" />
        <StatsCard title="إجمالي الطلبات" value={stats.totalOrders} icon={ShoppingCart} color="purple" />
        <StatsCard title="الاشتراكات النشطة" value={stats.activeSubscriptions} icon={CreditCard} color="green" />
        <StatsCard title="متاجر تنتظر الموافقة" value={stats.pendingStores} icon={Clock} color="yellow" />
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="section-title">إجمالي الإيرادات</h2>
          <TrendingUp className="w-5 h-5 text-green-500" />
        </div>
        <p className="text-4xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
        <p className="text-sm text-gray-400 mt-1">من الطلبات المقبولة والمسلمة</p>
      </div>

      <div className="card">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="section-title">آخر الطلبات</h2>
          <Link href="/dashboard/admin/orders" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            عرض الكل
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">العميل</th>
                <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">المتجر</th>
                <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">المبلغ</th>
                <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">الحالة</th>
                <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(recentOrders ?? []).map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.customer_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{(order.stores as { name: string } | null)?.name ?? "-"}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatCurrency(order.total_amount)}</td>
                  <td className="px-6 py-4">
                    <Badge variant={statusVariantMap[order.status] ?? "default"}>
                      {getOrderStatusLabel(order.status)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">{formatDate(order.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
