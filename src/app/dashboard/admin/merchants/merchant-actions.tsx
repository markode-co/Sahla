"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { updateStoreStatus } from "@/actions/admin";
import { useRouter } from "next/navigation";

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
      toast.error("حدث خطأ");
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
      toast.error("حدث خطأ");
    }
    setLoading(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          disabled={!!loading}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          <CheckCircle className="w-4 h-4" />
          {loading === "approve" ? "جاري..." : "قبول المتجر"}
        </button>
        <button
          onClick={() => setShowRejectInput(!showRejectInput)}
          className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium rounded-xl transition-colors"
        >
          <XCircle className="w-4 h-4" />
          رفض المتجر
        </button>
      </div>

      {showRejectInput && (
        <div className="flex gap-2">
          <input
            className="input-field flex-1 text-sm"
            placeholder="سبب الرفض..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <button
            onClick={handleReject}
            disabled={!!loading}
            className="btn-danger text-sm px-4"
          >
            {loading === "reject" ? "جاري..." : "تأكيد الرفض"}
          </button>
        </div>
      )}
    </div>
  );
}
