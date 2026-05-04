import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatsCard } from "@/components/ui/stats-card";
import { Package, ShoppingCart, TrendingUp, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate, getOrderStatusLabel, getOrderStatusColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default async function MerchantDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!store) redirect("/onboarding/store-setup");

  const [productsRes, ordersRes] = await Promise.all([
    supabase.from("products").select("id", { count: "exact" }).eq("store_id", store.id),
    supabase.from("orders").select("*").eq("store_id", store.id).order("created_at", { ascending: false }),
  ]);

  const orders = ordersRes.data ?? [];
  const totalRevenue = orders
    .filter((o) => o.status === "approved" || o.status === "delivered")
    .reduce(
      (sum, o) => sum + Number(o.total_amount ?? 0),
      0
    );
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const recentOrders = orders.slice(0, 5);

  const statusVariantMap: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
    pending: "warning",
    approved: "success",
    rejected: "danger",
    cancelled: "default",
    delivered: "info",
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">مرحباً، {store.name} 👋</h1>
          <p className="text-gray-500 mt-1">إليك ملخص متجرك اليوم</p>
        </div>
        <Link
          href={`/store/${store.slug}`}
          target="_blank"
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <ExternalLink className="w-4 h-4" />
          عرض المتجر
        </Link>
      </div>

      {/* Store status */}
      {store.status === "pending" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-800">متجرك قيد المراجعة</p>
            <p className="text-sm text-yellow-600 mt-0.5">
              يتم مراجعة مستنداتك وسيتم تفعيل متجرك خلال 24-48 ساعة
            </p>
          </div>
        </div>
      )}

      {store.status === "rejected" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="font-semibold text-red-800">تم رفض المتجر</p>
          <p className="text-sm text-red-600 mt-1">{store.rejection_reason ?? "تواصل مع الدعم لمزيد من المعلومات"}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="إجمالي المنتجات"
          value={productsRes.count ?? 0}
          icon={Package}
          color="blue"
        />
        <StatsCard
          title="إجمالي الطلبات"
          value={orders.length}
          icon={ShoppingCart}
          color="purple"
        />
        <StatsCard
          title="طلبات معلقة"
          value={pendingOrders}
          icon={Clock}
          color="yellow"
        />
        <StatsCard
          title="الإيرادات"
          value={formatCurrency(totalRevenue)}
          icon={TrendingUp}
          color="green"
        />
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="section-title">آخر الطلبات</h2>
          <Link href="/dashboard/merchant/orders" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            عرض الكل
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد طلبات بعد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">العميل</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">المبلغ</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">الحالة</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 text-sm">{order.customer_name}</p>
                      <p className="text-xs text-gray-400">{order.customer_phone}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={statusVariantMap[order.status] ?? "default"}>
                        {getOrderStatusLabel(order.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
