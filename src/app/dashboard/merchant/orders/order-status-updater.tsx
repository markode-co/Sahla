"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Truck, Slash } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "@/actions/orders";
import type { OrderStatus } from "@/types";

interface OrderStatusUpdaterProps {
  orderId: string;
  status: OrderStatus;
}

export function OrderStatusUpdater({ orderId, status }: OrderStatusUpdaterProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const actions = status === "pending"
    ? [
        { id: "approved", label: "قبول", icon: CheckCircle, color: "bg-green-600 hover:bg-green-700" },
        { id: "rejected", label: "رفض", icon: XCircle, color: "bg-red-600 hover:bg-red-700" },
      ]
    : status === "approved"
    ? [
        { id: "delivered", label: "تسليم", icon: Truck, color: "bg-blue-600 hover:bg-blue-700" },
        { id: "cancelled", label: "إلغاء", icon: Slash, color: "bg-gray-600 hover:bg-gray-700" },
      ]
    : [];

  async function handle(statusToUpdate: OrderStatus) {
    setLoading(statusToUpdate);
    try {
      await updateOrderStatus(orderId, statusToUpdate);
      toast.success(
        statusToUpdate === "approved"
          ? "تم قبول الطلب"
          : statusToUpdate === "rejected"
          ? "تم رفض الطلب"
          : statusToUpdate === "delivered"
          ? "تم تسليم الطلب"
          : "تم إلغاء الطلب"
      );
      router.refresh();
    } catch {
      toast.error("حدث خطأ");
    }
    setLoading(null);
  }

  if (actions.length === 0) {
    return (
      <div className="text-sm text-gray-500">لا توجد إجراءات إضافية لهذه الحالة.</div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            type="button"
            onClick={() => handle(action.id as OrderStatus)}
            disabled={!!loading}
            className={`flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 ${action.color}`}
          >
            <Icon className="w-4 h-4" />
            {loading === action.id ? "جاري..." : action.label}
          </button>
        );
      })}
    </div>
  );
}
