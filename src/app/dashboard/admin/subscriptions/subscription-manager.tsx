"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { updateSubscription } from "@/actions/admin";
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

  async function handleSave() {
    setLoading(true);
    try {
      await updateSubscription(userId, plan, status);
      toast.success("تم تحديث الاشتراك");
      router.refresh();
    } catch {
      toast.error("حدث خطأ");
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={plan}
        onChange={(e) => setPlan(e.target.value)}
        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700"
      >
        <option value="basic">أساسي</option>
        <option value="pro">احترافي</option>
        <option value="premium">مميز</option>
      </select>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700"
      >
        <option value="active">نشط</option>
        <option value="expired">منتهي</option>
        <option value="cancelled">ملغي</option>
      </select>
      <button
        onClick={handleSave}
        disabled={loading}
        className="text-xs bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
      >
        {loading ? "..." : "حفظ"}
      </button>
    </div>
  );
}
