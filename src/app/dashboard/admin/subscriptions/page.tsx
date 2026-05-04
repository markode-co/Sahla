"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { formatDate, getPlanLabel } from "@/lib/utils";
import { CreditCard, Clock, ImageIcon } from "lucide-react";
import { SubscriptionManager } from "./subscription-manager";
import { ReceiptLink } from "@/components/receipt-link";

const SUPER_ADMIN_EMAIL = "ca.markode@gmail.com";

type Subscription = {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  receipt_url?: string;
  created_at: string;
  started_at?: string;
  users: {
    full_name?: string;
    email: string;
  } | null;
};

export default function AdminSubscriptionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
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

        const { data: subscriptionsData } = await supabase
          .from("subscriptions")
          .select(`*, users(email, full_name)`)
          .order("created_at", { ascending: false });

        setSubscriptions(subscriptionsData ?? []);
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
        <h1 className="page-title">الاشتراكات</h1>
        <div className="card p-16 text-center">
          <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-200 animate-pulse" />
          <p className="text-gray-500">جاري تحميل الاشتراكات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="page-title">الاشتراكات</h1>
        <div className="card p-16 text-center">
          <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <p className="text-gray-500">حدث خطأ في تحميل الاشتراكات</p>
          <p className="text-sm text-gray-400 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const pending = subscriptions.filter((s) => s.status === "pending");
  const rest = subscriptions.filter((s) => s.status !== "pending");
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
          {subscriptions.length} اشتراك
          {pending.length > 0 && (
            <span className="text-orange-600"> · {pending.length} ينتظر المراجعة</span>
          )}
        </p>
      </div>

      {subscriptions.length === 0 ? (
        <div className="card p-16 text-center">
          <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <p className="text-gray-400">لا توجد اشتراكات بعد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((sub) => {
            const merchant = sub.users;
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
                    <p className="text-xs text-gray-400">{formatDate(sub.started_at || sub.created_at)}</p>
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
                  <ReceiptLink receiptUrl={sub.receipt_url} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
