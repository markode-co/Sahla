"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getOrderStatusLabel, getPaymentMethodLabel } from "@/lib/utils";
import { ReceiptLink } from "@/components/receipt-link";
import { ShoppingCart, Clock } from "lucide-react";
import { OrderStatusUpdater } from "@/app/dashboard/merchant/orders/order-status-updater";
import { MerchantActions } from "@/app/dashboard/admin/merchants/merchant-actions";
import type { OrderStatus } from "@/types";

const SUPER_ADMIN_EMAIL = "ca.markode@gmail.com";

const statusVariantMap: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  pending: "warning",
  approved: "success",
  received: "success",
  preparing: "info",
  on_the_way: "info",
  rejected: "danger",
  cancelled: "default",
  delivered: "success",
};

const statusOrder: Record<string, number> = {
  pending: 0,
  approved: 1,
  received: 1,
  preparing: 2,
  on_the_way: 3,
  delivered: 4,
  rejected: 5,
  cancelled: 6,
};

type Order = {
  id: string;
  store_id: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_email: string | null;
  status: string;
  payment_method: string;
  notes: string | null;
  total_amount: number;
  created_at: string;
  updated_at: string;
  items: any[];
};

type Store = {
  id: string;
  name: string;
  slug: string;
  user_id: string;
  created_at: string;
};

type User = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
};

