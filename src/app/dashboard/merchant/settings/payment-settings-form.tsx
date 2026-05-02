"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { PaymentMethod } from "@/types";

export function PaymentSettingsForm({
  storeId,
  paymentMethod,
}: {
  storeId: string;
  paymentMethod: PaymentMethod | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    instapayUsername: paymentMethod?.instapay_username ?? "",
    bankName: paymentMethod?.bank_name ?? "",
    bankAccountNumber: paymentMethod?.bank_account_number ?? "",
    bankAccountName: paymentMethod?.bank_account_name ?? "",
    cashOnDelivery: paymentMethod?.cash_on_delivery ?? true,
  });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase.from("payment_methods").upsert({
      store_id: storeId,
      instapay_username: form.instapayUsername || null,
      bank_name: form.bankName || null,
      bank_account_number: form.bankAccountNumber || null,
      bank_account_name: form.bankAccountName || null,
      cash_on_delivery: form.cashOnDelivery,
    });

    if (error) {
      toast.error("حدث خطأ أثناء الحفظ");
    } else {
      toast.success("تم حفظ طرق الدفع");
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-primary-600" />
        </div>
        <h2 className="section-title">طرق الدفع</h2>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="label">اسم المستخدم على انستاباي</label>
          <input
            className="input-field"
            placeholder="@username"
            value={form.instapayUsername}
            onChange={(e) => setForm({ ...form, instapayUsername: e.target.value })}
          />
        </div>

        <div className="border-t border-gray-100 pt-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">التحويل البنكي</p>
          <div className="space-y-3">
            <input
              className="input-field"
              placeholder="اسم البنك"
              value={form.bankName}
              onChange={(e) => setForm({ ...form, bankName: e.target.value })}
            />
            <input
              className="input-field"
              placeholder="رقم الحساب"
              value={form.bankAccountNumber}
              onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })}
            />
            <input
              className="input-field"
              placeholder="اسم صاحب الحساب"
              value={form.bankAccountName}
              onChange={(e) => setForm({ ...form, bankAccountName: e.target.value })}
            />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-gray-700">الدفع عند الاستلام</span>
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={form.cashOnDelivery}
                onChange={(e) => setForm({ ...form, cashOnDelivery: e.target.checked })}
              />
              <div
                className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
                  form.cashOnDelivery ? "bg-primary-600" : "bg-gray-200"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform absolute top-0.5 ${
                    form.cashOnDelivery ? "translate-x-0.5" : "translate-x-6"
                  }`}
                />
              </div>
            </div>
          </label>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      </form>
    </div>
  );
}
