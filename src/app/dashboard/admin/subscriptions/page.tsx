import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { formatDate, getPlanLabel } from "@/lib/utils";
import { CreditCard } from "lucide-react";
import { SubscriptionManager } from "./subscription-manager";

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select(`*, users(email, full_name)`)
    .order("created_at", { ascending: false });

  const statusVariant: Record<string, "default" | "success" | "warning" | "danger"> = {
    active: "success",
    expired: "warning",
    cancelled: "danger",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">الاشتراكات</h1>
        <p className="text-gray-500 mt-1">{subscriptions?.length ?? 0} اشتراك</p>
      </div>

      {!subscriptions || subscriptions.length === 0 ? (
        <div className="card p-16 text-center">
          <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-200" />
          <p className="text-gray-400">لا توجد اشتراكات بعد</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">التاجر</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">الخطة</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">الحالة</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">تاريخ البدء</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {(sub.users as { full_name?: string; email: string } | null)?.full_name ?? "-"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(sub.users as { full_name?: string; email: string } | null)?.email}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="info">{getPlanLabel(sub.plan)}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={statusVariant[sub.status] ?? "default"}>
                        {sub.status === "active" ? "نشط" : sub.status === "expired" ? "منتهي" : "ملغي"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{formatDate(sub.started_at)}</td>
                    <td className="px-6 py-4">
                      <SubscriptionManager
                        subscriptionId={sub.id}
                        userId={sub.user_id}
                        currentPlan={sub.plan}
                        currentStatus={sub.status}
                      />
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
