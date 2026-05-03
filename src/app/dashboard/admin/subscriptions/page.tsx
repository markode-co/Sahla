import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { formatDate, getPlanLabel } from "@/lib/utils";
import { CreditCard, Clock, ImageIcon } from "lucide-react";
import { SubscriptionManager } from "./subscription-manager";

const SUPER_ADMIN_EMAIL = "ca.markode@gmail.com";

export default async function AdminSubscriptionsPage() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/login");
  if (user.email !== SUPER_ADMIN_EMAIL) {
    const { data: profile } = await authClient.from("users").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") redirect("/dashboard/merchant");
  }

  const supabase = createAdminClient();

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select(`*, users(email, full_name)`)
    .order("created_at", { ascending: false });

  const list = subscriptions ?? [];
  const pending = list.filter((s) => s.status === "pending");
  const rest = list.filter((s) => s.status !== "pending");
  const sorted = [...pending, ...rest];

  const statusVariant: Record<string, "default" | "success" | "warning" | "danger"> = {
    pending: "warning",
    active: "success",
    expired: "default",
    cancelled: "danger",
  };

  const statusLabel: Record<string, string> = {
    pending: "قيد المراجعة",
    active: "نشط",
    expired: "منتهي",
    cancelled: "ملغي",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">الاشتراكات</h1>
        <p className="text-gray-500 mt-1">
          {list.length} اشتراك
          {pending.length > 0 && (
            <span className="text-orange-600"> · {pending.length} ينتظر المراجعة</span>
          )}
        </p>
      </div>

      {list.length === 0 ? (
        <div className="card p-16 text-center">
          <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <p className="text-gray-400">لا توجد اشتراكات بعد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((sub) => {
            const merchant = sub.users as { full_name?: string; email: string } | null;
            const isPending = sub.status === "pending";

            return (
              <div
                key={sub.id}
                className={`card p-5 ${isPending ? "border-r-4 border-r-orange-400" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  {/* Merchant info */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isPending && <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />}
                      <span className="font-semibold text-gray-900 text-sm">
                        {merchant?.full_name ?? "—"}
                      </span>
                      <Badge variant={statusVariant[sub.status] ?? "default"}>
                        {statusLabel[sub.status] ?? sub.status}
                      </Badge>
                      <Badge variant="info">{getPlanLabel(sub.plan)}</Badge>
                    </div>
                    <p className="text-xs text-gray-400">{merchant?.email}</p>
                    <p className="text-xs text-gray-400">{formatDate(sub.started_at)}</p>
                  </div>

                  {/* Actions */}
                  <SubscriptionManager
                    subscriptionId={sub.id}
                    userId={sub.user_id}
                    currentPlan={sub.plan}
                    currentStatus={sub.status}
                  />
                </div>

                {/* Receipt */}
                {sub.receipt_url && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-start gap-3">
                    <img
                      src={sub.receipt_url}
                      alt="إيصال الدفع"
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <ImageIcon className="w-3.5 h-3.5 text-gray-400" />
                        <p className="text-xs text-gray-500">إيصال التحويل</p>
                      </div>
                      <a
                        href={sub.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-primary-600 hover:underline"
                      >
                        عرض كاملاً ↗
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
