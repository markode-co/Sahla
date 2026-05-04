"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, ArrowLeft, Smartphone, Building2, Truck } from "lucide-react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { stripMissingPostgrestColumns } from "@/lib/utils";

export default function PaymentSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    instapayUsername: "",
    bankName: "",
    bankAccountNumber: "",
    bankAccountName: "",
    cashOnDelivery: true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.instapayUsername && !form.bankName && !form.cashOnDelivery) {
      toast.error("يرجى إضافة طريقة دفع واحدة على الأقل");
      return;
    }

    if (form.instapayUsername && form.instapayUsername.trim() === "") {
      toast.error("يرجى إدخال اسم مستخدم صحيح للإنستاباي");
      return;
    }

    if (form.bankName) {
      if (!form.bankAccountNumber || !form.bankAccountName) {
        toast.error("يرجى إدخال جميع بيانات التحويل البنكي");
        return;
      }
      if (form.bankAccountNumber.trim() === "" || form.bankAccountName.trim() === "") {
        toast.error("يرجى إدخال بيانات صحيحة للتحويل البنكي");
        return;
      }
    }

    setLoading(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!store) {
      toast.error("لم يتم العثور على المتجر");
      router.push("/onboarding/store-setup");
      return;
    }

    const method = form.instapayUsername.trim() ? 'instapay' : 
                   form.bankName.trim() ? 'bank_transfer' : 
                   'cash_on_delivery';

    const insertPayload = {
      store_id: store.id,
      method,
      instapay_username: form.instapayUsername.trim() || null,
      bank_name: form.bankName.trim() || null,
      bank_account_number: form.bankAccountNumber.trim() || null,
      bank_account_name: form.bankAccountName.trim() || null,
      cash_on_delivery: form.cashOnDelivery,
    };
    const updatePayload = {
      method,
      instapay_username: form.instapayUsername.trim() || null,
      bank_name: form.bankName.trim() || null,
      bank_account_number: form.bankAccountNumber.trim() || null,
      bank_account_name: form.bankAccountName.trim() || null,
      cash_on_delivery: form.cashOnDelivery,
    };

    const { data: existing, error: selectError } = await supabase
      .from("payment_methods")
      .select("id")
      .eq("store_id", store.id)
      .maybeSingle();

    if (selectError) {
      console.error("Payment method lookup error:", JSON.stringify(selectError, null, 2));
      toast.error("حدث خطأ أثناء التحقق من طرق الدفع");
      setLoading(false);
      return;
    }

    let currentPayload = existing?.id ? updatePayload : insertPayload;
    let error = null as any;

    do {
      ({ error } = await (existing?.id
        ? supabase.from("payment_methods").update(currentPayload).eq("id", existing.id)
        : supabase.from("payment_methods").insert(currentPayload)));

      if (!error) break;

      const sanitizedPayload = stripMissingPostgrestColumns(currentPayload, error);
      const payloadChanged = Object.keys(sanitizedPayload).length !== Object.keys(currentPayload).length;
      currentPayload = sanitizedPayload;
      if (!payloadChanged) break;
    } while (error);

    if (error) {
      console.error("Payment method save error:", JSON.stringify(error, null, 2));
      toast.error(error.message || "حدث خطأ، يرجى المحاولة مجدداً");
      setLoading(false);
      return;
    }

    toast.success("تم حفظ طرق الدفع!");
    router.push("/onboarding/documents");
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">طرق الدفع</h1>
            <p className="text-sm text-gray-500">الخطوة 2 من 4</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Instapay */}
          <div className="p-4 border border-gray-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-gray-800">انستاباي</span>
            </div>
            <input
              type="text"
              placeholder="اسم المستخدم على انستاباي"
              className="input-field"
              value={form.instapayUsername}
              onChange={(e) => setForm({ ...form, instapayUsername: e.target.value })}
            />
            <p className="text-xs text-gray-500">يمكن استخدام رقم انستاباي الرسمي: +201090886364</p>
          </div>

          {/* Bank Transfer */}
          <div className="p-4 border border-gray-200 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-800">تحويل بنكي</span>
            </div>
            <input
              type="text"
              placeholder="اسم البنك"
              className="input-field"
              value={form.bankName}
              onChange={(e) => setForm({ ...form, bankName: e.target.value })}
            />
            <input
              type="text"
              placeholder="رقم الحساب"
              className="input-field"
              value={form.bankAccountNumber}
              onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })}
            />
            <input
              type="text"
              placeholder="اسم صاحب الحساب"
              className="input-field"
              value={form.bankAccountName}
              onChange={(e) => setForm({ ...form, bankAccountName: e.target.value })}
            />
            <p className="text-xs text-gray-500">التحويل البنكي سيتم تفعيله قريباً، يمكنك استخدام انستاباي الآن.</p>
          </div>

          {/* Cash on Delivery */}
          <div className="p-4 border border-gray-200 rounded-xl">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-green-600" />
                <div>
                  <span className="font-semibold text-gray-800 block">الدفع عند الاستلام</span>
                  <span className="text-xs text-gray-400">يدفع العميل عند وصول الطلب</span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={form.cashOnDelivery}
                  onChange={(e) => setForm({ ...form, cashOnDelivery: e.target.checked })}
                />
                <div
                  className={`w-12 h-6 rounded-full transition-colors ${
                    form.cashOnDelivery ? "bg-primary-600" : "bg-gray-200"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform absolute top-0.5 ${
                      form.cashOnDelivery ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </div>
              </div>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary flex-1"
            >
              السابق
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowLeft className="w-5 h-5" />
              )}
              {loading ? "جاري الحفظ..." : "التالي: المستندات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