type Payment = {
  id: string;
  order_id: string;
  receipt_url: string | null;
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [storesMap, setStoresMap] = useState<Map<string, string>>(new Map());
  const [usersMap, setUsersMap] = useState<Map<string, User>>(new Map());
  const [paymentsMap, setPaymentsMap] = useState<Map<string, Payment>>(new Map());
  const [pendingStores, setPendingStores] = useState<(Store & { user: User })[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const authClient = createClient();
        const { data: { user } } = await authClient.auth.getUser();
        if (!user) {
          router.replace("/login");
          return;
        }
        if (user.email !== SUPER_ADMIN_EMAIL) {
          const { data: profile } = await authClient.from("users").select("role").eq("id", user.id).single();
          if (profile?.role !== "admin") {
            router.replace("/dashboard/merchant");
            return;
          }
        }

        const supabase = createClient();

        // ── Pending stores awaiting approval ──────────────────────────────────────
        const { data: pendingStoresData } = await supabase
          .from("stores")
          .select("id, name, slug, user_id, created_at")
          .eq("status", "pending")
          .order("created_at", { ascending: true });

        const pendingStoreUserIds = (pendingStoresData ?? []).map((s) => s.user_id);
        const usersMapTemp = new Map<string, User>();
        if (pendingStoreUserIds.length > 0) {
          const { data: users } = await supabase
            .from("users")
            .select("id, full_name, email, phone")
            .in("id", pendingStoreUserIds);
          (users ?? []).forEach((u) => usersMapTemp.set(u.id, u));
        }

        const pendingStoresWithUsers = (pendingStoresData ?? []).map(store => ({
          ...store,
          user: usersMapTemp.get(store.user_id)!,
        }));

        // ── Orders ────────────────────────────────────────────────────────────────
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        if (ordersError) {
          setError(ordersError.message);
          return;
        }

        const ordersList = ordersData ?? [];

        // Store names map
        const storeIds = Array.from(new Set(ordersList.map((o) => o.store_id).filter(Boolean)));
        const storesMapTemp = new Map<string, string>();
        if (storeIds.length > 0) {
          const { data: stores } = await supabase
            .from("stores")
            .select("id, name")
            .in("id", storeIds);
          (stores ?? []).forEach((s) => storesMapTemp.set(s.id, s.name));
        }

        // Users map for orders
        const userIds = Array.from(new Set(ordersList.map((o) => o.user_id).filter(Boolean)));
        const usersMapOrders = new Map<string, User>();
        if (userIds.length > 0) {
          const { data: users } = await supabase
            .from("users")
            .select("id, full_name, email, phone")
            .in("id", userIds);
          (users ?? []).forEach((u) => usersMapOrders.set(u.id, u));
        }

        // Payments map
        const orderIds = ordersList.map((o) => o.id);
        const paymentsMapTemp = new Map<string, Payment>();
        if (orderIds.length > 0) {
          const { data: payments } = await supabase
            .from("payments")
            .select("id, order_id, receipt_url")
            .in("order_id", orderIds);
          (payments ?? []).forEach((p) => paymentsMapTemp.set(p.order_id, p));
        }

        setOrders(ordersList);
        setStoresMap(storesMapTemp);
        setUsersMap(usersMapOrders);
        setPaymentsMap(paymentsMapTemp);
        setPendingStores(pendingStoresWithUsers);
      } catch (err) {
        setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="page-title">الطلبات والإجراءات</h1>
        <div className="card p-16 text-center">
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-200 animate-pulse" />
          <p className="text-gray-500">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  const sorted = [...orders].sort((a, b) => {
    const diff = (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
    if (diff !== 0) return diff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const pendingOrdersCount = sorted.filter((o) => o.status === "pending").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">الطلبات والإجراءات</h1>
        <p className="text-gray-500 mt-1">مراجعة المتاجر وإدارة طلبات العملاء</p>
      </div>

      {/* ── Section 1: Pending store approvals ──────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-500" />
          <h2 className="font-semibold text-gray-800 text-base">
            متاجر تنتظر الموافقة
            {pendingStores.length > 0 && (
              <span className="mr-2 text-sm font-normal text-orange-600">
                ({pendingStores.length})
              </span>
            )}
          </h2>
        </div>

        {pendingStores.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-gray-400 text-sm">لا توجد متاجر تنتظر الموافقة</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingStores.map((store) => {
              const merchant = store.user;
              return (
                <div key={store.id} className="card p-5 border-r-4 border-r-orange-400">
                  <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{store.name}</span>
                        <Badge variant="warning">قيد المراجعة</Badge>
                      </div>
                      <p className="text-sm text-primary-600">/store/{store.slug}</p>
                      {merchant && (
                        <div className="text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                          <span>{merchant.full_name ?? "—"}</span>
                          <span>{merchant.email}</span>
                          {merchant.phone && <span>{merchant.phone}</span>}
                        </div>
                      )}
                      <p className="text-xs text-gray-400">{formatDate(store.created_at)}</p>
                    </div>
                    <MerchantActions storeId={store.id} merchantName={store.name} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Section 2: Customer orders ───────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary-500" />
          <h2 className="font-semibold text-gray-800 text-base">
            طلبات العملاء
            <span className="mr-2 text-sm font-normal text-gray-500">
              ({orders.length} طلب
              {pendingOrdersCount > 0 && (
                <span className="text-orange-600"> · {pendingOrdersCount} معلّق</span>
              )}
              )
            </span>
          </h2>
        </div>

        {orders.length === 0 ? (
          <div className="card p-16 text-center">
            <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-200" />
            <p className="text-gray-400">لا توجد طلبات بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((order) => {
              const payment = paymentsMap.get(order.id);
              const isPending = order.status === "pending";

              return (
                <div
                  key={order.id}
                  className={`card p-5 ${isPending ? "border-r-4 border-r-orange-400" : ""}`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                        #{order.id.slice(0, 8)}
                      </span>
                      <Badge variant={statusVariantMap[order.status] ?? "default"}>
                        {getOrderStatusLabel(order.status)}
                      </Badge>
                      {isPending && (
                        <span className="text-xs text-orange-600 font-medium">⏳ ينتظر المراجعة</span>
                      )}
                    </div>
                    <span className="text-sm text-gray-400">{formatDate(order.created_at)}</span>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">العميل</p>
                      <p className="font-medium text-gray-900">{order.customer_name}</p>
                      <p className="text-xs text-gray-400">{order.customer_phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">المتجر</p>
                      <p className="font-medium text-gray-700">
                        {storesMap.get(order.store_id) ?? "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">المبلغ</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(order.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">طريقة الدفع</p>
                      <p className="text-gray-700">{getPaymentMethodLabel(order.payment_method)}</p>
                    </div>
                  </div>

                  {/* Receipt image */}
                  {payment?.receipt_url && (
                    <ReceiptLink receiptUrl={payment.receipt_url} />
                  )}

                  {/* Order actions — update next delivery stage */}
                  {!(order.status === "delivered" || order.status === "rejected" || order.status === "cancelled") && (
                    <div className="pt-3 border-t border-gray-100">
                      <OrderStatusUpdater orderId={order.id} status={order.status as OrderStatus} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
