"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { updateStoreStatus } from "@/actions/admin";

export function MerchantActions({
  storeId,
  merchantName,
}: {
  storeId: string;
  merchantName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  async function handleApprove() {
    setLoading("approve");
    try {
      await updateStoreStatus(storeId, "approved");
      toast.success(`تم قبول متجر ${merchantName}`);
      router.refresh();
    } catch {
      toast.error("حدث خطأ أثناء القبول");
    }
    setLoading(null);
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      toast.error("يرجى إدخال سبب الرفض");
      return;
    }
    setLoading("reject");
    try {
      await updateStoreStatus(storeId, "rejected", rejectReason);
      toast.success("تم رفض المتجر");
      router.refresh();
    } catch {
      toast.error("حدث خطأ أثناء الرفض");
    }
    setLoading(null);
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleApprove}
          disabled={!!loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          {loading === "approve" ? "جاري..." : "قبول المتجر"}
        </button>
        <button
          onClick={() => setShowRejectInput(!showRejectInput)}
          disabled={!!loading}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <XCircle className="w-3.5 h-3.5" />
          رفض
        </button>
      </div>

      {showRejectInput && (
        <div className="flex gap-2">
          <input
            className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500"
            placeholder="سبب الرفض..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <button
            onClick={handleReject}
            disabled={!!loading}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg disabled:opacity-50"
          >
            {loading === "reject" ? "جاري..." : "تأكيد"}
          </button>
        </div>
      )}
    </div>
  );
}
