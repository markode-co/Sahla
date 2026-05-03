import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, getOrderStatusLabel, getPaymentMethodLabel } from "@/lib/utils";
import { ShoppingCart, Clock } from "lucide-react";
import { OrderStatusUpdater } from "@/app/dashboard/merchant/orders/order-status-updater";
import { MerchantActions } from "@/app/dashboard/admin/merchants/merchant-actions";

const SUPER_ADMIN_EMAIL = "ca.markode@gmail.com";

const statusVariantMap: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  cancelled: "default",
  delivered: "info",
};

const statusOrder: Record<string, number> = {
  pending: 0,
  approved: 1,
  delivered: 2,
  rejected: 3,
  cancelled: 4,
};

export default async function AdminOrdersPage() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/login");
  if (user.email !== SUPER_ADMIN_EMAIL) {
    const { data: profile } = await authClient.from("users").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") redirect("/dashboard/merchant");
  }

  const supabase = createAdminClient();

  // ── Pending stores awaiting approval ──────────────────────────────────────
  const { data: pendingStores } = await supabase
    .from("stores")
    .select("id, name, slug, user_id, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const pendingStoreUserIds = (pendingStores ?? []).map((s) => s.user_id);
  const usersMap = new Map<string, { full_name: string | null; email: string; phone: string | null }>();
  if (pendingStoreUserIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, full_name, email, phone")
      .in("id", pendingStoreUserIds);
    (users ?? []).forEach((u) => usersMap.set(u.id, u));
  }

  // ── Orders ────────────────────────────────────────────────────────────────
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="page-title">الطلبات والإجراءات</h1>
        <div className="card p-16 text-center">
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <p className="text-gray-500">حدث خطأ في تحميل الطلبات</p>
          <p className="text-sm text-gray-400 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  const list = orders ?? [];

  // Store names map
  const storeIds = Array.from(new Set(list.map((o) => o.store_id).filter(Boolean)));
  const storesMap = new Map<string, string>();
  if (storeIds.length > 0) {
    const { data: stores } = await supabase
      .from("stores")
      .select("id, name")
      .in("id", storeIds);
    (stores ?? []).forEach((s) => storesMap.set(s.id, s.name));
  }

  // Payments map
  const orderIds = list.map((o) => o.id);
  const paymentsMap = new Map<string, { receipt_url: string | null }>();
  if (orderIds.length > 0) {
    const { data: payments } = await supabase
      .from("payments")
      .select("order_id, receipt_url")
      .in("order_id", orderIds);
    (payments ?? []).forEach((p) => paymentsMap.set(p.order_id, p));
  }

  // Sort: pending first
  const sorted = [...list].sort((a, b) => {
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
            {(pendingStores ?? []).length > 0 && (
              <span className="mr-2 text-sm font-normal text-orange-600">
                ({(pendingStores ?? []).length})
              </span>
            )}
          </h2>
        </div>

        {!pendingStores || pendingStores.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-gray-400 text-sm">لا توجد متاجر تنتظر الموافقة</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingStores.map((store) => {
              const merchant = usersMap.get(store.user_id);
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
              ({list.length} طلب
              {pendingOrdersCount > 0 && (
                <span className="text-orange-600"> · {pendingOrdersCount} معلّق</span>
              )}
              )
            </span>
          </h2>
        </div>

        {list.length === 0 ? (
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
                    <div className="mb-4 p-3 bg-gray-50 rounded-xl flex items-start gap-3">
                      <img
                        src={payment.receipt_url}
                        alt="إيصال التحويل"
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">صورة إيصال التحويل</p>
                        <a
                          href={payment.receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-primary-600 hover:underline"
                        >
                          عرض الصورة كاملة ↗
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Order actions — pending only */}
                  {isPending && (
                    <div className="pt-3 border-t border-gray-100">
                      <OrderStatusUpdater orderId={order.id} />
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
