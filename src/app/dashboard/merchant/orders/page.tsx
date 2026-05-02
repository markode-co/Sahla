import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate, getOrderStatusLabel, getPaymentMethodLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { OrderStatusUpdater } from "./order-status-updater";
import { ShoppingCart, Receipt } from "lucide-react";

export default async function MerchantOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!store) redirect("/onboarding/store-setup");

  const { data: orders } = await supabase
    .from("orders")
    .select(`*, order_items(*), payments(*)`)
    .eq("store_id", store.id)
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
        <h1 className="page-title">الطلبات</h1>
        <p className="text-gray-500 mt-1">{orders?.length ?? 0} طلب إجمالي</p>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="card p-16 text-center">
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد طلبات بعد</h3>
          <p className="text-gray-400">ستظهر هنا الطلبات عندما يتسوق العملاء من متجرك</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card p-6">
              <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-xs text-gray-400">#{order.id.slice(0, 8)}</span>
                    <Badge variant={statusVariantMap[order.status] ?? "default"}>
                      {getOrderStatusLabel(order.status)}
                    </Badge>
                  </div>
                  <p className="font-semibold text-gray-900">{order.customer_name}</p>
                  <p className="text-sm text-gray-500">{order.customer_phone} • {order.customer_address}</p>
                </div>
                <div className="text-left">
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(order.total_amount)}</p>
                  <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                </div>
              </div>

              {/* Order items */}
              <div className="bg-gray-50 rounded-xl p-3 mb-4">
                <div className="space-y-1">
                  {order.order_items?.map((item: { id: string; product_name: string; quantity: number; product_price: number }) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.product_name} × {item.quantity}
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(item.product_price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment info */}
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm text-gray-500">
                  طريقة الدفع: <span className="font-medium text-gray-700">{getPaymentMethodLabel(order.payment_method)}</span>
                </span>
                {order.payments?.[0]?.receipt_url && (
                  <a
                    href={order.payments[0].receipt_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700"
                  >
                    <Receipt className="w-4 h-4" />
                    عرض الإيصال
                  </a>
                )}
              </div>

              {/* Status updater */}
              {order.status === "pending" && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <OrderStatusUpdater orderId={order.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
