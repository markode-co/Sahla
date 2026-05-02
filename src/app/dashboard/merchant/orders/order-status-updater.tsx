"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { updateOrderStatus } from "@/actions/orders";
import { useRouter } from "next/navigation";

export function OrderStatusUpdater({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handle(status: "approved" | "rejected" | "delivered") {
    setLoading(status);
    try {
      await updateOrderStatus(orderId, status);
      toast.success(
        status === "approved"
          ? "تم قبول الطلب"
          : status === "rejected"
          ? "تم رفض الطلب"
          : "تم تسليم الطلب"
      );
      router.refresh();
    } catch {
      toast.error("حدث خطأ");
    }
    setLoading(null);
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handle("approved")}
        disabled={!!loading}
        className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
      >
        <CheckCircle className="w-4 h-4" />
        {loading === "approved" ? "جاري..." : "قبول"}
      </button>
      <button
        onClick={() => handle("rejected")}
        disabled={!!loading}
        className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
      >
        <XCircle className="w-4 h-4" />
        {loading === "rejected" ? "جاري..." : "رفض"}
      </button>
    </div>
  );
}
