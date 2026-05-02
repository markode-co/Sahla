import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getOrderStatusLabel, getPaymentMethodLabel } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: orders } = await supabase
    .from("orders")
    .select(`*, stores(name, slug), order_items(*), payments(*)`)
    .order("created_at", { ascending: false });

  const statusVariantMap: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
    pending: "warning",
    approved: "success",
    rejected: "danger",
    cancelled: "default",
    delivered: "info",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">جميع الطلبات</h1>
        <p className="text-gray-500 mt-1">{orders?.length ?? 0} طلب إجمالي</p>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="card p-16 text-center">
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <p className="text-gray-400">لا توجد طلبات بعد</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">الطلب</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">المتجر</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">العميل</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">المبلغ</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">الدفع</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">الحالة</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-gray-400">#{order.id.slice(0, 8)}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {(order.stores as { name: string } | null)?.name ?? "-"}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                      <p className="text-xs text-gray-400">{order.customer_phone}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {getPaymentMethodLabel(order.payment_method)}
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
        </div>
      )}
    </div>
  );
}
