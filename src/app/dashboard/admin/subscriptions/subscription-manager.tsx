"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { deleteSubscription, updateSubscription } from "@/actions/admin";
import { useRouter } from "next/navigation";

export function SubscriptionManager({
  subscriptionId,
  userId,
  currentPlan,
  currentStatus,
}: {
  subscriptionId: string;
  userId: string;
  currentPlan: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(currentPlan);
  const [status, setStatus] = useState(currentStatus);

  async function handleSave(overrideStatus?: string) {
    setLoading(true);
    try {
      await updateSubscription(userId, plan, overrideStatus ?? status);
      toast.success("تم تحديث الاشتراك");
      router.refresh();
    } catch {
      toast.error("حدث خطأ");
    }
    setLoading(false);
  }

  async function handleDelete() {
    const ok = window.confirm("هل تريد حذف الاشتراك؟ هذه العملية لا يمكن التراجع عنها.");
    if (!ok) return;
    setLoading(true);
    try {
      await deleteSubscription(subscriptionId);
      toast.success("تم حذف الاشتراك");
      router.refresh();
    } catch {
      toast.error("حدث خطأ");
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={plan}
        onChange={(e) => setPlan(e.target.value)}
        disabled={loading}
        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700"
      >
        <option value="basic">أساسي — 8,000 جنيه</option>
        <option value="pro">احترافي — 10,000 جنيه</option>
        <option value="premium">مميز — 12,000 جنيه</option>
      </select>

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        disabled={loading}
        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700"
      >
        <option value="pending">قيد المراجعة</option>
        <option value="active">نشط</option>
        <option value="expired">منتهي</option>
        <option value="cancelled">ملغي</option>
      </select>

      <button
        onClick={() => handleSave()}
        disabled={loading}
        className="text-xs bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
      >
        {loading ? "..." : "حفظ"}
      </button>

      <button
        onClick={() => handleSave("cancelled")}
        disabled={loading}
        className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
      >
        {loading ? "..." : "إيقاف"}
      </button>

      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
      >
        {loading ? "..." : "حذف"}
      </button>
    </div>
  );
}
